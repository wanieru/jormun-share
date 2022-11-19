import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Room } from "../../../../Hub/DataController";
import { Hub } from "../../../../Hub/Hub";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { Fas } from "../../Utility/Icon";

export interface AddUserModalProps
{
    hub: Hub
    room: Room
}
export class AddUserModalState
{
}
export class AddUserModalBridge
{
    opened = false;
    newUsername: TextboxBridge = new TextboxBridge();
    submitting = false;
    status = "";
}

export class AddUserModal extends BridgeAsync<AddUserModalProps, AddUserModalState, AddUserModalBridge>
{
    public state = new AddUserModalState();
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

    protected rendering(p: AddUserModalProps, s: AddUserModalState, b: AddUserModalBridge): ComponentChild
    {
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    Change Name
                </ModalHeader>
                <ModalBody>
                    <Textbox label="New Username" type="text" bridge={b.newUsername} setBridge={b => this.setBridge({ newUsername: b })} />
                    <div>
                        <Button disabled={b.submitting || undefined} onClick={() => this.send()} color="primary" style={{ float: "right" }}><Fas paper-plane /> Add</Button>
                    </div>
                    <div>{b.status}</div>
                </ModalBody>
            </Modal>
        </>;
    }

    private send = async () =>
    {
        if (this.bridge.submitting) return;
        if (!this.bridge.newUsername.value) return;
        const room = this.props.room;
        if (!room.isMine) return;
        if (!room?.root?.roomId) return;
        this.setBridge({ submitting: true });
        await this.props.hub.localRoomController.createUsers(room.root.roomId, [this.bridge.newUsername.value], true, s => this.setBridge({ status: s }));
        await this.props.hub.dataController.fetchRoom(room.info.host, room.info.roomRootKey, true, true, s => this.setBridge({ status: s }));
        this.setBridge({ submitting: false, opened: false, status: "" });
    };

    public static open(params: BridgeParams<AddUserModalBridge>)
    {
        params.bridge.opened = true;
        params.bridge.submitting = false;
        params.bridge.newUsername = new TextboxBridge();
        params.setBridge(params.bridge);
    }

}