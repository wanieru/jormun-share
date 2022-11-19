import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { Fas } from "../../Utility/Icon";

export interface ChangeRoomNameModalProps
{
    hub: Hub
    room: Room
}
export class ChangeRoomNameModalState
{
}
export class ChangeRoomNameModalBridge
{
    opened = false;
    newRoomName: TextboxBridge | null = null;
    submitting = false;
    status = "";
}

export class ChangeRoomNameModal extends BridgeAsync<ChangeRoomNameModalProps, ChangeRoomNameModalState, ChangeRoomNameModalBridge>
{
    public state = new ChangeRoomNameModalState();
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

    protected rendering(p: ChangeRoomNameModalProps, s: ChangeRoomNameModalState, b: ChangeRoomNameModalBridge): ComponentChild
    {
        if (!b.newRoomName)
        {
            b.newRoomName = new TextboxBridge();
            b.newRoomName.value = p.room.root?.name ?? p.room.info.cache?.name ?? "";
        }
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    Change Room Name
                </ModalHeader>
                <ModalBody>
                    <Textbox label="New Room Name" type="text" bridge={b.newRoomName} setBridge={b => this.setBridge({ newRoomName: b })} />
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
        if (!this.bridge.newRoomName?.value) return;
        const room = this.props.room;
        if (!room.isMine) return;
        if (!room?.root?.roomId) return;
        this.setBridge({ submitting: true });
        await this.props.hub.localRoomController.changeRoomName(room.root.roomId, this.bridge.newRoomName.value, s => this.setBridge({ status: s }));
        await this.props.hub.dataController.fetchRoom(room.info.host, room.info.roomRootKey, false, true, s => this.setBridge({ status: s }));
        this.setBridge({ submitting: false, opened: false, status: "" });
    };


    public static open(params: BridgeParams<ChangeRoomNameModalBridge>)
    {
        params.bridge.opened = true;
        params.bridge.newRoomName = null;
        params.bridge.status = "";
        params.bridge.submitting = false;
        params.setBridge(params.bridge);
    }

}