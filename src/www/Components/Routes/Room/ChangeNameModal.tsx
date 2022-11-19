import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { Fas } from "../../Utility/Icon";

export interface ChangeNameModalProps
{
    hub: Hub
    room: Room
}
export class ChangeNameModalState
{
}
export class ChangeNameModalBridge
{
    opened = false;
    newName: TextboxBridge | null = null;
    phoneNumber: TextboxBridge | null = null;
    submitting = false;
    status = "";
}

export class ChangeNameModal extends BridgeAsync<ChangeNameModalProps, ChangeNameModalState, ChangeNameModalBridge>
{
    public state = new ChangeNameModalState();
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

    protected rendering(p: ChangeNameModalProps, s: ChangeNameModalState, b: ChangeNameModalBridge): ComponentChild
    {
        if (!b.newName || !b.phoneNumber)
        {
            b.newName = new TextboxBridge();
            b.phoneNumber = new TextboxBridge();
            const user = p.room?.users?.find(u => u.userId == p.room.info.selectedUserId);
            b.newName.value = user?.name ?? "";
            b.phoneNumber.value = user?.phoneNumber ?? "";
        }
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    User Profile
                </ModalHeader>
                <ModalBody>
                    <Textbox label="New Name" type="text" bridge={b.newName} setBridge={b => this.setBridge({ newName: b })} />
                    <Textbox label="Phone Number (optional)" type="text" bridge={b.phoneNumber} setBridge={b => this.setBridge({ phoneNumber: b })} />
                    <div>
                        <Button disabled={b.submitting || undefined} onClick={() => this.send()} color="primary" style={{ float: "right" }}><Fas paper-plane /> Save</Button>
                    </div>
                    <div>{b.status}</div>
                </ModalBody>
            </Modal>
        </>;
    }

    private send = async () =>
    {
        if (this.bridge.submitting) return;
        this.setBridge({ submitting: true });
        if (!this.bridge.newName?.value) return;
        const info = this.props.room.info;
        await this.props.hub.dataController.changeUserInfo(info.host, info.roomRootKey, this.bridge.newName.value, this.bridge.phoneNumber?.value, s => this.setBridge({ status: s }));
        this.setBridge({ submitting: false, opened: false, status: "" });
    };


    public static open(params: BridgeParams<ChangeNameModalBridge>)
    {
        params.bridge.opened = true;
        params.bridge.newName = null;
        params.bridge.status = "";
        params.bridge.submitting = false;
        params.setBridge(params.bridge);
    }

}