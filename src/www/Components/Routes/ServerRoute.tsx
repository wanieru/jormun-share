import { JormunRemote } from "jormun-sdk/dist/Jormun";
import { Attributes, Component, ComponentChild, ComponentChildren, Ref, RenderableProps } from "preact";
import { useParams } from "react-router-dom";
import { Button } from "reactstrap";
import { Hub } from "../../../Hub/Hub";
import { Textbox } from "../Input/Textbox";
import { Bridge } from "../Utility/Bridge";
import { Fas } from "../Utility/Icon";


export interface ServerRouteProps
{
    hub: Hub
}
export class ServerRouteState
{
    public showLoginForm = false;
    public host = "";
    public username = "";
    public password = "";
    public jormunRemote: JormunRemote | null = null;
}

export class ServerRoute extends Component<ServerRouteProps, ServerRouteState>
{
    public state = new ServerRouteState();

    public componentDidMount()
    {
        this.props.hub.jormun.onSetup.on(this.reset, this);
        this.reset();
    }
    public componentWillUnmount()
    {
        this.props.hub.jormun.onSetup.off(this.reset, this);
    }
    private async reset()
    {
        const state = new ServerRouteState();
        const remote = await this.props.hub.jormun.hashedRemote();
        state.host = remote?.host ?? "";
        state.username = remote?.username ?? "";
        state.password = "";
        state.jormunRemote = remote;
        state.showLoginForm = !this.props.hub.jormun.getStatus().loggedIn;
        this.setState(state);
    }
    private async login()
    {
        await this.props.hub.server.login(this.state);
        await this.reset();
    }
    public render(p: ServerRouteProps, s: ServerRouteState): ComponentChild
    {
        return <>
            {!p.hub.jormun.getStatus().initialized ? <span class="badge rounded-pill bg-warning mt-3"><Fas spinner /> Loading...</span> : ""}
            {p.hub.jormun.getStatus().initialized && p.hub.jormun.getStatus().loggedIn ? <span class="badge rounded-pill bg-success mt-3"><Fas circle-check /> Logged in as {s.jormunRemote?.username ?? ""}@{(s.jormunRemote?.host ?? "").replace("http://", "").replace("https://", "")}</span> : ""}
            {p.hub.jormun.getStatus().initialized && !p.hub.jormun.getStatus().loggedIn ? <span class="badge rounded-pill bg-danger mt-3"><Fas circle-exclamation /> Not logged in</span> : ""}
            {!p.hub.jormun.getStatus().loggedIn || s.showLoginForm ?
                <form className="mt-3" onSubmit={async e => { e.preventDefault(); await this.login() }}>
                    <Textbox type="text" label={<><Fas globe /> Host</>} bridge={{ value: s.host }} setBridge={v => this.setState({ host: v.value })} />
                    <Textbox type="text" label={<><Fas user /> Username</>} bridge={{ value: s.username }} setBridge={v => this.setState({ username: v.value })} />
                    <Textbox type="password" label={<><Fas icon="key" /> Password</>} bridge={{ value: s.password }} setBridge={v => this.setState({ password: v.value })} />
                    <Button type="submit" color="primary"><Fas right-to-bracket /> Login</Button>
                </form> : ""}
            {!s.showLoginForm ? <div class="mt-3"><button type="button" class="btn btn-primary" onClick={() => this.setState({ showLoginForm: true })}><Fas globe /> Change server</button></div> : ""}
            <div class="mt-3">
                <button type="button" class="btn btn-primary" onClick={() => p.hub.server.export()}><Fas download /> Export</button>{" "}
                <button type="button" class="btn btn-primary" onClick={() => p.hub.server.import()}><Fas upload /> Import</button>
            </div>
        </>;

    }
}