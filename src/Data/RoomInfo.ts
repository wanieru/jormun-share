import { UserId } from "./UserId";

export interface RoomInfo
{
    host: string;
    roomRootKey: string;
    dead: boolean;
    selectedUserId?: UserId;
    cache?: {
        name: string;
        users: {
            userId: string;
            name: string;
            balances: {
                currency: string,
                balance: number
            }[];
        }[],
        timestamp: number,
        lastActivity: number
    }
}