import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Hub } from "../../../../Hub/Hub";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { Fas } from "../../Utility/Icon";

export interface NewRoomModalProps
{
    hub: Hub
}
export class NewRoomModalState
{
    submitting = false
}
export class NewRoomModalBridge
{
    status = "";
    opened = false;
    roomName = new TextboxBridge();
    users = [new TextboxBridge()] as TextboxBridge[]
}

export class NewRoomModal extends BridgeAsync<NewRoomModalProps, NewRoomModalState, NewRoomModalBridge>
{
    public state = new NewRoomModalState();
    public componentDidMount()
    {
    }
    public componentWillUnmount()
    {
    }

    private toggle = () =>
    {
        if (this.state.submitting) return;
        this.setBridge({ opened: !this.bridge.opened });
    }

    protected rendering(p: NewRoomModalProps, s: NewRoomModalState, b: NewRoomModalBridge): ComponentChild
    {
        if (b.users.every(t => !!t.value))
        {
            b.users.push(new TextboxBridge());
        }
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    New Room
                </ModalHeader>
                <ModalBody>
                    <Textbox label={"Room Name"} bridge={b.roomName} setBridge={b => this.setBridge({ roomName: b })} type={"text"} />
                    {b.users.map((u, i) =>
                        <Textbox key={i} label={`User ${i + 1}`} bridge={u} setBridge={u => { b.users[i] = u; this.setBridge({ users: b.users }) }} type={"text"} />
                    )}
                    <Button disabled={s.submitting ? true : undefined} color="primary" onClick={() => this.create()}> <Fas paper-plane /> Create</Button>
                    <div>{this.bridge.status}</div>
                </ModalBody>
            </Modal>
        </>;
    }

    private create = async () =>
    {
        if (this.state.submitting) return;
        const roomName = this.bridge.roomName.value;
        const usernames = this.bridge.users.map(u => u.value).filter(u => !!u);
        if (usernames.length < 1)
        {
            return;
        }
        await this.setStateAsync({ submitting: true });
        await this.props.hub.localRoomController.createRoom(roomName, usernames, s => this.setBridge({ status: s }));
        await this.setStateAsync({ submitting: false });
        this.state.submitting = false;
        this.toggle();
    }

    public static open(params: BridgeParams<NewRoomModalBridge>)
    {
        params.bridge.opened = true;
        params.bridge.roomName = new TextboxBridge();
        params.bridge.users = [new TextboxBridge()];
        params.bridge.status = "";
        params.setBridge(params.bridge);
    }

}