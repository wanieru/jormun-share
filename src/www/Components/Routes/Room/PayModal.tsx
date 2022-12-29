import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, InputGroupText, Modal, ModalBody, ModalHeader } from "reactstrap";
import { NewTransactionData, RoomTransaction } from "../../../../Data/RoomTransaction";
import { RoomTransactionDebtor } from "../../../../Data/RoomTransactionDebtor";
import { RoomUserData } from "../../../../Data/RoomUserData";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Currencies } from "../../../../Utils/Currencies";
import { Strings } from "../../../../Utils/Strings";
import { Wait } from "../../../../Utils/Wait";
import { Dropdown, DropdownBridge, DropdownOption } from "../../Input/Dropdown";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { Toggle } from "../../Input/Toggle";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { Far, Fas } from "../../Utility/Icon";
import { StatusModal } from "../../Utility/StatusModal";

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
    room: Room,
}
export class PayModalState
{
}
export class PayModalBridge
{
    opened = false;
    fromCurrency = new DropdownBridge();
    toCurrency = new DropdownBridge();
    convert = false;
    conversion = new TextboxBridge();
    creditors: PayCreditor[] | null = null;
    remainingDebt: number = 0;
    submitting = false;
    status = "";
    mobilePayQR = "";
}

export class PayModal extends BridgeAsync<PayModalProps, PayModalState, PayModalBridge>
{
    private static convertFromAmount = 100;
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

    protected rendering(p: PayModalProps, s: PayModalState, b: PayModalBridge): ComponentChild
    {
        const negativeCurrencies = this.negativeCurrencies();
        if (negativeCurrencies.length > 0 && !negativeCurrencies.map(c => c.currency).includes(b.fromCurrency.current))
        {
            b.fromCurrency.current = negativeCurrencies[0].currency;
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
                        {!b.convert && <Toggle label="Settle in Different Currency" bridge={{ checked: false }} setBridge={(b) => this.setBridge({ convert: b.checked, toCurrency: { current: this.props.hub.dataController.getLastCurrency() } })} />}
                        {b.convert && <Textbox align={"right"} prefix={
                            <>
                                <Dropdown style={{ maxWidth: "100px" }} options={this.getCurrencies()} bridge={this.bridge.toCurrency} setBridge={b => { this.setBridge({ toCurrency: b }); }} />
                                <InputGroupText>{`${PayModal.convertFromAmount} ${b.fromCurrency.current} = `}</InputGroupText>
                            </>
                        } type="number" placeholder={`??`} label={<>
                            <div style={{ cursor: "pointer" }} onClick={() => this.showPayInDirrectCurrencyHelp()}>Currency To Pay In <span className="text-info"><Fas circle-info /></span></div>
                        </>} bridge={b.conversion} setBridge={b => this.setBridge({ conversion: b })} suffix={
                            <>
                                <InputGroupText>{b.toCurrency.current}</InputGroupText>
                                <Button color="primary" onClick={() => this.openConversionRate()}><Fas magnifying-glass-dollar /></Button>
                            </>
                        } />}
                        <h6 style={{ marginTop: "10px" }}>You will owe: {Currencies.formatAmount(b.remainingDebt * this.getPayScaling(), this.getPayCurrency())}</h6>
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
            {this.bridge.mobilePayQR && <StatusModal header="Mobile Pay QR Code" status={<img src={this.bridge.mobilePayQR} style={{ width: "100%" }} />} close={() => this.setBridge({ mobilePayQR: "" })} />}
        </>;
    }
    private async showPayInDirrectCurrencyHelp()
    {
        await this.props.hub.jormun.ask("Settling in different currency", "In order to settle up in a different currency, enter the conversion rate between the original currency and the currency to settle up in.\n\nYou can find this by clicking the magnifying-glass-icon. For example, settling between US Dollars and British Pounds, the conversion rate might be 100 USD = 82.96 GBP.\n\n In that case, you would enter 82.96 in this box to see how much you owed in GBP.", ["Got it"]);
    }
    private openConversionRate = () =>
    {
        window.open(`https://duckduckgo.com/?ia=currency&q=${PayModal.convertFromAmount}+${this.bridge.fromCurrency.current}+${this.bridge.toCurrency.current}`, "_blank");
    }
    private getPayCurrency()
    {
        return this.bridge.convert && !!this.bridge.toCurrency.current ? this.bridge.toCurrency.current : this.bridge.fromCurrency.current;
    }
    private getPayScaling()
    {
        if (!this.bridge.convert || !this.bridge.toCurrency.current) return 1;
        const toCurrency = this.bridge.fromCurrency.current;
        const fromAmount = PayModal.convertFromAmount;
        const toAmount = Currencies.parse(this.bridge.conversion.value, toCurrency, 10);
        if (toAmount === 0) return 1;
        const scale = toAmount / fromAmount;
        return scale;
    }
    private creditorElement = (user: PayCreditor) =>
    {
        const userData = this.props.room.users?.find(u => u.userId === user.user);
        const selected = !user.ignored
        const locked = selected && user.locked
        const suffix = <>
            {this.getPayCurrency() === "DKK" && selected && !!userData?.phoneNumber && <div onClick={() => this.mobilePay(user, userData)} style={{ cursor: "pointer", marginLeft: "5px", paddingTop: "8px" }}>
                <img src="./www/img/mobilepay.png" width={32} height={32}></img>
            </div>}
            <div className="text-primary" style={{ fontSize: "2em", marginLeft: "5px", cursor: "pointer" }} onClick={() => this.toggleUserSelectedState(user)}>
                {!selected && <Far circle />}
                {selected && !locked && <Fas circle-check />}
                {locked && <Fas lock />}
            </div>
        </>
        return <Textbox disabled={!selected || undefined} prefix={`${Strings.elips(user.name, 10)}`} suffix={suffix} type="number" min={0.01} decimals={2} bridge={{ value: (Currencies.parse(user.amount * this.getPayScaling(), this.getPayCurrency())).toString() }} setBridge={a => this.changeUserAmount(user, parseFloat(a.value) / this.getPayScaling())} />
    }
    private async mobilePay(user: PayCreditor, userData: RoomUserData)
    {
        if (!this.bridge.creditors) return;
        if (!userData.phoneNumber) return;
        const amount = Currencies.parse(user.amount * this.getPayScaling(), this.getPayCurrency());
        const link = `mobilepay://send?phone=${userData.phoneNumber ?? ""}&comment=${Hub.appTitle}&amount=${amount}`;
        const types = ["Cancel", "Show QR Code", "Open MobilePay"];
        const type = await this.props.hub.jormun.ask("MobilePay", `Make sure the money is going to the right person before transferring any money!`, types);
        if (type === 1)
        {
            //QR Code
            await this.showMobilePayQRCode(link);
        }
        else if (type === 2)
        {
            //Deeplink
            window.open(link, "_blank");
        }
        else
        {
            return;
        }
        const success = (await this.props.hub.jormun.ask("MobilePay", "Did the money transfer go through?", ["Yes", "No"])) === 0;
        if (!success) return;
        user.locked = true;
        user.ignored = false;
        for (const creditor of this.bridge.creditors)
        {
            if (creditor === user) continue;
            creditor.locked = false;
            creditor.ignored = true;
        }
        this.recalculateShare();
        this.setBridge({ creditors: this.bridge.creditors });
        await Wait.secs(0);
        await this.pay();
    }
    private async showMobilePayQRCode(link: string)
    {
        await Wait.until(() => !this.bridge.mobilePayQR);
        const qr = await this.props.hub.localRoomController.getJoinQRCode(link);
        await this.setBridge({ mobilePayQR: qr });
        await Wait.until(() => !this.bridge.mobilePayQR);
    }
    private toggleUserSelectedState = (user: PayCreditor) =>
    {
        if (user.locked) user.locked = false;
        else user.ignored = !user.ignored;
        this.recalculateShare();
        this.setBridge({ creditors: this.bridge.creditors });
    };
    private changeUserAmount = (user: PayCreditor, amount: number) =>
    {
        if (user.ignored) return;
        user.amount = Currencies.parse(amount, this.bridge.fromCurrency.current);
        user.locked = true;

        this.recalculateShare();
        this.setBridge({ creditors: this.bridge.creditors });
    };
    private currencyDropdown(filter: string[])
    {
        return <Dropdown label="Currency To Settle" initial={filter[0] ?? this.props.hub.dataController.getLastCurrency()} options={this.getCurrencies().filter(c => filter.length < 1 || filter.includes(c.key))} bridge={this.bridge.fromCurrency} setBridge={b => { this.setBridge({ fromCurrency: b, creditors: null }); }} />;
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
        return this.negativeCurrencies().find(c => c.currency === this.bridge.fromCurrency.current)?.balance ?? 0;
    }

    private recalculateShare = async () =>
    {
        const negativeCurrencies = this.negativeCurrencies();
        if (negativeCurrencies.length < 1) return;
        this.calculating = true;
        await Wait.secs(0);

        if (!this.bridge.creditors)
        {
            const greenUsers = this.props.room?.balances?.filter(u => (u.balances.find(c => c.currency === this.bridge.fromCurrency.current)?.balance ?? 0) > 0) ?? [];
            this.bridge.creditors = greenUsers.map<PayCreditor>(u =>
            {
                return {
                    name: this.props.room.users?.find(user => user.userId == u.userId)?.name ?? "",
                    user: u.userId,
                    amount: 0,
                    locked: false,
                    ignored: false,
                    max: u.balances.find(c => c.currency === this.bridge.fromCurrency.current)?.balance ?? 0
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
            if (nonMaxedNonLockedCreditors.length < 1) break;
            let minMax: number | null = null;
            let averageDebt = this.bridge.remainingDebt / nonMaxedNonLockedCreditors.length;
            nonMaxedNonLockedCreditors.forEach(c => minMax = Math.min(minMax ?? c.max, c.max));
            let fillAmount = Math.min(averageDebt, minMax ?? averageDebt);
            nonMaxedNonLockedCreditors.forEach(c =>
            {
                const oldAmount = c.amount;
                c.amount = Math.min(c.max, c.amount + fillAmount);
                const delta = c.amount - oldAmount;
                this.bridge.remainingDebt -= delta;
            });
        }
        this.bridge.remainingDebt = Currencies.parse(this.bridge.remainingDebt, this.bridge.fromCurrency.current);
        this.bridge.creditors.forEach(c => c.amount = Currencies.parse(c.amount, this.bridge.fromCurrency.current));

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
            const transaction: NewTransactionData = {
                message: "",
                creditor: info.selectedUserId ?? "",
                amount: creditor.amount,
                currency: this.bridge.fromCurrency.current,
                debtors: [{
                    user: creditor.user,
                    locked: false,
                    percentage: false,
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
        params.bridge.conversion = new TextboxBridge();
        params.bridge.convert = false;
        params.bridge.submitting = false;

        params.setBridge(params.bridge);
    }

}
