import { IRemote } from "jormun-sdk/dist/IRemote";
import { Jormun, JormunRemote } from "jormun-sdk/dist/Jormun";
import { Attributes, Component, ComponentChild, ComponentChildren, Ref, RenderableProps } from "preact";
import { useParams } from "react-router-dom";
import { Alert, Button } from "reactstrap";
import { Hub } from "../../../Hub/Hub";
import { Textbox } from "../Input/Textbox";
import { BridgeAsync } from "../Utility/BridgeAsync";
import { ComponentAsync } from "../Utility/ComponentAsync";
import { Fab, Fas } from "../Utility/Icon";


export interface Config
{
    defaultSyncServer?: string;
    openSignUps?: boolean;
}
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
    public config?: Config;
}

export class ServerRoute extends ComponentAsync<ServerRouteProps, ServerRouteState>
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
    private async fetchConfig()
    {
        const data = await fetch("www/json/config.json");
        if (data.status == 200)
        {
            try
            {
                const json = await data.json();
                this.setState({ config: json });
                return json;
            } catch (e) { }
        }
    }
    private async reset()
    {
        const state = new ServerRouteState();
        const remote = await this.props.hub.jormun.hashedRemote();
        const config = await this.fetchConfig();
        state.host = remote?.host ?? config?.defaultSyncServer ?? "";
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
    public renderer(p: ServerRouteProps, s: ServerRouteState): ComponentChild
    {
        return <>
            {!p.hub.jormun.getStatus().initialized ? <span class="badge rounded-pill bg-warning mt-3"><Fas spinner /> Loading...</span> : ""}
            {p.hub.jormun.getStatus().initialized && p.hub.jormun.getStatus().loggedIn ? <span class="badge rounded-pill bg-success mt-3"><Fas circle-check /> Logged in as {s.jormunRemote?.username ?? ""}@{(s.jormunRemote?.host ?? "").replace("http://", "").replace("https://", "")}</span> : ""}
            {p.hub.jormun.getStatus().initialized && !p.hub.jormun.getStatus().loggedIn ? <>
                {<span class="badge rounded-pill bg-danger mt-3"><Fas circle-exclamation /> Not logged in</span>}
                <Alert color="info">
                    <p>
                        {Hub.appTitle} doesn't have a dedicated backend. It uses a Jormun Sync server: a self-hosted application, which lets you synchronize data for small web apps between devices.
                    </p>
                    <p>
                        The person creating a {Hub.appTitle} room needs to be connected to such a server, which is where the data will live and be shared between the users. </p>
                    <p><b>Anyone joining that room to share expenses does not need to be connected to a Sync Server.</b>
                    </p>
                    {s.config?.defaultSyncServer && <><p>
                        This instance of {Hub.appTitle} recommends you try <b><a href={s.config.defaultSyncServer} target="_blank">{s.config.defaultSyncServer}</a></b> as the Sync Server.</p>
                        {s.config.openSignUps && <b>You can sign up for a user on {s.config.defaultSyncServer} by typing in a new username and password, and clicking the "sign up" button below.</b>}
                    </>}
                </Alert>
            </> : ""}
            {!p.hub.jormun.getStatus().loggedIn || s.showLoginForm ?
                <form className="mt-3" onSubmit={async e => { e.preventDefault(); await this.login() }}>
                    <Textbox type="text" label={<><Fas globe /> Host</>} bridge={{ value: s.host }} setBridge={v => this.setState({ host: v.value })} />
                    <Textbox type="text" label={<><Fas user /> Username</>} bridge={{ value: s.username }} setBridge={v => this.setState({ username: v.value })} />
                    <Textbox type="password" label={<><Fas icon="key" /> Password</>} bridge={{ value: s.password }} setBridge={v => this.setState({ password: v.value })} />
                    <Button type="submit" color="primary"><Fas right-to-bracket /> Login</Button>
                    {(s?.config?.defaultSyncServer && s?.config.openSignUps) && <><span> </span><Button type="button" color="primary" onClick={() => this.signup()}><Fas user-plus /> Sign Up</Button></>}
                </form> : ""}
            {!s.showLoginForm ? <div class="mt-3"><button type="button" class="btn btn-primary" onClick={() => this.setState({ showLoginForm: true })}><Fas globe /> Change server</button></div> : ""}
            <div class="mt-3">
                <button type="button" class="btn btn-primary" onClick={() => p.hub.server.export()}><Fas download /> Export</button>{" "}
                <button type="button" class="btn btn-primary" onClick={() => p.hub.server.import()}><Fas upload /> Import</button>
            </div>
            <div className="mt-3">
                <div><a target="_blank" href="https://github.com/wanieru/jormun-share"><Fab github /> {Hub.appTitle} on Github</a></div>
            </div>
        </>;

    }
    private signup = async () =>
    {
        const remote: IRemote = (await Jormun.getAnonymousRemote("jormun_sync", this.state.host, a => this.props.hub.alert.handleAlert(a))) as any;
        const response = await remote.register("", this.state.username, this.state.password, 1, false);
        if (response)
        {
            this.props.hub.jormun.alert("Success!", "You are now signed up! Attempting to log you in...");
            await this.login();
            this.props.hub.navigation.setTarget("/");
        }
    };
}