import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Key } from "jormun-sdk/dist/Key";
import { Component, ComponentChild, JSX } from "preact";
import { JSXInternal } from "preact/src/jsx";
import { Navigate } from "react-router";
import { Button, Card, CardBody, CardHeader, CardText, Container } from "reactstrap";
import { RoomInfo } from "../../../Data/RoomInfo";
import { RoomRoot } from "../../../Data/RoomRoot";
import { RoomUser } from "../../../Data/RoomUser";
import { RoomUserData } from "../../../Data/RoomUserData";
import { Room } from "../../../Hub/DataController";
import { Hub } from "../../../Hub/Hub";
import { Currencies } from "../../../Utils/Currencies";
import { Strings } from "../../../Utils/Strings";
import { BridgeParams } from "../Utility/Bridge";
import { Fas } from "../Utility/Icon";
import { JoinRoomModal, JoinRoomModalBridge } from "./Home/JoinRoomModal";
import { NewRoomModal, NewRoomModalBridge } from "./Home/NewRoomModal";
import { StatusModal } from "./Home/StatusModal";


export interface HomeRouteProps
{
    hub: Hub
}
export class HomeRouteState
{
    newRoomModal = new NewRoomModalBridge();
    joinRoomModal = new JoinRoomModalBridge();
    destroyStatus = "";
    leaveStatus = "";
    redirect = "";
}

export class HomeRoute extends Component<HomeRouteProps, HomeRouteState>
{
    public state = new HomeRouteState();
    public componentDidMount()
    {
    }
    public componentWillUnmount()
    {
    }

    public render(p: HomeRouteProps, s: HomeRouteState): ComponentChild
    {
        const canCreateRoom = this.props.hub.localRoomController.canCreateRoom();
        const rooms = p.hub.dataController.getRooms();
        return <>
            <div style={{ paddingBottom: "140px" }}>
                {[...rooms].sort((a, b) => (b.info.cache?.lastActivity ?? 0) - (a.info.cache?.lastActivity ?? 0)).map(r => <this.roomCard room={r} />)}
            </div>
            <div style={{ position: "fixed", bottom: "56px", left: "0", right: "0" }}>
                <Container>
                    <Card body>
                        <CardText style={{ textAlign: "center" }}>
                            <Button color="primary" onClick={() => JoinRoomModal.open({ bridge: s.joinRoomModal, setBridge: b => this.setState({ joinRoomModal: b }) })}><Fas plus /> Join Room</Button>
                            <span> </span>
                            <Button color="primary" disabled={canCreateRoom ? undefined : true} onClick={() => NewRoomModal.open({ bridge: s.newRoomModal, setBridge: b => this.setState({ newRoomModal: b }) })}><Fas plus /> Create Room</Button>
                            <div>{!canCreateRoom && `To create a room, you need to be logged in to a Jormun server. See the server-tab for more info.`}</div>
                        </CardText>
                    </Card>
                </Container>
            </div>

            <NewRoomModal hub={p.hub} bridge={s.newRoomModal} setBridge={b => this.setState({ newRoomModal: b })} />
            <JoinRoomModal hub={p.hub} bridge={s.joinRoomModal} setBridge={b => this.setState({ joinRoomModal: b })} />
            <StatusModal header="Leaving..." status={s.leaveStatus} />
            <StatusModal header="Deleting..." status={s.destroyStatus} />
            {s.redirect && <Navigate to={s.redirect} />}
        </>;
    }
    private roomCard = (p: { room: Room }): JSXInternal.Element =>
    {
        const canEnter = !p.room.info.dead && typeof p.room.isMine === "boolean";
        const name = Strings.elips(p.room.info.cache?.name ?? "", 30);
        const myUserCache = p.room.balances.find(u => u.userId === p.room.info.selectedUserId) ?? p.room.info?.cache?.users.find(u => u.userId === p.room.info.selectedUserId);
        const relevantBalances = (myUserCache?.balances ?? []).filter(b => b.balance !== 0);
        return <>
            <Card className="mb-3" style={{ cursor: !canEnter ? "" : "pointer" }} onClick={(e) => this.clickRoomCard(p.room, e)}>
                <CardHeader><b>
                    {(typeof p.room.isMine === "boolean" || p.room.info.dead) && <span style={{ float: "right" }}>
                        {p.room.isMine && <Button color="danger" onClick={(e: any) => this.clickRoomDestroy(p.room, e)}><Fas bomb /></Button>}
                        {!p.room.isMine && <Button color="danger" onClick={(e: any) => this.clickRoomRemove(p.room, e)}><Fas times /></Button>}
                    </span>}
                    {!p.room.info.dead && name}
                    {p.room.info.dead && <span title={`Couldn't connect to room ${p.room.info.cache?.name} at ${p.room.info.host}`} ><s>{name}</s> <Fas cloud-bolt /></span>}
                </b></CardHeader>
                <CardBody>
                    {relevantBalances.length > 0 && <div style={{ textAlign: "center" }}>
                        <h5>Your balance:</h5>
                        {relevantBalances.map(b => <>
                            <b><div className={b.balance < 0 ? "text-danger" : (b.balance > 0 ? "text-success" : "")}>{Currencies.formatAmount(b.balance, b.currency)}</div></b>
                        </>)}
                    </div>}
                    {relevantBalances.length == 0 && <>
                        <div style={{ textAlign: "center" }}><b>Open room to view balance...</b></div>
                    </>}
                </CardBody>
            </Card>
        </>
    }
    private clickRoomCard = async (room: Room, e: JSX.TargetedMouseEvent<HTMLElement>) =>
    {
        if (!room.root) return;
        const parsed = Key.parse(room.info.roomRootKey, -1);
        if (!parsed) return;
        this.setState({ redirect: `/room/${btoa(room.info.host)}/${parsed.userId}/${room.root.roomId}` })
    }
    private clickRoomRemove = async (room: Room, e: JSX.TargetedMouseEvent<HTMLElement>) =>
    {
        e.preventDefault();
        e.stopPropagation();
        await this.props.hub.localRoomController.leaveRoom(room.info.host, room.info.roomRootKey, s => this.setState({ leaveStatus: s }));
        this.setState({ leaveStatus: "" });
    }
    private clickRoomDestroy = async (room: Room, e: JSX.TargetedMouseEvent<HTMLElement>) =>
    {
        e.preventDefault();
        e.stopPropagation();
        await this.props.hub.localRoomController.destroyRoom(room.info.host, room.info.roomRootKey, s => this.setState({ destroyStatus: s }));
        this.setState({ destroyStatus: "" });
    }

}