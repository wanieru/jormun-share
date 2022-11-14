import { Publicity } from "jormun-sdk/dist/ApiTypes/Publish";
import { Jormun } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { RoomDirectory } from "../Data/RoomDirectory";
import { RoomInfo } from "../Data/RoomInfo";
import { RoomRoot } from "../Data/RoomRoot";
import { RoomUserData } from "../Data/RoomUserData";
import { Hub } from "./Hub";

export class RemoteRoomController
{
    private hub: Hub;
    public constructor(hub: Hub)
    {
        this.hub = hub;
    }
    public async joinRoom(host: string, roomKey: string, onStatusChange: (status: string) => void)
    {
        onStatusChange("Fetching local room directory...");
        const directory = await this.hub.localRoomController.getDirectory();
        if (directory.rooms.some(r => r.host === host && r.roomRootKey === roomKey)) return;
        const key = Key.parse(roomKey, -1);
        if (!key) return;
        const roomInfo: RoomInfo = {
            host: host,
            roomRootKey: roomKey,
            dead: false,
            cache: {
                name: "",
                users: [],
                timestamp: Date.now(),
                lastActivity: Date.now()
            }
        };
        const room = await this.getRoomFull(roomInfo, s => onStatusChange(s));
        if (!room) return;
        directory.rooms.push(roomInfo);
        onStatusChange("Saving local room directory...");
        await this.hub.localRoomController.setDirectory(directory, false);
        await this.hub.localRoomController.createRoomCache(host, roomKey, room.room, room.users, s => onStatusChange(s));
        await this.hub.dataController.fetchDirectory(s => onStatusChange(s));
    }
    public async getRoomFull(info: RoomInfo, onStatusChange: (status: string) => void): Promise<{ room: RoomRoot, users: RoomUserData[] } | null>
    {
        const room = await this.getRoomRoot(info, s => onStatusChange(s));
        if (!room) return null;
        const users = await this.getRoomUserData(info, room, s => onStatusChange(s));
        if (!users) return null;
        return {
            room, users
        };
    }
    public async getRoomUserData(info: RoomInfo, root: RoomRoot, onStatusChange: (status: string) => void)
    {
        onStatusChange("Creating anonymous remote...");
        const remote = await Jormun.getAnonymousRemote(Hub.app, info.host, a => this.hub.alert.handleAlert(a));
        onStatusChange("Checking connection...");
        if (!await remote.connected()) return null;
        const userKeys = Object.values(root.users).map(u => Key.parse(u.userDataKey, -1)).filter(u => !!u) as Key[];
        onStatusChange("Fetching user data...");
        const users = Object.values((await remote.getAsGuest(userKeys, root.guestToken)) ?? {}) as RoomUserData[];
        return users;
    }
    public async getRoomRoot(info: RoomInfo, onStatusChange: (status: string) => void)
    {
        const key = Key.parse(info.roomRootKey, -1);
        if (!key) return null;

        onStatusChange("Creating anonymous remote...");
        const remote = await Jormun.getAnonymousRemote(Hub.app, info.host, a => this.hub.alert.handleAlert(a));
        onStatusChange("Checking connection...");
        if (!await remote.connected()) return null;

        onStatusChange("Fetching room data...");
        const peek = await remote.peek([key]);
        if (!peek) return null;
        if (!peek.hasOwnProperty(info.roomRootKey)) return null;

        const room = peek[info.roomRootKey] as RoomRoot;
        return room;
    }
}