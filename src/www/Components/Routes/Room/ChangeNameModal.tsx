import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { Bridge, BridgeParams } from "../../Utility/Bridge";
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
    submitting = false;
    status = "";
}

export class ChangeNameModal extends Bridge<ChangeNameModalProps, ChangeNameModalState, ChangeNameModalBridge>
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

    protected renderer(p: ChangeNameModalProps, s: ChangeNameModalState, b: ChangeNameModalBridge): ComponentChild
    {
        if (!b.newName)
        {
            b.newName = new TextboxBridge();
            b.newName.value = p.room?.users?.find(u => u.userId == p.room.info.selectedUserId)?.name ?? "";
        }
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    Change Name
                </ModalHeader>
                <ModalBody>
                    <Textbox label="New Name" type="text" bridge={b.newName} setBridge={b => this.setBridge({ newName: b })} />
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
        await this.props.hub.dataController.changeUsername(info.host, info.roomRootKey, this.bridge.newName.value, s => this.setBridge({ status: s }));
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