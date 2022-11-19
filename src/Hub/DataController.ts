import { GetResponse } from "jormun-sdk/dist/ApiTypes/Get";
import { Jormun } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { RoomInfo } from "../Data/RoomInfo";
import { RoomRoot } from "../Data/RoomRoot";
import { NewTransactionData, RoomTransaction } from "../Data/RoomTransaction";
import { RoomUserData } from "../Data/RoomUserData";
import { UserId } from "../Data/UserId";
import { Currencies } from "../Utils/Currencies";
import { Numbers } from "../Utils/Numbers";
import { OnStatusChange } from "../Utils/StatusChanging";
import { Wait } from "../Utils/Wait";
import { Hub } from "./Hub";

export type Room = {
    info: RoomInfo,
    root?: RoomRoot,
    users?: RoomUserData[],
    isMine?: boolean,
    fetching: boolean,
    fullTransactionList: RoomTransaction[],
    balances: { userId: UserId, balances: { currency: string, balance: number }[] }[]
};
export class DataController
{
    private hub: Hub;
    private rooms: Room[] = [];
    private fetching = false;
    private imageCache: { host: string, key: string, data: string }[] = [];

    private lastCurrency = "USD";

    public constructor(hub: Hub)
    {
        this.hub = hub;
        this.fetchDirectory(() => { });
        this.fetchLastCurrency();
    }
    public getRooms(): Room[]
    {
        return this.rooms;
    }
    public async fetchDirectory(onStatusChange: OnStatusChange)
    {
        if (this.fetching) return;
        this.fetching = true;
        await onStatusChange("Waiting for jormun to initialize...");
        await Wait.until(() => this.hub.jormun.getStatus().initialized);
        await onStatusChange("Fetching directory...");
        const directory = await this.hub.localRoomController.getDirectory();
        if (!directory) return;
        let newRooms = false;
        for (const room of directory.rooms)
        {
            const existing = this.rooms.find(r => r.info.host === room.host && r.info.roomRootKey === room.roomRootKey);
            if (existing) 
            {
                if (JSON.stringify(existing.info) !== JSON.stringify(room))
                {
                    existing.info = room;
                    newRooms = true;
                }
                continue;
            }
            const obj: Room = { info: room, fetching: false, fullTransactionList: [], balances: [] };
            this.rooms.push(obj);
            this.fetchRoomInternal(obj, false, false, () => { });
        }
        for (const room of [...this.rooms])
        {
            if (directory.rooms.some(r => r.host === room.info.host && r.roomRootKey === room.info.roomRootKey)) continue;
            this.rooms = this.rooms.filter(r => r !== room);
        }
        if (newRooms)
        {
            this.hub.update();
        }
        this.fetching = false;
    }
    public async fetchRoom(host: string, key: string, full: boolean, force: boolean, onStatusChange: OnStatusChange)
    {
        let element = this.rooms.find(r => r.info.host === host && r.info.roomRootKey === key);
        if (!element)
        {
            await onStatusChange("Fetching directory...");
            await this.fetchDirectory(s => onStatusChange(s));
            element = this.rooms.find(r => r.info.host === host && r.info.roomRootKey === key);
        }
        if (!element) return;
        await this.fetchRoomInternal(element, full, force, onStatusChange);
    }
    private async fetchRoomInternal(room: Room, full: boolean, force: boolean, onStatusChange: OnStatusChange)
    {
        await onStatusChange("Waiting for ongonig fetch to finish...");
        await Wait.until(() => !room.fetching);
        room.fetching = true;
        if (force || !room.root)
        {
            await onStatusChange("Fetching room root...");
            const root = await this.hub.remoteRoomController.getRoomRoot(room.info, s => { });
            if (!root)
            {
                await onStatusChange("Setting room as dead...");
                await this.hub.localRoomController.setRoomDead(room.info.host, room.info.roomRootKey, true);
                this.hub.update();
                return;
            }
            if (room.info.dead) 
            {
                await onStatusChange("Setting room as active...");
                await this.hub.localRoomController.setRoomDead(room.info.host, room.info.roomRootKey, false);
            }
            room.root = root;
        }
        if (typeof room.isMine !== "boolean" || force) 
        {
            await onStatusChange("Determining ownership of room...");
            room.isMine = await this.hub.localRoomController.isMine(room.info);
        }
        if (full)
        {
            if (!room.users || force)
            {
                const users = await this.hub.remoteRoomController.getRoomUserData(room.info, room.root, s => onStatusChange(s));
                if (users) 
                {
                    room.users = users;
                    await this.hub.localRoomController.createRoomCache(room.info.host, room.info.roomRootKey, room.root, room.users, s => onStatusChange(s));
                    await onStatusChange("Recalculating balances...");
                    this.recalculateBalances(room);
                }

            }
        }
        room.fetching = false;
        this.hub.update();
    }
    public recalculateBalances(room: Room)
    {
        if (!room.users) return;
        room.users.forEach(u => u.transactions.forEach(t => t.creatorId = u.userId));
        room.fullTransactionList = room.users.reduce((list, user) => list.concat(user.transactions), [] as RoomTransaction[]);
        room.fullTransactionList.sort((a, b) => a.time - b.time);
        room.balances = [];
        for (const transaction of room.fullTransactionList)
        {
            const creditorBalance = this.getUserBalanceObject(room, transaction.creditor, transaction.currency);
            for (const debtor of transaction.debtors)
            {
                const debtorBalance = this.getUserBalanceObject(room, debtor.user, transaction.currency);
                debtorBalance.balance -= debtor.amount;
                creditorBalance.balance += debtor.amount;
            }
        }
        for (const user of room.balances)
        {
            for (const currency of user.balances)
            {
                currency.balance = Currencies.parse(currency.balance, currency.currency);
            }
        }
    }
    private getUserBalanceObject(room: Room, userId: UserId, currency: string)
    {
        let creditor = room.balances.find(b => b.userId === userId);
        if (!creditor)
        {
            creditor = { userId: userId, balances: [] };
            room.balances.push(creditor);
        }
        let creditorBalance = creditor.balances.find(b => b.currency === currency);
        if (!creditorBalance)
        {
            creditorBalance = { currency: currency, balance: 0 };
            creditor.balances.push(creditorBalance);
        }
        return creditorBalance;
    }

    private getRoomAndUser(host: string, key: string)
    {
        const room = this.rooms.find(r => r.info.host === host && r.info.roomRootKey === key);
        if (!room) return null;
        if (!room.info.selectedUserId) return { room };
        if (!room.users) return { room };
        const userData = room.users.find(u => u.userId === room.info.selectedUserId) ?? null;
        const userInfo = room.root?.users[room.info.selectedUserId] ?? null;
        return { room, userData, userInfo };
    }
    private isTransactionValid(data: NewTransactionData)
    {
        if (!Currencies.appromixatelySame(Numbers.sum(data.debtors.map(d => d.amount)), data.amount, data.currency)) return false;
        return true;
    }
    private getNewTransactionId(room: Room)
    {
        let transactionId = "";
        while (!transactionId || room.fullTransactionList.some(t => t.transactionId === transactionId))
        {
            transactionId = Math.random().toString().substring(2);
        }
        return transactionId;
    }
    public async addTransction(host: string, key: string, data: NewTransactionData, onStatusChange: OnStatusChange)
    {
        const roomAndUser = this.getRoomAndUser(host, key);
        if (!roomAndUser?.room || !roomAndUser?.userData || !roomAndUser?.userInfo || !roomAndUser.room.root || !roomAndUser.room.users) return;

        if (!this.isTransactionValid(data)) return;

        let transactionId = this.getNewTransactionId(roomAndUser.room);
        const transaction: RoomTransaction = {
            ...data,
            transactionId,
            time: Date.now(),
            creatorId: roomAndUser.userData.userId
        };
        roomAndUser.userData.transactions.push(transaction);

        await this.saveUser(host, key, roomAndUser, s => onStatusChange(s));
    }
    public async editTransaction(host: string, key: string, id: string, data: NewTransactionData, onStatusChange: OnStatusChange)
    {
        const roomAndUser = this.getRoomAndUser(host, key);
        if (!roomAndUser?.room || !roomAndUser?.userData || !roomAndUser?.userInfo || !roomAndUser.room.root || !roomAndUser.room.users) return;

        if (!this.isTransactionValid(data)) return;

        const existingTransaction = roomAndUser.userData.transactions.find(t => t.transactionId === id);
        if (!existingTransaction) return;
        for (const key in data) (existingTransaction as any)[key] = (data as any)[key];

        await this.saveUser(host, key, roomAndUser, s => onStatusChange(s));

        const message: NewTransactionData = {
            amount: 0,
            debtors: [],
            creditor: roomAndUser.userInfo.userId,
            message: `${roomAndUser.userData.name} edited an entry from ${new Date(existingTransaction?.time ?? 0).toLocaleString()}.`,
            currency: ""
        }
        await this.addTransction(host, key, message, s => onStatusChange(s));
    }
    public async removeTransaction(host: string, key: string, id: string, onStatusChange: OnStatusChange)
    {
        const roomAndUser = this.getRoomAndUser(host, key);
        if (!roomAndUser?.room || !roomAndUser?.userData || !roomAndUser?.userInfo || !roomAndUser.room.root || !roomAndUser.room.users) return;

        const oldLength = roomAndUser.userData.transactions.length;
        roomAndUser.userData.transactions = roomAndUser.userData.transactions.filter(t => t.transactionId !== id);
        if (oldLength === roomAndUser.userData.transactions.length) return;

        await this.saveUser(host, key, roomAndUser, s => onStatusChange(s));
    }
    public async changeUserInfo(host: string, key: string, newName: string, phoneNumber: string | undefined, onStatusChange: OnStatusChange)
    {
        const roomAndUser = this.getRoomAndUser(host, key);
        if (!roomAndUser?.room || !roomAndUser?.userData || !roomAndUser?.userInfo || !roomAndUser.room.root || !roomAndUser.room.users) return;

        if (!newName || newName.length > 25) return;
        roomAndUser.userData.name = newName;
        roomAndUser.userData.phoneNumber = phoneNumber;

        await this.saveUser(host, key, roomAndUser, s => onStatusChange(s));
    }
    public async updateCoverImage(host: string, key: string, image: { host: string, key: string }, onStatusChange: OnStatusChange)
    {
        const roomAndUser = this.getRoomAndUser(host, key);
        if (!roomAndUser?.room || !roomAndUser?.userData || !roomAndUser?.userInfo || !roomAndUser.room.root || !roomAndUser.room.users) return;

        roomAndUser.userData.coverImage = { host: image.host, key: image.key, time: Date.now() };

        await this.saveUser(host, key, roomAndUser, s => onStatusChange(s));
        this.hub.localRoomController.createRoomCache(host, key, roomAndUser.room.root, roomAndUser.room.users, () => { });
    }
    private async saveUser(host: string, key: string, roomAndUser: ReturnType<typeof this.getRoomAndUser>, onStatusChange: OnStatusChange)
    {
        if (!roomAndUser?.room || !roomAndUser?.userData || !roomAndUser?.userInfo || !roomAndUser.room.root || !roomAndUser.room.users) return;
        await onStatusChange("Creating anonymous remote...");
        const remote = await Jormun.getAnonymousRemote(Hub.app, roomAndUser.room.info.host, a => this.hub.alert.handleAlert(a));

        const obj = {} as GetResponse;
        obj[roomAndUser.userInfo.userDataKey] = roomAndUser.userData;

        await onStatusChange("Saving...");
        await remote.setAsGuest(obj, roomAndUser.room.root.guestToken);
        await onStatusChange("Recalculating balances...");
        this.recalculateBalances(roomAndUser.room);
        this.hub.localRoomController.createRoomCache(host, key, roomAndUser.room.root, roomAndUser.room.users, () => { }).then(() => this.hub.update());
        this.hub.update();
    }

    private async fetchLastCurrency()
    {
        await Wait.until(() => this.hub.jormun.getStatus().initialized);
        this.lastCurrency = (await this.hub.jormun.me("last_currency")?.get()) ?? this.lastCurrency;
    }
    public getLastCurrency()
    {
        return this.lastCurrency;
    }
    public setLastCurrency(currency: string)
    {
        this.lastCurrency = currency;
        (async () =>
        {
            await Wait.until(() => this.hub.jormun.getStatus().initialized);
            await this.hub.jormun.add("last_currency", currency);
            await this.hub.jormun.me("last_currency")?.set(currency);
        })();
    }
    public fetchImage(host: string, key: string)
    {
        const parsed = Key.parse(key, -1);
        if (!parsed) return "";
        const cache = this.imageCache.find(i => i.host === host && i.key === key);
        if (cache) return cache.data;
        (async () =>
        {
            const obj = { host, key, data: "" };
            this.imageCache.push(obj);
            const remote = await Jormun.getAnonymousRemote(Hub.app, host, a => this.hub.alert.handleAlert(a));
            const peekResponse = await remote.peek([parsed]);
            if (!peekResponse || !peekResponse.hasOwnProperty(key)) return "";
            const data = peekResponse[key];
            obj.data = data;
            this.hub.update();
        })();
        return "";
    }
}
