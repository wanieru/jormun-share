import { Component, ComponentChild, JSX } from "preact";
import { Navigate, useParams } from "react-router";
import { Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import { NewTransactionData } from "../../../Data/RoomTransaction";
import { Room } from "../../../Hub/DataController";
import { Hub } from "../../../Hub/Hub";
import { Wait } from "../../../Utils/Wait";
import { Textbox, TextboxBridge } from "../Input/Textbox";
import { Fas } from "../Utility/Icon";
import { StatusModal } from "../Utility/StatusModal";
import { BalanceModal, BalanceModalBridge } from "./Room/BalanceModal";
import { ChangeNameModal, ChangeNameModalBridge } from "./Room/ChangeNameModal";
import { ChooseUserModal } from "./Room/ChooseUserModal";
import { PayModal, PayModalBridge } from "./Room/PayModal";
import { TransactionList } from "./Room/TransactionList";
import { TransactionModal, TransactionModalBridge } from "./Room/TransactionModal";
import { ChangeRoomNameModal, ChangeRoomNameModalBridge } from "./Room/ChangeRoomNameModal";
import { AddUserModal, AddUserModalBridge } from "./Room/AddUserModal";
import { Strings } from "../../../Utils/Strings";
import { Key } from "jormun-sdk/dist/Key";
import { B64URL } from "../Utility/B64URL";
import { Images } from "../../../Utils/Images";
import { ComponentAsync } from "../Utility/ComponentAsync";
import { OnStatusChange } from "../../../Utils/StatusChanging";

export function RoomRouteRoot(p: { hub: Hub })
{
    const params = useParams();
    return <RoomRoute hub={p.hub} roomId={params.roomId ?? ""} userId={parseInt(params.userId ?? "-1")} host={B64URL.FromBase64(params.host ?? "") ?? ""} />
}

export interface RoomRouteProps
{
    hub: Hub,
    roomId: string,
    host: string,
    userId: number
}
export class RoomRouteState
{
    fetchStatus = "";
    sendMessageStatus = "";
    refreshStatus = "";
    clearSelectedUserStatus = "";
    imageProcessingStatus = "";
    uploadImageStatus = "";
    qrCode = { link: "", done: false, qr: "" }
    chatMessage = new TextboxBridge();
    settingsOpen = false;
    joinInfoOpen = false;

    balanceModal = new BalanceModalBridge();
    changeNameModal = new ChangeNameModalBridge();
    payModal = new PayModalBridge();
    transactionModal = new TransactionModalBridge();
    addUserModal = new AddUserModalBridge();
    changeRoomNameModal = new ChangeRoomNameModalBridge();

    submitImagePreview = "";
    submitImageAction: ((image: { host: string, key: string }, room: Room, onStatusChange: OnStatusChange) => Promise<void>) | null = null;

    transactionShowLimit = 10;

    redirectToJoin = false;
}

export class RoomRoute extends ComponentAsync<RoomRouteProps, RoomRouteState>
{
    public state = new RoomRouteState();
    private mounted = false;
    public componentDidMount()
    {
        this.mounted = true;
        this.fetch();
        this.checkJoined();
    }
    private async fetch()
    {
        await Wait.until(() => !this.mounted || !!this.getRoom());
        const room = this.getRoom();
        if (room?.info)
        {
            (async () =>
            {
                await this.props.hub.dataController.fetchRoom(room.info.host, room.info.roomRootKey, true, true, s => this.setStateAsync({ fetchStatus: s }));
                await this.setStateAsync({ fetchStatus: "" });
                await Wait.secs(0);
                $('html, body').animate({
                    scrollTop: $(document).height()
                }, 'slow');
            })();

        }
    }
    private async checkJoined()
    {
        await Wait.until(() => !this.mounted || this.props.hub.jormun.getStatus().initialized);
        const dir = await this.props.hub.localRoomController.getDirectory();
        const key = new Key(Hub.app, this.props.userId, `room_${this.props.roomId}`);
        if (!dir.rooms.find(r => r.roomRootKey === key.stringifyLocal() && r.host === this.props.host))
        {
            await this.setStateAsync({ redirectToJoin: true });
        }
    }
    public componentWillUnmount()
    {
        this.mounted = false;
    }
    private getRoom = () =>
    {
        return this.props.hub.dataController.getRooms().find(r => r.root?.roomId === this.props.roomId) ?? null;
    }
    private getSelectedUser = () =>
    {
        const room = this.getRoom();
        if (!room) return null;
        return {
            userData: room.users?.find(u => u.userId === room.info.selectedUserId) ?? null,
            userInfo: room.root?.users[room.info.selectedUserId ?? ""] ?? null
        };
    }

    public renderer(p: RoomRouteProps, s: RoomRouteState): ComponentChild
    {
        const room = this.getRoom();

        if (!room)
        {
            if (s.redirectToJoin) return <Navigate to={this.props.hub.localRoomController.getJoinHash(p.host, new Key(Hub.app, p.userId, `room_${p.roomId}`).stringifyLocal())} />;
            return <></>;
        }
        const selectedUser = this.getSelectedUser();
        const bottomButtonStyle: JSX.CSSProperties = { fontSize: "1.25em" };
        return <>

            <div style={{ paddingBottom: "350px" }}>
                {s.transactionShowLimit < room.fullTransactionList.length && <Button color="light" block className="mb-3" onClick={() => { this.setStateAsync({ transactionShowLimit: s.transactionShowLimit + 25 }) }}><Fas caret-up /> Show more...</Button>}
                {room.users && <TransactionList
                    hub={p.hub}
                    room={room}
                    limit={s.transactionShowLimit}
                    onEdit={e => TransactionModal.edit({ bridge: s.transactionModal, setBridge: b => this.setStateAsync({ transactionModal: b }) }, room.info.selectedUserId ?? "", e)}
                    onPreview={e => TransactionModal.preview({ bridge: s.transactionModal, setBridge: b => this.setStateAsync({ transactionModal: b }) }, room.info.selectedUserId ?? "", e)}
                />}
                {!room.users && <div style={{ textAlign: "center" }}><b>Loading...</b></div>}
            </div>
            <div style={{ position: "fixed", bottom: "56px", left: "0", right: "0" }}>
                <Container>
                    <Card>
                        <CardHeader>
                            <span style={{ float: "right" }}><Button color="light" title="Refresh" onClick={() => this.refresh()}><Fas refresh /></Button></span>
                            <div><b>{Strings.elips(room?.root?.name ?? room?.info.cache?.name ?? "", 30)}</b></div>
                            <div>{Strings.elips(selectedUser?.userData?.name ?? "", 30)}</div>
                        </CardHeader>
                        <CardBody style={{ textAlign: "center", paddingBottom: "50px" }}>
                            <div>
                                <Textbox placeholder="Write a message..." type="text" bridge={s.chatMessage} setBridge={b => this.setStateAsync({ chatMessage: b })} suffix={
                                    <>
                                        <Button size="xl" color="primary" title="Send message" onClick={() => this.sendMessage()}><Fas paper-plane /></Button>
                                        {<Button size="xl" color="primary" disabled={!p.hub.jormun.getStatus().loggedIn} title="Send image" onClick={() => this.chooseImageToUpload()}><Fas image /></Button>}
                                    </>
                                } />
                            </div>
                            <Button style={bottomButtonStyle} size="xl" color="primary" title="Add outlay" onClick={() => TransactionModal.open({ bridge: s.transactionModal, setBridge: b => this.setStateAsync({ transactionModal: b }) }, room.info.selectedUserId ?? "")}><Fas style={{ minWidth: "22.5px" }} receipt /></Button><span> </span>
                            <Button style={bottomButtonStyle} size="xl" color="primary" title="Settle up" onClick={() => PayModal.open({ bridge: s.payModal, setBridge: b => this.setStateAsync({ payModal: b }) })}>
                                {this.owesMoney(room) && <div className="text-danger" style={{ position: "absolute", fontSize: "0.75em", marginTop: "-16px", marginLeft: "25px" }}><Fas circle /></div>}
                                <Fas hand-holding-dollar />
                            </Button><span> </span>
                            <Button style={bottomButtonStyle} size="xl" color="light" title="Balance Overview" onClick={() => BalanceModal.open({ bridge: s.balanceModal, setBridge: b => this.setStateAsync({ balanceModal: b }) })}><Fas list-ol /></Button><span> </span>
                            <Button style={bottomButtonStyle} size="xl" color="light" title="Settings" onClick={() => this.setStateAsync({ settingsOpen: true })}><Fas gear /></Button><span> </span>

                        </CardBody>
                    </Card>
                </Container>
            </div>
            <this.SettingsModal />
            <this.JoinInfoModal />
            <BalanceModal room={room} hub={p.hub} bridge={s.balanceModal} setBridge={b => this.setStateAsync({ balanceModal: b })} />
            <ChangeNameModal room={room} hub={p.hub} bridge={s.changeNameModal} setBridge={b => this.setStateAsync({ changeNameModal: b })} />
            <ChangeRoomNameModal room={room} hub={p.hub} bridge={s.changeRoomNameModal} setBridge={b => this.setStateAsync({ changeRoomNameModal: b })} />
            <AddUserModal room={room} hub={p.hub} bridge={s.addUserModal} setBridge={b => this.setStateAsync({ addUserModal: b })} />
            <PayModal room={room} hub={p.hub} bridge={s.payModal} setBridge={b => this.setStateAsync({ payModal: b })} />
            <TransactionModal room={room} hub={p.hub} bridge={s.transactionModal} setBridge={b => this.setStateAsync({ transactionModal: b })} />
            <ChooseUserModal opened={!room?.info.selectedUserId && !!room?.users && !!room?.info?.host} hub={p.hub} users={room?.users ?? []} host={room?.info.host ?? ""} roomKey={room?.info.roomRootKey ?? ""} />
            <StatusModal header="Changing user" status={s.clearSelectedUserStatus} />
            <StatusModal header="Sending message..." status={s.sendMessageStatus} />
            <StatusModal header="Refreshing..." status={s.refreshStatus} />
            <StatusModal header="Loading image..." status={s.imageProcessingStatus} />
            <StatusModal header="Submitting image..." status={s.uploadImageStatus} />
            <StatusModal header="Submit image?" status={!!s.submitImagePreview ? <>
                <img src={s.submitImagePreview} style={{ width: "100%" }} />
                <div style={{ float: "right", marginTop: "10px" }}>
                    <Button color="primary" onClick={() => this.setStateAsync({ submitImagePreview: "" })}><Fas cancel /> Cancel</Button><span> </span>
                    <Button color="primary" onClick={() => this.submitImagePreviewWrapper(room)}><Fas paper-plane /> Submit</Button>
                </div>
            </> : ""} close={() => this.setStateAsync({ submitImagePreview: "" })} />
        </>;
    }

    private owesMoney = (room: Room) =>
    {
        return room.balances?.find(b => b.userId === room.info.selectedUserId)?.balances?.some(b => b.balance < 0);
    }

    private clearSelectedUser = async () =>
    {
        const room = this.getRoom();
        if (!room) return;
        await this.props.hub.localRoomController.selectUserId(room.info.host, room.info.roomRootKey, "", s => this.setStateAsync({ clearSelectedUserStatus: s }));
        await this.setStateAsync({ clearSelectedUserStatus: "" });
    }

    private SettingsModal = () =>
    {
        const room = this.getRoom();
        return <Modal isOpen={this.state.settingsOpen} toggle={() => this.setStateAsync({ settingsOpen: !this.state.settingsOpen })}>
            <ModalHeader toggle={() => this.setStateAsync({ settingsOpen: !this.state.settingsOpen })}>
                Settings
            </ModalHeader>
            <ModalBody>
                <Button className="mb-3" color="primary" block onClick={() => this.setStateAsync({ joinInfoOpen: true })}><Fas tag /> Show Join Info</Button>
                <Button className="mb-3" color="primary" block onClick={() => this.clearSelectedUser()}><Fas user-gear /> Change User</Button>
                <Button className="mb-3" color="primary" block onClick={() => ChangeNameModal.open({ bridge: this.state.changeNameModal, setBridge: b => this.setStateAsync({ changeNameModal: b }) })}><Fas user-pen /> User Profile</Button>
                {room?.isMine && <Button className="mb-3" color="primary" block onClick={() => AddUserModal.open({ bridge: this.state.addUserModal, setBridge: b => this.setStateAsync({ addUserModal: b }) })}><Fas user-plus /> Add user</Button>}
                {room?.isMine && <Button className="mb-3" color="primary" block onClick={() => ChangeRoomNameModal.open({ bridge: this.state.changeRoomNameModal, setBridge: b => this.setStateAsync({ changeRoomNameModal: b }) })}><Fas pen-to-square /> Edit Room Name</Button>}
            </ModalBody>
        </Modal>
    }
    private JoinInfoModal = () =>
    {
        const room = this.getRoom();
        if (!room) return <></>;
        const joinLink = this.props.hub.localRoomController.getJoinURL(room.info.host, room.info.roomRootKey);
        this.generateQrCode(joinLink);
        const key = Key.parse(room.info.roomRootKey, -1);
        return <Modal isOpen={this.state.joinInfoOpen} toggle={() => this.setStateAsync({ joinInfoOpen: !this.state.joinInfoOpen })}>
            <ModalHeader toggle={() => this.setStateAsync({ joinInfoOpen: !this.state.joinInfoOpen })}>
                Join Info
            </ModalHeader>
            <ModalBody>
                {joinLink && <Textbox label="Join Link" type="text" bridge={{ value: joinLink }} setBridge={() => { }} />}
                {this.state.qrCode.link === joinLink && this.state.qrCode.done && <div><img src={this.state.qrCode.qr} style={{ width: "100%" }} /></div>}
                <h5>Manual Join</h5>
                <Textbox label="Host" type="text" bridge={{ value: room.info.host }} setBridge={() => { }} />
                <Textbox label="User Id" type="text" bridge={{ value: key?.userId.toString() ?? "??" }} setBridge={() => { }} />
                <Textbox label="Room Id" type="text" bridge={{ value: room.root?.roomId ?? "??" }} setBridge={() => { }} />
            </ModalBody>
        </Modal>
    };
    private generateQrCode = async (joinLink: string) =>
    {
        if (this.state.qrCode.link === joinLink) return;
        if (this.state.qrCode.link) await Wait.until(() => this.state.qrCode.done);
        this.state.qrCode.link = joinLink;
        this.state.qrCode.done = false;
        this.state.qrCode.qr = await this.props.hub.localRoomController.getJoinQRCode(joinLink);
        this.state.qrCode.done = true;
    }
    private sendMessage = async () =>
    {
        const msg = this.state.chatMessage.value;
        const room = this.getRoom();
        if (!room) return;
        if (!msg) return;
        const data: NewTransactionData = {
            creditor: room.info.selectedUserId ?? "",
            currency: this.props.hub.dataController.getLastCurrency(),
            amount: 0,
            debtors: [],
            message: msg
        };
        await this.props.hub.dataController.addTransction(room.info.host, room.info.roomRootKey, data, s => this.setStateAsync({ sendMessageStatus: s }));
        await this.setStateAsync({ sendMessageStatus: "", chatMessage: { value: "" } });
    };
    private submitImagePreviewWrapper = async (room: Room) =>
    {
        if (!this.state.submitImageAction || !this.state.submitImagePreview) return;
        const image = this.state.submitImagePreview;
        await this.setStateAsync({ submitImagePreview: "" });
        await this.setStateAsync({ uploadImageStatus: "Preparing..." });
        const data = await this.props.hub.localRoomController.saveImage(image, s => this.setStateAsync({ uploadImageStatus: s }));
        if (data)
        {
            await this.state.submitImageAction(data, room, s => this.setStateAsync({ uploadImageStatus: s }));
        }
        await this.setStateAsync({ uploadImageStatus: "" });
    }
    private chooseImageToUpload = async () =>
    {
        const image = (await Images.tryUploadPictureToDownsizedB64(512, 50000, s => this.setStateAsync({ imageProcessingStatus: s }))) ?? "";
        await this.setStateAsync({ imageProcessingStatus: "" });
        if (image)
        {
            await this.setStateAsync({ submitImagePreview: image, submitImageAction: (i, r, o) => this.postImageToChat(i, r, o) });
        }
    };
    private postImageToChat = async (image: { host: string, key: string }, room: Room, onStatusChange: OnStatusChange) =>
    {
        if (!room.info.selectedUserId) return;
        const message: NewTransactionData = {
            amount: 0,
            debtors: [],
            creditor: room.info.selectedUserId,
            message: "",
            currency: "",
            image: image
        }
        await this.props.hub.dataController.addTransction(room.info.host, room.info.roomRootKey, message, s => onStatusChange(s));
    }
    private refresh = async () =>
    {
        const room = this.getRoom();
        if (!room) return;

        await this.props.hub.dataController.fetchRoom(room.info.host, room.info.roomRootKey, true, true, s => this.setStateAsync({ refreshStatus: s }));
        await Wait.secs(0.1);
        await this.setStateAsync({ refreshStatus: "" });
    };
}