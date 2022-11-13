import { RoomTransaction } from "./RoomTransaction";
import { UserId } from "./UserId";

export interface RoomUserData
{
    name: string;
    userId: UserId;
    transactions: RoomTransaction[];
}