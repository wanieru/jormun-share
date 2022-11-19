import { RoomTransaction } from "./RoomTransaction";
import { UserId } from "./UserId";

export interface RoomUserData
{
    name: string;
    phoneNumber?: string;
    userId: UserId;
    transactions: RoomTransaction[];
    coverImage?: { host: string, key: string, time: number }
}