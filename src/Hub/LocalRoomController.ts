import { Publicity } from "jormun-sdk/dist/ApiTypes/Publish";
import { Jormun } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { RoomDirectory } from "../Data/RoomDirectory";
import { RoomInfo } from "../Data/RoomInfo";
import { RoomRoot } from "../Data/RoomRoot";
import { RoomUserData } from "../Data/RoomUserData";
import { Hub } from "./Hub";
import { RemoteRoomController } from "./RemoteRoomController";
import { Room } from "./DataController";
import { B64URL } from "../www/Components/Utility/B64URL";
import { OnStatusChange } from "../Utils/StatusChanging";

declare class QRCode
{
    public constructor(element: HTMLDivElement, options: { text: string, width: number, height: number, colorDark: string, colorLight: string });
};

export class LocalRoomController
{
    private hub: Hub;
    public constructor(hub: Hub)
    {
        this.hub = hub;
    }
    public canCreateRoom(): boolean
    {
        return this.hub.jormun.getStatus().loggedIn;
    }
    public async getDirectory(): Promise<RoomDirectory>
    {
        const data = await this.hub.jormun.add("room_directory", {
            rooms: []
        } as RoomDirectory);
        return await data.get() as RoomDirectory;
    }
    public async setDirectory(data: RoomDirectory, sync: boolean)
    {
        await (await this.hub.jormun.add("room_directory", data)).set(data);
        if (sync) this.hub.jormun.sync();
    }
    public async createRoomCache(host: string, key: string, root: RoomRoot, users: RoomUserData[] | null, onStatusChange: OnStatusChange)
    {
        await onStatusChange("Fetching directory...");
        const directory = await this.getDirectory();
        await onStatusChange("Creating room cache...");
        const room = directory.rooms.find(r => r.host === host && r.roomRootKey === key);
        if (!room) return;
        const original = JSON.stringify(room);
        if (!room.cache) room.cache = { name: "", users: [], timestamp: Date.now(), lastActivity: Date.now() };
        room.cache.name = root.name;

        const balanceData: Room = {
            info: room,
            fetching: false,
            balances: [],
            fullTransactionList: [],
            users: users ?? undefined,
            root: root
        }
        this.hub.dataController.recalculateBalances(balanceData);
        if (users)
        {
            room.cache.users = users.map(u =>
            {
                return {
                    userId: u.userId,
                    name: u.name,
                    balances: ((balanceData.balances.find(b => b.userId === u.userId)?.balances ?? []))
                }
            });
            for (const user of users)
            {
                for (const transaction of user.transactions)
                {
                    if (transaction.time > room.cache.lastActivity) room.cache.lastActivity = transaction.time;
                }
            }
        }
        if (JSON.stringify(room) !== original)
        {
            await onStatusChange("Saving directory...");
            await this.setDirectory(directory, true);
        }
    }
    public async leaveRoom(host: string, key: string, onStatusChange: OnStatusChange)
    {
        await onStatusChange("Fetching directory...");
        const directory = await this.getDirectory();
        const room = directory.rooms.find(r => r.host === host && r.roomRootKey === key);
        if (!room) return;
        if (await this.hub.jormun.ask(`Leave ${room.cache?.name}?`, `Are you sure you want to leave ${room.cache?.name}? You can rejoin it later.`, ["Yes", "No"]) !== 0) return;
        directory.rooms = directory.rooms.filter(r => r !== room);
        await onStatusChange("Setting directory...");
        await this.setDirectory(directory, true);
        await this.hub.dataController.fetchDirectory(s => onStatusChange(s));
    }
    public async destroyRoom(host: string, key: string, onStatusChange: OnStatusChange)
    {
        if (!this.hub.jormun.getStatus().connected) return false;
        const remote = this.hub.jormun.getRemote();
        const status = remote.cachedStatus();
        if (!status) return;
        const parsed = Key.parse(key, status.userId);
        if (!parsed) return;
        const data = this.hub.jormun.me(parsed.fragment);
        if (!data) return;
        await onStatusChange("Fetching room root...");
        const value: RoomRoot = await data.get();
        if (value)
        {
            if (await this.hub.jormun.ask(`Delete ${value.name}?`, `Are you sure you want to delete ${value.name}? It cannot be recovered!`, ["Yes", "No"]) !== 0) return;
            await onStatusChange("Synchronizing...");
            await this.hub.jormun.sync();
            for (const user of Object.values(value.users))
            {
                const parsedUser = Key.parse(user.userDataKey, status.userId);
                if (!parsedUser) continue;
                const userData = this.hub.jormun.me(parsedUser.fragment);
                if (!userData) continue;
                await onStatusChange(`Removing user ${user.userId}`);
                await userData.remove();
            }
        }
        await onStatusChange(`Removing room root...`);
        await data.remove();

        await onStatusChange(`Getting directory...`);
        const directory = await this.getDirectory();
        const roomInfo = directory.rooms.find(r => r.host === host && r.roomRootKey === key);
        if (roomInfo)
        {
            directory.rooms = directory.rooms.filter(r => r !== roomInfo);
            await onStatusChange(`Setting directory...`);
            await this.setDirectory(directory, false);
        }
        await this.hub.jormun.sync();
        await this.hub.dataController.fetchDirectory(s => onStatusChange(s));
    }
    public getJoinURL(host: string, key: string)
    {
        return `${location.protocol}//${location.host}${location.pathname}#${this.getJoinHash(host, key)}`;
    }
    public getJoinHash(host: string, key: string)
    {
        if (host.startsWith("https://")) host = host.substring("https://".length);
        host = B64URL.ToBase64(host);
        const parsed = Key.parse(key, -1);
        if (!parsed) return "";
        if (!parsed.fragment.startsWith("room_")) return "";
        const roomId = parsed.fragment.substring("room_".length);
        return `/join/${host}/${parsed.userId}/${roomId}`;
    }
    public async getJoinQRCode(link: string)
    {
        const element = document.createElement("div");
        new QRCode(element, { text: link, width: 180, height: 180, colorDark: "#000000", colorLight: "#ffffff" });
        const canvas = element.querySelector("canvas") as HTMLCanvasElement;
        return canvas.toDataURL();
    }
    public async setRoomDead(host: string, key: string, dead: boolean)
    {
        const directory = await this.getDirectory();
        const room = directory.rooms.find(r => r.host === host && r.roomRootKey === key);
        if (!room) return;
        if (room.dead === dead) return;
        room.dead = dead;
        await this.setDirectory(directory, true);
    }
    public async isMine(info: RoomInfo)
    {
        if (!this.hub.jormun.getStatus().connected) return false;
        const hashedRemote = await this.hub.jormun.hashedRemote();
        const status = this.hub.jormun.getRemote().cachedStatus();
        if (!hashedRemote || !hashedRemote.host || !status) return false;
        const key = Key.parse(info.roomRootKey, -1);
        if (!key) return false;
        return info.host === hashedRemote.host && key.userId === status.userId;
    }

    public async createRoom(roomName: string, users: string[], onStatusChange: OnStatusChange)
    {
        const remote = this.hub.jormun.getRemote();
        const status = remote.cachedStatus();
        if (!status) return;
        await this.hub.jormun.sync();
        await onStatusChange("Generating room id...");
        let roomId = "";
        while (!roomId || !!(await this.hub.jormun.me(`room_${roomId}`)?.get()))
        {
            roomId = Math.random().toString().substring(2);
        }
        const root: RoomRoot = {
            name: roomName,
            roomId: roomId,
            users: {},
            guestToken: "",
            guestTokenId: ""
        };
        await onStatusChange("Creating room root...");
        const data = await this.hub.jormun.add(`room_${roomId}`, root);
        await data.set(root);
        await onStatusChange("Synchronizing...");
        await this.hub.jormun.sync();
        await onStatusChange("Making room root unlisted...");
        await remote.publish([{ key: data.getKey(), publicity: "unlisted" }]);
        await this.createUsers(roomId, users, false, s => onStatusChange(s));
        await onStatusChange("Fetchin host...");
        const host = (await this.hub.jormun.hashedRemote()).host;
        const rootKey = data.getKey().stringifyRemote(status.userId);
        await this.hub.remoteRoomController.joinRoom(host, rootKey, s => onStatusChange(s));
        await this.hub.dataController.fetchDirectory(s => onStatusChange(s));
    }
    public async createUsers(roomId: string, usernames: string[], syncFirst: boolean, onStatusChange: OnStatusChange)
    {
        if (syncFirst)
        {
            await onStatusChange("Synchronizing...");
            await this.hub.jormun.sync();
        }
        const remote = this.hub.jormun.getRemote();
        const roomRootData = this.hub.jormun.me(`room_${roomId}`);
        if (!roomRootData) return;
        await onStatusChange("Fetching room root...");
        const roomRoot = await roomRootData.get() as RoomRoot;
        if (!roomRoot) return;
        const status = remote.cachedStatus();
        if (!status) return;
        for (const username of usernames)
        {
            let userId = "";
            await onStatusChange(`Creating user id for ${username}...`);
            while (!userId || roomRoot.users.hasOwnProperty(userId))
            {
                userId = Math.random().toString().substring(2);
            }
            const userData: RoomUserData = {
                name: username,
                userId,
                transactions: []
            };
            await onStatusChange(`Creating data entry for ${username}...`);
            const data = await this.hub.jormun.add(`room_${roomId}_user_${userId}`, userData);
            await data.set(userData);

            roomRoot.users[userId] = {
                userId: userId,
                userDataKey: data.getKey().stringifyRemote(status.userId)
            };
        }
        await onStatusChange("Synchronizing...");
        await this.hub.jormun.sync();

        if (roomRoot.guestTokenId)
        {
            await onStatusChange("Clearing old invitation token...");
            await remote.uninvite([roomRoot.guestTokenId]);
        }
        const userKeys = Object.values(roomRoot.users).map(u => Key.parse(u.userDataKey, -1)).filter(u => !!u) as Key[];
        await onStatusChange("Creating new invitation token...");
        const invitiation = await remote.invite(userKeys);
        if (invitiation)
        {
            roomRoot.guestToken = invitiation.guestToken;
            roomRoot.guestTokenId = invitiation.guestTokenId;
        }

        await onStatusChange("Updating room root...");
        await roomRootData.set(roomRoot);
        await onStatusChange("Synchronizing...");
        await this.hub.jormun.sync();
    }

    public async changeRoomName(roomId: string, newName: string, onStatusChange: OnStatusChange)
    {
        await onStatusChange("Synchronizing...");
        await this.hub.jormun.sync();
        const remote = this.hub.jormun.getRemote();
        const roomRootData = this.hub.jormun.me(`room_${roomId}`);
        if (!roomRootData) return;
        await onStatusChange("Fetching room root...");
        const roomRoot = await roomRootData.get() as RoomRoot;
        if (!roomRoot) return;
        roomRoot.name = newName;
        await onStatusChange("Updating room root...");
        await roomRootData.set(roomRoot);
        await onStatusChange("Synchronizing...");
        await this.hub.jormun.sync();
    }

    public async selectUserId(host: string, key: string, userId: string, onStatusChange: OnStatusChange)
    {
        await onStatusChange("Fetching directory...");
        const directory = await this.getDirectory();
        const room = directory.rooms.find(r => r.host === host && r.roomRootKey === key);
        if (!room) return;
        if (room.selectedUserId === userId) return;
        room.selectedUserId = userId;
        await onStatusChange("Setting directory...");
        await this.setDirectory(directory, true);
        await this.hub.dataController.fetchDirectory(s => onStatusChange(s));
        this.hub.update();
    }

    public async saveImage(image: string, onStatusChange: OnStatusChange)
    {
        let id = "";
        while (!id || !!this.hub.jormun.me(`image_${id}`))
        {
            id = Math.random().toString().substring(2);
        }
        const remote = this.hub.jormun.getRemote();
        const status = remote.cachedStatus();
        if (!status) return null;
        await onStatusChange("Saving image locally...");
        const data = await this.hub.jormun.add(`image_${id}`, image);
        await data.set(image);
        await onStatusChange("Synchronizing...");
        await this.hub.jormun.sync();
        await onStatusChange("Making unlisted...");
        await remote.publish([{ key: data.getKey(), publicity: "unlisted" }]);
        await onStatusChange("Getting local room directory...");
        const directory = await this.getDirectory();
        if (!directory.submittedImageFragments) directory.submittedImageFragments = [];
        directory.submittedImageFragments.push(`image_${id}`);
        await onStatusChange("Setting local room directory...");
        await this.setDirectory(directory, true);
        await onStatusChange("Fetching host...");
        const host = (await this.hub.jormun.hashedRemote()).host;
        return { host: host, key: data.getKey().stringifyRemote(status.userId) };
    }

}
