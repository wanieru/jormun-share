import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { NewTransactionData, RoomTransaction } from "../../../../Data/RoomTransaction";
import { RoomTransactionDebtor } from "../../../../Data/RoomTransactionDebtor";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Currencies } from "../../../../Utils/Currencies";
import { Strings } from "../../../../Utils/Strings";
import { Wait } from "../../../../Utils/Wait";
import { Dropdown, DropdownBridge, DropdownOption } from "../../Input/Dropdown";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { Bridge, BridgeParams } from "../../Utility/Bridge";
import { Far, Fas } from "../../Utility/Icon";

export interface PayCreditor
{
    user: string,
    locked: boolean,
    ignored: boolean,
    amount: number,
    max: number,
    name: string
}
export interface PayModalProps
{
    hub: Hub
    room: Room
}
export class PayModalState
{
}
export class PayModalBridge
{
    opened = false;
    currency = new DropdownBridge();
    creditors: PayCreditor[] | null = null;
    remainingDebt: number = 0;
    submitting = false;
    status = "";
}

export class PayModal extends Bridge<PayModalProps, PayModalState, PayModalBridge>
{
    private calculating = false;
    public state = new PayModalState();
    public componentDidMount()
    {
    }
    public componentWillUnmount()
    {
    }

    private toggle = () =>
    {
        if (this.bridge.submitting) return;
        this.setBridge({ opened: !this.bridge.opened });
    }

    protected renderer(p: PayModalProps, s: PayModalState, b: PayModalBridge): ComponentChild
    {
        const negativeCurrencies = this.negativeCurrencies();
        if (negativeCurrencies.length > 0 && !negativeCurrencies.map(c => c.currency).includes(b.currency.current))
        {
            b.currency.current = negativeCurrencies[0].currency;
            b.creditors = null;
        }
        if (!b.creditors) this.recalculateShare();

        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>Settle Up</ModalHeader>
                <ModalBody>
                    {negativeCurrencies.length == 0 && <b><Fas party-horn /> You don't owe anything!</b>}
                    {negativeCurrencies.length > 0 && <>
                        {this.currencyDropdown(negativeCurrencies.map(c => c.currency))}
                        <h6 style={{ marginTop: "10px" }}>You owe: {Currencies.formatAmount(-this.balanceInCurrency(), b.currency.current)} <Fas arrow-right /> {Currencies.formatAmount(b.remainingDebt, b.currency.current)}</h6>
                        <h5>Share</h5>
                        {b.creditors && b.creditors.map(u => this.creditorElement(u))}
                        <div style={{ float: "right" }}>
                            <Button disabled={b.submitting || undefined} color="primary" onClick={() => this.pay()}><Fas paper-plane /> Pay</Button>
                        </div>
                        {this.bridge.status && <div className="mt-3">
                            {this.bridge.status}
                        </div>}
                    </>}
                </ModalBody>
            </Modal>
        </>;
    }
    private creditorElement = (user: PayCreditor) =>
    {
        const selected = !user.ignored
        const locked = selected && user.locked
        const suffix = <>
            <div className="text-primary" style={{ fontSize: "2em", marginLeft: "10px", cursor: "pointer" }} onClick={() => this.toggleUserSelectedState(user)}>
                {!selected && <Far circle />}
                {selected && !locked && <Fas circle-check />}
                {locked && <Fas lock />}
            </div>
        </>
        return <Textbox disabled={!selected || undefined} prefix={`${Strings.elips(user.name, 10)}: ${Currencies.formatAmount(user.max, this.bridge.currency.current)}`} suffix={suffix} type="number" min={0.01} decimals={2} bridge={{ value: user.amount.toString() ?? "-" }} setBridge={a => this.changeUserAmount(user, a.value)} />
    }
    private toggleUserSelectedState = (user: PayCreditor) =>
    {
        if (user.locked) user.locked = false;
        else user.ignored = !user.ignored;
        this.recalculateShare();
        this.setBridge({ creditors: this.bridge.creditors });
    };
    private changeUserAmount = (user: PayCreditor, amount: string) =>
    {
        if (user.ignored) return;
        user.amount = Currencies.parse(amount, this.bridge.currency.current);
        user.locked = true;

        this.recalculateShare();
        this.setBridge({ creditors: this.bridge.creditors });
    };
    private currencyDropdown(filter: string[])
    {
        return <Dropdown initial={filter[0] ?? this.props.hub.dataController.getLastCurrency()} options={this.getCurrencies().filter(c => filter.length < 1 || filter.includes(c.key))} bridge={this.bridge.currency} setBridge={b => { this.setBridge({ currency: b, creditors: null }); }} />;
    }
    private getCurrencies(): DropdownOption[]
    {
        return Currencies.getCurrencies().map<DropdownOption>(c =>
        {
            return {
                key: c.iso,
                value: `${c.iso} - ${c.name}`
            }
        }) ?? [];
    }


    private negativeCurrencies = () =>
    {
        const myBalance = this.props.room?.balances?.find(u => u.userId === this.props.room.info.selectedUserId);
        if (!myBalance) return [];
        return myBalance.balances.filter(c => c.balance < 0);
    }
    private balanceInCurrency = () =>
    {
        return this.negativeCurrencies().find(c => c.currency === this.bridge.currency.current)?.balance ?? 0;
    }

    private recalculateShare = async () =>
    {
        const negativeCurrencies = this.negativeCurrencies();
        if (negativeCurrencies.length < 1) return;
        this.calculating = true;
        await Wait.secs(0);

        if (!this.bridge.creditors)
        {
            const greenUsers = this.props.room?.balances?.filter(u => (u.balances.find(c => c.currency === this.bridge.currency.current)?.balance ?? 0) > 0) ?? [];
            this.bridge.creditors = greenUsers.map<PayCreditor>(u =>
            {
                return {
                    name: this.props.room.users?.find(user => user.userId == u.userId)?.name ?? "",
                    user: u.userId,
                    amount: 0,
                    locked: false,
                    ignored: false,
                    max: u.balances.find(c => c.currency === this.bridge.currency.current)?.balance ?? 0
                }
            });
        }

        this.bridge.remainingDebt = -this.balanceInCurrency();
        if (this.bridge.remainingDebt <= 0) return;
        this.bridge.creditors.forEach(c =>
        {
            if (c.locked && !c.ignored) 
            {
                c.amount = Math.min(c.max, c.amount, this.bridge.remainingDebt);
                this.bridge.remainingDebt -= c.amount;
            }
            else
            {
                c.amount = 0;
            }
        });
        while (this.bridge.remainingDebt > 0)
        {
            const nonMaxedNonLockedCreditors = this.bridge.creditors.filter(c => !c.ignored && !c.locked && c.amount < c.max);
            if(nonMaxedNonLockedCreditors.length < 1) break;
            let minMax : number | null = null;
            let averageDebt = this.bridge.remainingDebt / nonMaxedNonLockedCreditors.length;
            nonMaxedNonLockedCreditors.forEach(c => minMax = Math.min(minMax ?? c.max, c.max));
            let fillAmount = Math.min(averageDebt, minMax);
            nonMaxedNonLockedCreditors.forEach(c =>
            {
                const oldAmount = c.amount;
                c.amount = Math.min(c.max, c.amount + fillAmount);
                const delta = c.amount - oldAmount;
                this.bridge.remainingDebt -= delta;
            });
        }
        this.bridge.remainingDebt = Currencies.parse(this.bridge.remainingDebt, this.bridge.currency.current);
        this.bridge.creditors.forEach(c => c.amount = Currencies.parse(c.amount, this.bridge.currency.current));

        this.setBridge({ remainingDebt: this.bridge.remainingDebt, creditors: this.bridge.creditors });
        this.calculating = false;
    }

    private pay = async () =>
    {
        if (this.bridge.submitting) return;
        this.setBridge({ submitting: true, status: "" });

        const info = this.props.room.info;
        for (const creditor of this.bridge.creditors ?? [])
        {
            if (creditor.ignored) continue;
            if (Currencies.appromixatelySame(creditor.amount, 0, this.bridge.currency.current)) continue;
            const transaction: NewTransactionData = {
                message: "",
                creditor: info.selectedUserId ?? "",
                amount: creditor.amount,
                currency: this.bridge.currency.current,
                debtors: [{
                    user: creditor.user,
                    locked: false,
                    amount: creditor.amount
                }]
            };
            await this.props.hub.dataController.addTransction(info.host, info.roomRootKey, transaction, s => this.setBridge({ status: s }));
        }

        this.setBridge({ submitting: false, status: "", opened: false });
    };


    public static open(params: BridgeParams<PayModalBridge>)
    {
        params.bridge.opened = true;

        params.bridge.creditors = null;
        params.bridge.status = "";
        params.bridge.submitting = false;

        params.setBridge(params.bridge);
    }

}
