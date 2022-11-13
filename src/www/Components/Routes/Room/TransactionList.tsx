import { JSXInternal } from "preact/src/jsx";
import { RoomTransaction } from "../../../../Data/RoomTransaction";
import { Room } from "../../../../Hub/DataController";
import { TransactionView } from "./TransactionView";

export function TransactionList(p: { limit: number, room: Room, onEdit: (d: RoomTransaction) => void, onPreview: (d: RoomTransaction) => void }): JSXInternal.Element
{
    if (!p.room) return <></>;
    if (p.room.fullTransactionList.length < 1)
    {
        return <div style={{ textAlign: "center" }}>There's nothing here yet!</div>
    }
    const result = [] as JSXInternal.Element[];
    for (let i = p.room.fullTransactionList.length - 1; i >= Math.max(0, p.room.fullTransactionList.length - p.limit); i--)
    {
        const data = p.room.fullTransactionList[i];
        result.unshift(<TransactionView room={p.room} key={data.transactionId} data={data} onEdit={e => p.onEdit(e)} onPreview={e => p.onPreview(e)} />);
    }
    return <>{result}</>;
};
