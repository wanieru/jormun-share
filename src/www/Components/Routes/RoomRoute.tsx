import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Component, ComponentChild, h, JSX } from "preact";
import { JSXInternal } from "preact/src/jsx";
import { Navigate, useParams } from "react-router";
import { Button, Card, CardBody, CardHeader, CardText, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import { RoomInfo } from "../../../Data/RoomInfo";
import { RoomRoot } from "../../../Data/RoomRoot";
import { NewTransactionData, RoomTransaction } from "../../../Data/RoomTransaction";
import { RoomUser } from "../../../Data/RoomUser";
import { RoomUserData } from "../../../Data/RoomUserData";
import { AlertController } from "../../../Hub/AlertController";
import { Room } from "../../../Hub/DataController";
import { Hub } from "../../../Hub/Hub";
import { Wait } from "../../../Utils/Wait";
import { Textbox, TextboxBridge } from "../Input/Textbox";
import { BridgeParams } from "../Utility/Bridge";
import { Currencies } from "../../../Utils/Currencies";
import { Fas } from "../Utility/Icon";
import { JoinRoomModal, JoinRoomModalBridge } from "./Home/JoinRoomModal";
import { NewRoomModal, NewRoomModalBridge } from "./Home/NewRoomModal";
import { StatusModal } from "./Home/StatusModal";
import { BalanceModal, BalanceModalBridge } from "./Room/BalanceModal";
import { ChangeNameModal, ChangeNameModalBridge } from "./Room/ChangeNameModal";
import { ChooseUserModal } from "./Room/ChooseUserModal";
import { PayModal, PayModalBridge } from "./Room/PayModal";
import { TransactionList } from "./Room/TransactionList";
import { TransactionModal, TransactionModalBridge } from "./Room/TransactionModal";
import { TransactionView } from "./Room/TransactionView";
import { ChangeRoomNameModal, ChangeRoomNameModalBridge } from "./Room/ChangeRoomNameModal";
import { AddUserModal, AddUserModalBridge } from "./Room/AddUserModal";
import { Strings } from "../../../Utils/Strings";
import { Key } from "jormun-sdk/dist/Key";
import { B64URL } from "../Utility/B64URL";

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

    transactionShowLimit = 10;

    redirectToJoin = false;
}

export class RoomRoute extends Component<RoomRouteProps, RoomRouteState>
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
                await this.props.hub.dataController.fetchRoom(room.info.host, room.info.roomRootKey, true, true, s => this.setState({ fetchStatus: s }));
                this.setState({ fetchStatus: "" });
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
            this.setState({ redirectToJoin: true });
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

    public render(p: RoomRouteProps, s: RoomRouteState): ComponentChild
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
                {s.transactionShowLimit < room.fullTransactionList.length && <Button color="light" block className="mb-3" onClick={() => { this.setState({ transactionShowLimit: s.transactionShowLimit + 25 }) }}><Fas caret-up /> Show more...</Button>}
                {room.users && <TransactionList
                    hub={p.hub}
                    room={room}
                    limit={s.transactionShowLimit}
                    onEdit={e => TransactionModal.edit({ bridge: s.transactionModal, setBridge: b => this.setState({ transactionModal: b }) }, room.info.selectedUserId ?? "", e)}
                    onPreview={e => TransactionModal.preview({ bridge: s.transactionModal, setBridge: b => this.setState({ transactionModal: b }) }, room.info.selectedUserId ?? "", e)}
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
                                <Textbox placeholder="Write a message..." type="text" bridge={s.chatMessage} setBridge={b => this.setState({ chatMessage: b })} suffix={
                                    <>
                                        <Button size="xl" color="primary" title="Send message" onClick={() => this.sendMessage()}><Fas paper-plane /></Button>
                                        {<Button size="xl" color="primary" disabled={!p.hub.jormun.getStatus().loggedIn} title="Send image" onClick={() => this.chooseImage()}><Fas image /></Button>}
                                    </>
                                } />
                            </div>
                            <Button style={bottomButtonStyle} size="xl" color="primary" title="Add outlay" onClick={() => TransactionModal.open({ bridge: s.transactionModal, setBridge: b => this.setState({ transactionModal: b }) }, room.info.selectedUserId ?? "")}><Fas style={{ minWidth: "22.5px" }} receipt /></Button><span> </span>
                            <Button style={bottomButtonStyle} size="xl" color="primary" title="Settle up" onClick={() => PayModal.open({ bridge: s.payModal, setBridge: b => this.setState({ payModal: b }) })}>
                                {this.owesMoney(room) && <div className="text-danger" style={{ position: "absolute", fontSize: "0.75em", marginTop: "-16px", marginLeft: "25px" }}><Fas circle /></div>}
                                <Fas hand-holding-dollar />
                            </Button><span> </span>
                            <Button style={bottomButtonStyle} size="xl" color="light" title="Balance Overview" onClick={() => BalanceModal.open({ bridge: s.balanceModal, setBridge: b => this.setState({ balanceModal: b }) })}><Fas list-ol /></Button><span> </span>
                            <Button style={bottomButtonStyle} size="xl" color="light" title="Settings" onClick={() => this.setState({ settingsOpen: true })}><Fas gear /></Button><span> </span>

                        </CardBody>
                    </Card>
                </Container>
            </div>
            <this.SettingsModal />
            <this.JoinInfoModal />
            <BalanceModal room={room} hub={p.hub} bridge={s.balanceModal} setBridge={b => this.setState({ balanceModal: b })} />
            <ChangeNameModal room={room} hub={p.hub} bridge={s.changeNameModal} setBridge={b => this.setState({ changeNameModal: b })} />
            <ChangeRoomNameModal room={room} hub={p.hub} bridge={s.changeRoomNameModal} setBridge={b => this.setState({ changeRoomNameModal: b })} />
            <AddUserModal room={room} hub={p.hub} bridge={s.addUserModal} setBridge={b => this.setState({ addUserModal: b })} />
            <PayModal room={room} hub={p.hub} bridge={s.payModal} setBridge={b => this.setState({ payModal: b })} />
            <TransactionModal room={room} hub={p.hub} bridge={s.transactionModal} setBridge={b => this.setState({ transactionModal: b })} />
            <ChooseUserModal opened={!room?.info.selectedUserId && !!room?.users && !!room?.info?.host} hub={p.hub} users={room?.users ?? []} host={room?.info.host ?? ""} roomKey={room?.info.roomRootKey ?? ""} />
            <StatusModal header="Changing user" status={s.clearSelectedUserStatus} />
            <StatusModal header="Sending message..." status={s.sendMessageStatus} />
            <StatusModal header="Refreshing..." status={s.refreshStatus} />
            <StatusModal header="Loading image..." status={s.imageProcessingStatus} />
            <StatusModal header="Submitting image..." status={s.uploadImageStatus} />
            <StatusModal header="Submit image?" status={!!s.submitImagePreview ? <>
                <img src={s.submitImagePreview} style={{ width: "100%" }} />
                <div style={{ float: "right", marginTop: "10px" }}>
                    <Button color="primary" onClick={() => this.setState({ submitImagePreview: "" })}><Fas cancel /> Cancel</Button><span> </span>
                    <Button color="primary" onClick={() => this.submitImage(room)}><Fas paper-plane /> Submit</Button>
                </div>
            </> : ""} close={() => this.setState({ submitImagePreview: "" })} />
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
        await this.props.hub.localRoomController.selectUserId(room.info.host, room.info.roomRootKey, "", s => this.setState({ clearSelectedUserStatus: s }));
        this.setState({ clearSelectedUserStatus: "" });
    }

    private SettingsModal = () =>
    {
        const room = this.getRoom();
        return <Modal isOpen={this.state.settingsOpen} toggle={() => this.setState({ settingsOpen: !this.state.settingsOpen })}>
            <ModalHeader toggle={() => this.setState({ settingsOpen: !this.state.settingsOpen })}>
                Settings
            </ModalHeader>
            <ModalBody>
                <Button className="mb-3" color="primary" block onClick={() => this.setState({ joinInfoOpen: true })}><Fas tag /> Show Join Info</Button>
                <Button className="mb-3" color="primary" block onClick={() => this.clearSelectedUser()}><Fas user-gear /> Change User</Button>
                <Button className="mb-3" color="primary" block onClick={() => ChangeNameModal.open({ bridge: this.state.changeNameModal, setBridge: b => this.setState({ changeNameModal: b }) })}><Fas user-pen /> User Profile</Button>
                {room?.isMine && <Button className="mb-3" color="primary" block onClick={() => AddUserModal.open({ bridge: this.state.addUserModal, setBridge: b => this.setState({ addUserModal: b }) })}><Fas user-plus /> Add user</Button>}
                {room?.isMine && <Button className="mb-3" color="primary" block onClick={() => ChangeRoomNameModal.open({ bridge: this.state.changeRoomNameModal, setBridge: b => this.setState({ changeRoomNameModal: b }) })}><Fas pen-to-square /> Edit Room Name</Button>}
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
        return <Modal isOpen={this.state.joinInfoOpen} toggle={() => this.setState({ joinInfoOpen: !this.state.joinInfoOpen })}>
            <ModalHeader toggle={() => this.setState({ joinInfoOpen: !this.state.joinInfoOpen })}>
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
        await this.props.hub.dataController.addTransction(room.info.host, room.info.roomRootKey, data, s => this.setState({ sendMessageStatus: s }));
        await Wait.secs(0.1);
        this.setState({ sendMessageStatus: "", chatMessage: { value: "" } });
    };
    private chooseImage = async () =>
    {
        const element = document.createElement("input");
        element.type = "file";
        element.style.display = "none";
        element.accept = "image/*";
        document.body.appendChild(element);
        element.click();
        this.setState({ imageProcessingStatus: "Waiting for file..." });
        await new Promise<void>(resolve => 
        {
            element.onchange = () => resolve();
        });
        if (element.files && element.files.length > 0)
        {
            const fileReader = new FileReader();
            const file = element.files[0];
            fileReader.readAsDataURL(file);
            this.setState({ imageProcessingStatus: "Loading file..." });
            await new Promise<void>(resolve => fileReader.onload = () => resolve());
            let dataUrl = fileReader.result;


            if (typeof dataUrl === "string" && !!dataUrl)
            {
                const originalImg = document.createElement("img");
                originalImg.src = dataUrl ?? "";
                this.setState({ imageProcessingStatus: "Parsing image 1/2..." });
                await new Promise<void>(resolve => originalImg.onload = () => resolve());
                const originalImage = new Image();
                originalImage.src = dataUrl;
                this.setState({ imageProcessingStatus: "Parsing image 2/2..." });
                await new Promise<void>(resolve => originalImage.onload = () => resolve());

                const maxDimension = 512;
                let width = originalImage.width;
                let height = originalImage.height;

                if (width > maxDimension)
                {
                    const scale = maxDimension / width;
                    width *= scale;
                    height *= scale;
                }
                if (height > maxDimension)
                {
                    const scale = maxDimension / height;
                    width *= scale;
                    height *= scale;
                }

                const maxSize = 50000;
                while (dataUrl.length > maxSize)
                {
                    this.setState({ imageProcessingStatus: `Downsizing image to ${width}x${height}...` });
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext("2d");
                    if (!ctx) break;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high"
                    ctx.drawImage(originalImg, 0, 0, width, height);
                    dataUrl = canvas.toDataURL(file.type);
                    width *= 0.9;
                    height *= 0.9;
                }
                if (dataUrl.length < maxSize)
                {
                    this.setState({ submitImagePreview: dataUrl });
                }
            }
        }
        this.setState({ imageProcessingStatus: "" });
        element.remove();
    };
    private submitImage = async (room: Room) =>
    {
        if (!room.info.selectedUserId) return;
        const data = await this.props.hub.localRoomController.saveImage(this.state.submitImagePreview, s => this.setState({ uploadImageStatus: s }));
        if (data)
        {
            const message: NewTransactionData = {
                amount: 0,
                debtors: [],
                creditor: room.info.selectedUserId,
                message: "",
                currency: "",
                image: { key: data.key, host: data.host }
            }
            await this.props.hub.dataController.addTransction(room.info.host, room.info.roomRootKey, message, s => this.setState({ uploadImageStatus: s }));
        }
        this.setState({ uploadImageStatus: "", submitImagePreview: "" });
    }
    private refresh = async () =>
    {
        const room = this.getRoom();
        if (!room) return;

        await this.props.hub.dataController.fetchRoom(room.info.host, room.info.roomRootKey, true, true, s => this.setState({ refreshStatus: s }));
        await Wait.secs(0.1);
        this.setState({ refreshStatus: "" });
    };
}