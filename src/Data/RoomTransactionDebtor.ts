import { UserId } from "./UserId";

export interface RoomTransactionDebtor
{
    user: UserId;
    amount: number;
    locked: boolean;
    percentage?: boolean;
}