import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Hub } from "../../../../Hub/Hub";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { Fas } from "../../Utility/Icon";

export interface JoinRoomModalProps
{
    hub: Hub
}
export class JoinRoomModalState
{
    submitting = false
}
export class JoinRoomModalBridge
{
    status = "";
    opened = false;
    host = new TextboxBridge();
    userId = new TextboxBridge();
    roomId = new TextboxBridge();
}

export class JoinRoomModal extends BridgeAsync<JoinRoomModalProps, JoinRoomModalState, JoinRoomModalBridge>
{
    public state = new JoinRoomModalState();
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

    protected rendering(p: JoinRoomModalProps, s: JoinRoomModalState, b: JoinRoomModalBridge): ComponentChild
    {
        return <>
            <Modal isOpen={b.opened} toggle={this.toggle}>
                <ModalHeader toggle={this.toggle}>
                    Join Room
                </ModalHeader>
                <ModalBody>
                    <Textbox label={"Host"} bridge={b.host} setBridge={b => this.setBridge({ host: b })} type={"text"} />
                    <Textbox label={"User Id"} bridge={b.userId} setBridge={b => this.setBridge({ userId: b })} type={"number"} decimals={0} />
                    <Textbox label={"Room Id"} bridge={b.roomId} setBridge={b => this.setBridge({ roomId: b })} type={"text"} />
                    <Button disabled={s.submitting ? true : undefined} color="primary" onClick={() => this.join()}> <Fas paper-plane /> Join</Button>
                    <div>{b.status}</div>
                </ModalBody>
            </Modal>
        </>;
    }

    private join = async () =>
    {
        if (this.state.submitting) return;
        const host = this.bridge.host.value;
        const userId = this.bridge.userId.value;
        const roomId = this.bridge.roomId.value;
        const key = new Key(Hub.app, parseInt(userId), `room_${roomId}`);
        await this.setStateAsync({ submitting: true });
        await this.props.hub.remoteRoomController.joinRoom(host, key.stringifyRemote(-1), s => this.setBridge({ status: s }));
        await this.setStateAsync({ submitting: false });
        this.state.submitting = false;
        this.toggle();
    }

    public static open(params: BridgeParams<JoinRoomModalBridge>)
    {
        params.bridge.opened = true;
        params.bridge.host = new TextboxBridge();
        params.bridge.userId = new TextboxBridge();
        params.bridge.roomId = new TextboxBridge();
        params.bridge.status = "";
        params.setBridge(params.bridge);
    }

}