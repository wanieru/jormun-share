import { RoomTransactionDebtor } from "./RoomTransactionDebtor";
import { UserId } from "./UserId";

export interface NewTransactionData
{
    message: string,
    amount: number,
    creditor: UserId,
    currency: string,
    debtors: RoomTransactionDebtor[]
}
export interface RoomTransactionExtra
{
    transactionId: string;
    time: number;
    creatorId: UserId;
}
export type RoomTransaction = NewTransactionData & RoomTransactionExtra;