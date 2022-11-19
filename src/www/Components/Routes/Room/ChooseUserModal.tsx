import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild } from "preact";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { RoomUserData } from "../../../../Data/RoomUserData";
import { Hub } from "../../../../Hub/Hub";
import { Strings } from "../../../../Utils/Strings";
import { Textbox, TextboxBridge } from "../../Input/Textbox";
import { BridgeAsync, BridgeParams } from "../../Utility/BridgeAsync";
import { ComponentAsync } from "../../Utility/ComponentAsync";
import { Fas } from "../../Utility/Icon";

export interface ChooseUserModalProps
{
    hub: Hub,
    users: RoomUserData[],
    opened: boolean,
    host: string,
    roomKey: string
}
export class ChooseUserModalState
{
    submitting = false;
    status = "";
}

export class ChooseUserModal extends ComponentAsync<ChooseUserModalProps, ChooseUserModalState>
{
    public state = new ChooseUserModalState();
    public componentDidMount()
    {
    }
    public componentWillUnmount()
    {
    }

    public renderer(p: ChooseUserModalProps, s: ChooseUserModalState): ComponentChild
    {
        return <>
            <Modal isOpen={p.opened}>
                <ModalHeader >
                    Select User
                </ModalHeader>
                <ModalBody>
                    {p.users.map((u, idx) =>

                        <Button className="mb-3" color="primary" key={idx} block disabled={s.submitting} onClick={() => this.choose(u)}>{Strings.elips(u.name, 30)}</Button>
                    )}
                    <div>{s.status}</div>
                </ModalBody>
            </Modal>
        </>;
    }

    private choose = async (user: RoomUserData) =>
    {
        if (this.state.submitting) return;
        await this.setStateAsync({ status: "", submitting: true });
        await this.props.hub.localRoomController.selectUserId(this.props.host, this.props.roomKey, user.userId, s => this.setStateAsync({ status: s }));
        await this.setStateAsync({ status: "", submitting: false });
    };
}