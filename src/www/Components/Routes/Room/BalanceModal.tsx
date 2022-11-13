import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader, Row, Table } from "reactstrap";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Currencies } from "../../../../Utils/Currencies";
import { Strings } from "../../../../Utils/Strings";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { Bridge, BridgeParams } from "../../Utility/Bridge";
import { Fas } from "../../Utility/Icon";

export interface BalanceModalProps
{
    hub: Hub
    room: Room
}
export class BalanceModalState
{
}
export class BalanceModalBridge
{
    opened = false;
}

export class BalanceModal extends Bridge<BalanceModalProps, BalanceModalState, BalanceModalBridge>
{
    public state = new BalanceModalState();
    public componentDidMount()
    {
    }
    public componentWillUnmount()
    {
    }

    private toggle = () =>
    {
        this.setBridge({ opened: !this.bridge.opened });
    }

    protected renderer(p: BalanceModalProps, s: BalanceModalState, b: BalanceModalBridge): ComponentChild
    {
        const currencies = this.getCurrencies();
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    Balance
                </ModalHeader>
                <ModalBody>
                    <Table>
                        <tbody>
                            {
                                currencies.map(c => this.currencyRows(c))
                            }
                        </tbody>
                    </Table>
                </ModalBody>
            </Modal>
        </>;
    }
    private getCurrencies()
    {
        const currencies = [] as string[];
        for (const user of this.props.room.balances)
        {
            for (const currency of user.balances)
            {
                if (!currencies.includes(currency.currency)) currencies.push(currency.currency);
            }
        }
        return currencies;
    }
    private currencyRows(currency: string)
    {
        const info = Currencies.getCurrency(currency);
        const users = this.props.room.balances.map(c => { return { user: c, currency: c.balances.find(b => b.currency === currency) } });
        if (users.every(u => Currencies.appromixatelySame(u.currency?.balance ?? 0, 0, u.currency?.currency ?? ""))) return <></>;
        return <>
            <tr key={currency}><th colSpan={2} style={{ textAlign: "center", fontWeight: "bold" }}>{info?.name ?? currency}</th></tr>
            {users.map(c => <>
                <tr>
                    <td>{Strings.elips(this.props.room.users?.find(u => u.userId === c.user.userId)?.name ?? c.user.userId, 20)}</td>
                    <td className={(c.currency?.balance ?? 0) < 0 ? "text-danger" : ((c.currency?.balance ?? 0 > 0) ? "text-success" : "")}>{Currencies.formatAmount(c.currency?.balance ?? 0, currency)}</td>
                </tr>
            </>)}
        </>;
    }


    public static open(params: BridgeParams<BalanceModalBridge>)
    {
        params.bridge.opened = true;
        params.setBridge(params.bridge);
    }

}