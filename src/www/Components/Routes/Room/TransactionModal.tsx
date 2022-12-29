import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Ref } from "preact/compat";
import { Badge, Button, InputGroupText, Modal, ModalBody, ModalHeader } from "reactstrap";
import { NewTransactionData, RoomTransaction } from "../../../../Data/RoomTransaction";
import { RoomTransactionDebtor } from "../../../../Data/RoomTransactionDebtor";
import { RoomUserData } from "../../../../Data/RoomUserData";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Numbers } from "../../../../Utils/Numbers";
import { Wait } from "../../../../Utils/Wait";
import { Dropdown, DropdownBridge, DropdownOption } from "../../Input/Dropdown";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
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
    lastAmount = Number.NaN;
    amount = new TextboxBridge();
    currency = new DropdownBridge();
    debtors: RoomTransactionDebtor[] | null = null;
    defaultPercentages: RoomTransactionDebtor[] = [];
    message = new TextboxBridge();
    submitting = false;
    status = "";
}

export class TransactionModal extends BridgeAsync<TransactionModalProps, TransactionModalState, TransactionModalBridge>
{
    private recalculating = false;
    public state = new TransactionModalState();
    public componentDidMount()
    {
    }
    public componentWillUnmount()
    {
    }

    private fetchDefaultPercentages = async () =>
    {
        const room = this.props.room.info;
        this.bridge.defaultPercentages = await this.props.hub.localRoomController.getDefaultPercentages(room.host, room.roomRootKey);
        await this.setDebtors();
        await this.applyDefaultPercentages(false);
        await this.setBridge({ defaultPercentages: this.bridge.defaultPercentages });
    }
    private applyDefaultPercentages = async (setBridge: boolean) =>
    {
        if (this.bridge.defaultPercentages.length < 1) return;
        const amount = this.getAmount();
        const debtors = this.bridge.debtors;
        if (!debtors) return;
        for (const percentage of this.bridge.defaultPercentages)
        {
            if (!percentage.percentage) continue;
            const debtor = debtors.find(d => d.user == percentage.user);
            if (!debtor) continue;
            debtor.percentage = percentage.percentage;
            debtor.amount = Currencies.parse(percentage.amount * amount, this.bridge.currency.current);
            debtor.locked = percentage.locked;
        }
        if (setBridge) this.setBridge({ debtors: debtors });
    };

    private toggle = () =>
    {
        if (this.bridge.submitting) return;
        this.setBridge({ opened: !this.bridge.opened });
    }

    private setDebtors = async () =>
    {
        if (!!this.bridge.debtors) return;
        await this.setBridge({ debtors: this.props.room?.users?.map<RoomTransactionDebtor>(u => { return { user: u.userId, amount: 0, locked: false, percentage: false } }) ?? [] });
    };

    protected rendering(p: TransactionModalProps, s: TransactionModalState, b: TransactionModalBridge): ComponentChild
    {
        if (!this.bridge.debtors)
        {
            this.fetchDefaultPercentages();
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
                    {!b.editingTransaction?.image && <>
                        <Dropdown disabled={b.previewing || undefined} label="Who's paying?" options={this.getOptions()} bridge={b.creditor} setBridge={b => this.setBridge({ creditor: b })} />
                        <Textbox disabled={b.previewing || undefined} prefix={this.currencyDropdown()} type="number" decimals={2} min={0.01} label="Amount" bridge={b.amount} setBridge={b => { this.recalculateSharing(b.value); }} />
                        <div><h5 style={{ display: "inline-block" }}>Share</h5><this.setDefaultPercentagesButton /></div>
                        {this.props.room?.users?.map(u => this.debtorElement(u))}
                        <Textbox disabled={b.previewing || undefined} placeholder={b.previewing ? "" : "Write a message..."} type="text" label="Description" bridge={b.message} setBridge={b => this.setBridge({ message: b })} />
                        {!b.previewing && !this.recalculating && error && <div style={{ textAlign: "right" }} className="text-warning mb-3">{error ?? ""}</div>}
                    </>}
                    {!!b.editingTransaction?.image && <>
                        <img style={{ marginBottom: "10px", width: "100%" }} src={p.hub.dataController.fetchImage(b.editingTransaction.image.host, b.editingTransaction.image.key)} />
                    </>}
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
    private setDefaultPercentagesButton = (p: {}) =>
    {
        if (!this.arePercentagesDifferent()) return <></>;
        return <>
            <Badge color="primary" style={{ cursor: "pointer", float: "right" }} onClick={() => this.saveDefaultPercentages()}>
                <Fas star /> Save Percentages As Default</Badge>
        </>;
    };
    private arePercentagesDifferent = () =>
    {
        const amount = this.getAmount();
        const debtors = (this.bridge.debtors ?? []).filter(d => !!d.percentage);
        const defaults = this.bridge.defaultPercentages.filter(d => !!d.percentage);
        const areDifferent = (debtor: RoomTransactionDebtor | undefined, defaultPercentage: RoomTransactionDebtor | undefined) =>
        {
            if (!debtor || !defaultPercentage) return true;
            if (Numbers.round(debtor.amount / amount, 4) !== defaultPercentage.amount) return true;
        };
        for (const percentage of defaults)
        {
            if (areDifferent(debtors.find(d => d.user === percentage.user), percentage)) return true;
        }
        for (const debtor of debtors)
        {
            if (areDifferent(debtor, defaults.find(d => d.user === debtor.user))) return true;
        }
        return false;
    };
    private saveDefaultPercentages = async () =>
    {
        const room = this.props.room.info;
        const amount = this.getAmount();
        await this.props.hub.localRoomController.setDefaultPercentages(room.host, room.roomRootKey, amount, this.bridge.debtors ?? []);
        await this.fetchDefaultPercentages();
    };
    private debtorElement = (user: RoomUserData) =>
    {
        const debtorEntry = this.bridge.debtors?.find(d => d.user === user.userId);
        const selected = !!debtorEntry
        const locked = debtorEntry?.locked;
        const percentage = !!debtorEntry?.percentage;

        const prefix = !percentage ?
            `${Strings.elips(user.name, 15)}:` :
            `${Strings.elips(user.name, 15)} (${Currencies.formatAmount(debtorEntry.amount, this.bridge.currency.current)}):`
            ;

        const suffix = <>
            <InputGroupText>
                <span style={{ cursor: !this.bridge.previewing ? "pointer" : undefined }} onClick={() => this.toggleUserPercentageState(user.userId)}>
                    {percentage ? "%" : this.bridge.currency.current}
                </span>
            </InputGroupText>
            <div className="text-primary" style={{ fontSize: "2em", marginLeft: "10px", cursor: this.bridge.previewing ? "" : "pointer" }} onClick={() => this.toggleUserSelectedState(user.userId)}>
                {!selected && <Far circle />}
                {selected && !locked && <Fas circle-check />}
                {locked && <Fas lock />}
            </div>
        </>

        let displayAmount = debtorEntry?.amount;
        if (typeof displayAmount === "number" && percentage) 
        {
            const total = this.getAmount();
            displayAmount = total > 0 ? Currencies.parse((displayAmount / total) * 100, this.bridge.currency.current) : 0;
        }

        return <Textbox align={"right"} disabled={(!selected || this.bridge.previewing) || undefined} prefix={prefix} suffix={suffix} type="number" min={0.01} decimals={2} bridge={{ value: displayAmount?.toString() ?? "-" }} setBridge={a => this.changeUserAmount(user.userId, a.value)} />
    }
    private changeUserAmount = (userId: string, amount: string) =>
    {
        const float = Currencies.parse(amount, this.bridge.currency.current);
        const debtorEntry = this.bridge.debtors?.find(d => d.user === userId);
        if (debtorEntry)
        {
            debtorEntry.amount = float;
            if (!!debtorEntry.percentage) debtorEntry.amount = Currencies.parse(this.bridge.amount.value, this.bridge.currency.current) * (debtorEntry.amount / 100);
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
            this.bridge.debtors.push({ user: userId, locked: false, amount: 0, percentage: false });
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
    private toggleUserPercentageState = (userId: string) =>
    {
        if (this.bridge.previewing) return;
        const debtorEntry = this.bridge.debtors?.find(d => d.user === userId);
        if (!debtorEntry) return;
        debtorEntry.percentage = !debtorEntry.percentage;
        this.recalculateSharing();
        this.setBridge({ debtors: this.bridge.debtors });
    }

    private recalculateSharing = async (newAmountString?: string | undefined) =>
    {
        this.recalculating = true;
        await Wait.secs(0);

        if (typeof newAmountString === "string")
        {
            this.bridge.amount.value = newAmountString;
            this.bridge.amount.value = this.getAmount().toString();
        }
        const newAmount = this.getAmount();
        this.bridge.amount.value = newAmount.toString();

        if (newAmount > 0 && (this.bridge.lastAmount <= 0 || Number.isNaN(this.bridge.lastAmount)))
        {
            await this.applyDefaultPercentages(false);
        }

        if (!this.bridge.debtors) this.bridge.debtors = [];

        if (this.bridge.lastAmount > 0)
        {
            this.bridge.debtors.forEach(d => d.amount = (d.amount / this.bridge.lastAmount) * newAmount);
        }
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
        this.setBridge({ debtors: this.bridge.debtors, amount: this.bridge.amount, lastAmount: this.getAmount(), defaultPercentages: this.bridge.defaultPercentages });
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
            message: `${user.name} deleted an entry from ${new Date(old?.time ?? 0).toLocaleString()}.`,
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
        params.bridge.lastAmount = Number.NaN;
        params.bridge.debtors = null;
        params.bridge.editingId = "";
        params.bridge.editingTransaction = null;
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
        params.bridge.editingTransaction = null;
        params.bridge.currency.current = transaction.currency;
        params.bridge.message.value = transaction.message;
        params.bridge.creditor.current = transaction.creditor;
        params.bridge.previewing = false;
        params.bridge.lastAmount = transaction.amount;
        params.bridge.status = "";

        params.setBridge(params.bridge);
    }
    public static preview(params: BridgeParams<TransactionModalBridge>, selectedUserId: string, transaction: RoomTransaction)
    {
        params.bridge.opened = true;

        params.bridge.amount.value = transaction.amount.toString();
        params.bridge.debtors = JSON.parse(JSON.stringify(transaction.debtors));
        params.bridge.editingId = transaction.transactionId;
        params.bridge.editingTransaction = null;
        params.bridge.currency.current = transaction.currency;
        params.bridge.message.value = transaction.message;
        params.bridge.creditor.current = transaction.creditor;
        params.bridge.previewing = true;
        params.bridge.lastAmount = transaction.amount;
        params.bridge.status = "";

        params.setBridge(params.bridge);
    }

}