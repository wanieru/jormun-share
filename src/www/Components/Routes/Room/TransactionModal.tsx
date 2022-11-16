import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Ref } from "preact/compat";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { NewTransactionData, RoomTransaction } from "../../../../Data/RoomTransaction";
import { RoomTransactionDebtor } from "../../../../Data/RoomTransactionDebtor";
import { RoomUserData } from "../../../../Data/RoomUserData";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Numbers } from "../../../../Utils/Numbers";
import { Wait } from "../../../../Utils/Wait";
import { Dropdown, DropdownBridge, DropdownOption } from "../../Input/Dropdown";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { Bridge, BridgeParams } from "../../Utility/Bridge";
import { Currencies } from "../../../../Utils/Currencies";
import { Far, Fas } from "../../Utility/Icon";
import { Strings } from "../../../../Utils/Strings";

export interface TransactionModalProps
{
    hub: Hub
    room: Room
}
export class TransactionModalState
{
}
export class TransactionModalBridge
{
    editingId = "";
    editingTransaction: RoomTransaction | null = null;
    previewing = false;
    opened = false;
    creditor = new DropdownBridge();
    amount = new TextboxBridge();
    currency = new DropdownBridge();
    debtors: RoomTransactionDebtor[] | null = null;
    message = new TextboxBridge();
    submitting = false;
    status = "";
}

export class TransactionModal extends Bridge<TransactionModalProps, TransactionModalState, TransactionModalBridge>
{
    private recalculating = false;
    public state = new TransactionModalState();
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

    protected renderer(p: TransactionModalProps, s: TransactionModalState, b: TransactionModalBridge): ComponentChild
    {
        if (!b.debtors)
        {
            this.bridge.debtors = p.room?.users?.map<RoomTransactionDebtor>(u => { return { user: u.userId, amount: 0, locked: false } }) ?? null;
        }
        if (!!b.editingId && !b.editingTransaction)
        {
            b.editingTransaction = p.room.fullTransactionList.find(t => t.transactionId === b.editingId) ?? null;
        }
        else if (!b.editingId && !!b.editingTransaction) b.editingTransaction = null;
        const error = this.getErrorMessage();
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    {!b.previewing && !b.editingId && "Add Outlay"}
                    {b.previewing && !b.editingId && new Date(b.editingTransaction?.time ?? 0).toLocaleString()}
                    {!b.previewing && b.editingId && new Date(b.editingTransaction?.time ?? 0).toLocaleString()}
                </ModalHeader>
                <ModalBody>
                    <Dropdown disabled={b.previewing || undefined} label="Who's paying?" options={this.getOptions()} bridge={b.creditor} setBridge={b => this.setBridge({ creditor: b })} />
                    <Textbox disabled={b.previewing || undefined} prefix={this.currencyDropdown()} type="number" decimals={2} min={0.01} label="Amount" bridge={b.amount} setBridge={b => { this.setBridge({ amount: b }); this.recalculateSharing(); }} />
                    <h5>Share</h5>
                    {this.props.room?.users?.map(u => this.debtorElement(u))}
                    <Textbox disabled={b.previewing || undefined} placeholder={b.previewing ? "" : "Write a message..."} type="text" label="Description" bridge={b.message} setBridge={b => this.setBridge({ message: b })} />
                    {!b.previewing && !this.recalculating && error && <div style={{ textAlign: "right" }} className="text-warning mb-3">{error ?? ""}</div>}
                    {!b.previewing && <div style={{ float: "right" }}>
                        {b.editingId && <><Button disabled={!this.recalculating && !!error} color="danger" onClick={() => this.delete()}><Fas trash /> Delete</Button><span> </span></>}
                        <Button disabled={!this.recalculating && !!error} color="primary" onClick={() => this.submit()}><Fas paper-plane /> {b.editingId ? "Edit" : "Submit"}</Button>
                    </div>}
                    {this.bridge.status && <div className="mt-3">
                        {this.bridge.status}
                    </div>}
                </ModalBody>
            </Modal>
        </>;
    }
    private debtorElement = (user: RoomUserData) =>
    {
        const debtorEntry = this.bridge.debtors?.find(d => d.user === user.userId);
        const selected = !!debtorEntry
        const locked = debtorEntry?.locked;
        const suffix = <>
            <div className="text-primary" style={{ fontSize: "2em", marginLeft: "10px", cursor: this.bridge.previewing ? "" : "pointer" }} onClick={() => this.toggleUserSelectedState(user.userId)}>
                {!selected && <Far circle />}
                {selected && !locked && <Fas circle-check />}
                {locked && <Fas lock />}
            </div>
        </>
        return <Textbox disabled={(!selected || this.bridge.previewing) || undefined} prefix={`${Strings.elips(user.name, 15)}: ${this.bridge.currency.current}`} suffix={suffix} type="number" min={0.01} decimals={2} bridge={{ value: debtorEntry?.amount.toString() ?? "-" }} setBridge={a => this.changeUserAmount(user.userId, a.value)} />
    }
    private changeUserAmount = (userId: string, amount: string) =>
    {
        const float = Currencies.parse(amount, this.bridge.currency.current);
        const debtorEntry = this.bridge.debtors?.find(d => d.user === userId);
        if (debtorEntry)
        {
            debtorEntry.amount = float;
        }
        const selected = !!debtorEntry
        const locked = debtorEntry?.locked;
        if (!selected) return;
        if (!locked)
        {
            debtorEntry.locked = true;
        }
        this.recalculateSharing();
        this.setBridge({ debtors: this.bridge.debtors });
    }
    private toggleUserSelectedState = (userId: string) =>
    {
        if (this.bridge.previewing) return;
        const debtorEntry = this.bridge.debtors?.find(d => d.user === userId);
        const selected = !!debtorEntry
        const locked = debtorEntry?.locked;
        if (!this.bridge.debtors) this.bridge.debtors = [];

        this.bridge.debtors.forEach(d => d.amount = Currencies.parse(d.amount, this.bridge.currency.current));

        if (!selected)
        {
            this.bridge.debtors.push({ user: userId, locked: false, amount: 0 });
        }
        else if (locked)
        {
            debtorEntry.locked = false;
        }
        else
        {
            this.bridge.debtors = this.bridge.debtors.filter(d => d.user !== userId);
        }
        this.recalculateSharing();
        this.setBridge({ debtors: this.bridge.debtors });
    }
    private recalculateSharing = async () =>
    {
        this.recalculating = true;
        await Wait.secs(0);

        this.bridge.amount.value = this.getAmount().toString();

        if (!this.bridge.debtors) this.bridge.debtors = [];
        this.bridge.debtors.forEach(d => d.amount = Currencies.parse(d.amount, this.bridge.currency.current));

        const unlockedEntries = this.bridge.debtors.filter(d => !d.locked);
        const lockedEntries = this.bridge.debtors.filter(d => d.locked);
        if (unlockedEntries.length > 0)
        {
            const lockedSum = Numbers.sum(lockedEntries.map(e => e.amount));
            const amountEach = (this.getAmount() - lockedSum) / unlockedEntries.length;
            unlockedEntries.forEach(e => e.amount = amountEach);
        }
        this.bridge.debtors.forEach(d => d.amount = Currencies.parse(d.amount, this.bridge.currency.current));
        if (unlockedEntries.length > 0) 
        {
            let sum = Numbers.sum(this.bridge.debtors.map(d => d.amount));
            const smallestAmount = Currencies.smallestUnit(this.bridge.currency.current);
            for (let i = 0; !Currencies.appromixatelySame(this.getAmount(), sum, this.bridge.currency.current); i++)
            {
                const entry = unlockedEntries[i % unlockedEntries.length];
                const delta = smallestAmount * Math.sign(this.getAmount() - sum);
                entry.amount += delta;
                entry.amount = Currencies.parse(entry.amount, this.bridge.currency.current);
                sum += delta;
            }
        }

        this.recalculating = false;
        this.setBridge({ debtors: this.bridge.debtors, amount: this.bridge.amount });
    }
    private getAmount = () =>
    {
        return Currencies.parse(this.bridge.amount.value, this.bridge.currency.current);
    }
    private getErrorMessage = () =>
    {
        if ((!this.bridge.debtors || this.bridge.debtors.length === 0) && this.getAmount() > 0) return "The outlay must be shared between at least one person.";
        if (this.bridge.debtors?.some(d => d.amount < 0)) return "Make sure no one's share is negative.";
        const sum = Numbers.sum((this.bridge.debtors ?? []).map(d => d.amount));
        if (!Currencies.appromixatelySame(sum, this.getAmount(), this.bridge.currency.current)) return "Make sure the sum of the sharing is equal to the outlay amount.";
        return null;
    }

    private currencyDropdown()
    {
        return <Dropdown style={{ maxWidth: "100px" }} initial={this.props.hub.dataController.getLastCurrency()} options={this.getCurrencies()} bridge={this.bridge.currency} setBridge={b => { this.setBridge({ currency: b }); this.props.hub.dataController.setLastCurrency(b.current) }} />;
    }

    private submit = async () =>
    {
        if (!!this.getErrorMessage()) return;
        this.setBridge({ submitting: true, previewing: true });
        const data: NewTransactionData = {
            message: this.bridge.message.value,
            amount: this.getAmount(),
            creditor: this.bridge.creditor.current,
            debtors: JSON.parse(JSON.stringify(this.bridge.debtors ?? [])),
            currency: this.bridge.currency.current
        };
        console.log("Submitting message ", data);
        const info = this.props.room.info;
        if (!this.bridge.editingId)
        {
            await this.props.hub.dataController.addTransction(info.host, info.roomRootKey, data, s => this.setBridge({ status: s }));
        }
        else
        {
            await this.props.hub.dataController.editTransaction(info.host, info.roomRootKey, this.bridge.editingId, data, s => this.setBridge({ status: s }));
        }
        this.setBridge({ submitting: false, previewing: false, opened: false, status: "" });
    };
    private delete = async () =>
    {
        const info = this.props.room.info;
        const user = this.props.room.users?.find(u => u.userId === info.selectedUserId);
        if (!info.selectedUserId || !user) return;
        if (!this.bridge.editingId) return;
        if (await this.props.hub.jormun.ask("Deletion", "Really delete this outlay?", ["Yes", "No"]) !== 0) return;
        this.setBridge({ submitting: true, previewing: true });
        const old = this.bridge.editingTransaction;
        const message: NewTransactionData = {
            amount: 0,
            debtors: [],
            creditor: info.selectedUserId,
            message: `${user.name} deleted a transaction from ${new Date(old?.time ?? 0).toLocaleString()}.`,
            currency: ""
        }
        await this.props.hub.dataController.removeTransaction(info.host, info.roomRootKey, this.bridge.editingId, s => this.setBridge({ status: s }));
        await this.props.hub.dataController.addTransction(info.host, info.roomRootKey, message, s => this.setBridge({ status: s }));
        this.setBridge({ submitting: false, previewing: false, opened: false, status: "" });
    }


    private getOptions(): DropdownOption[]
    {
        return this.props.room.users?.map<DropdownOption>(u =>
        {
            return {
                key: u.userId,
                value: u.name
            }
        }) ?? [];
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


    public static open(params: BridgeParams<TransactionModalBridge>, selectedUserId: string)
    {
        params.bridge.opened = true;

        params.bridge.creditor.current = selectedUserId;
        params.bridge.amount.value = "";
        params.bridge.debtors = null;
        params.bridge.editingId = "";
        params.bridge.message.value = "";
        params.bridge.previewing = false;
        params.bridge.status = "";

        params.setBridge(params.bridge);
    }
    public static edit(params: BridgeParams<TransactionModalBridge>, selectedUserId: string, transaction: RoomTransaction)
    {
        params.bridge.opened = true;

        params.bridge.amount.value = transaction.amount.toString();
        params.bridge.debtors = JSON.parse(JSON.stringify(transaction.debtors));
        params.bridge.editingId = transaction.transactionId;
        params.bridge.currency.current = transaction.currency;
        params.bridge.message.value = transaction.message;
        params.bridge.creditor.current = transaction.creditor;
        params.bridge.previewing = false;
        params.bridge.status = "";

        params.setBridge(params.bridge);
    }
    public static preview(params: BridgeParams<TransactionModalBridge>, selectedUserId: string, transaction: RoomTransaction)
    {
        params.bridge.opened = true;

        params.bridge.amount.value = transaction.amount.toString();
        params.bridge.debtors = JSON.parse(JSON.stringify(transaction.debtors));
        params.bridge.editingId = transaction.transactionId;
        params.bridge.currency.current = transaction.currency;
        params.bridge.message.value = transaction.message;
        params.bridge.creditor.current = transaction.creditor;
        params.bridge.previewing = true;
        params.bridge.status = "";

        params.setBridge(params.bridge);
    }

}