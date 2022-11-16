import { JSX } from "preact/jsx-runtime";
import { JSXInternal } from "preact/src/jsx";
import { Button, Card } from "reactstrap";
import { RoomTransaction } from "../../../../Data/RoomTransaction";
import { AlertController } from "../../../../Hub/AlertController";
import { Room } from "../../../../Hub/DataController";
import { Currencies } from "../../../../Utils/Currencies";
import { Strings } from "../../../../Utils/Strings";
import { Fas } from "../../Utility/Icon";

export function TransactionView(p: { data: RoomTransaction, room: Room, onEdit: (d: RoomTransaction) => void, onPreview: (d: RoomTransaction) => void }): JSXInternal.Element
{
    let canEdit = p.data.creatorId === p.room.info.selectedUserId;
    const creatorName = p.room?.users?.find(u => u.userId === p?.data.creatorId)?.name ?? null;
    const differentCreditorName = p.data.creditor !== p.data.creatorId ? p.room.users?.find(u => u.userId === p.data.creditor)?.name ?? null : null;
    const meDebtor = p.data.debtors?.find(d => d.user === p.room.info.selectedUserId);
    let canPreview = !canEdit;

    let content: JSX.Element | null = null;
    let inverse = true;
    let color = "primary";

    if (p.data.amount === 0 && p.data.debtors.length === 0)
    {
        content = <><Fas comment /> <span>{Strings.elips(p.data.message, 500)}</span></>;
        color = "light";
        inverse = false;
        canPreview = false;
    }
    else if (p.data.debtors.length === 1 && p.data.debtors[0].user !== p.data.creditor && p.data.creditor === p.data.creatorId && !p.data.message)
    {
        const recepient = p.room.users?.find(u => u.userId === p.data.debtors[0].user)?.name ?? "";
        content = <b><Fas hand-holding-dollar /> {Strings.elips(creatorName ?? "", 10)} paid {Currencies.formatAmount(p.data.amount, p.data.currency)} to {Strings.elips(recepient, 10)}.</b>;
        canPreview = false;
    }
    else
    {
        content = <>
            <div style={{ textAlign: "center" }}>
                <div><Fas receipt /> <b>{Currencies.formatAmount(p.data.amount, p.data.currency)}{!!differentCreditorName && <i> (Paid by {Strings.elips(differentCreditorName, 10)})</i>}</b></div>
                {!!p.data.message && <div>{Strings.elips(p.data.message, 100)}</div>}
                {<div><i>My share: {Currencies.formatAmount(meDebtor?.amount ?? 0, p.data.currency)}</i></div>}
            </div>

        </>;
    }

    const onClick = () =>
    {
        if (canEdit)
        {
            p.onEdit(p.data);
        }
        else if (canPreview)
        {
            p.onPreview(p.data);
        }
    };

    return <>
        <Card color={color} body inverse={inverse || undefined} style={{ marginTop: "30px", display: "block", cursor: canEdit || canPreview ? "pointer" : "" }} onClick={() => onClick()}>
            {(canEdit || canPreview) && <div style={{ float: "right" }}><Fas angle-right /></div>}
            <div className="text-dark" style={{ width: "100%", position: "absolute", marginTop: "-40px", marginLeft: "-10px" }}>
                {Strings.elips(creatorName ?? "", 20)}<span className="text-muted" style={{ marginRight: "10px", float: "right", fontSize: "0.75em" }}> {AlertController.timeToAgoStr(p.data.time, 1000 * 60 * 60 * 24 * 7)}</span>
            </div>
            {content}
        </Card>
    </>;
};