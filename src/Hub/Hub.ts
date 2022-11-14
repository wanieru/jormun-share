import { Jormun } from "jormun-sdk/dist/Jormun";
import { Wait } from "../Utils/Wait";
import { View } from "../www/View/View";
import { AlertController } from "./AlertController";
import { DataController } from "./DataController";
import { LocalRoomController } from "./LocalRoomController";
import { NavigationController } from "./NavigationController";
import { RemoteRoomController } from "./RemoteRoomController";
import { ServerController } from "./ServerController";
export class Hub
{
    public static app: string = "share";
    public static appTitle: string = "Billshare";

    public jormun: Jormun;

    public alert: AlertController;
    public server: ServerController;
    public localRoomController: LocalRoomController;
    public remoteRoomController: RemoteRoomController;
    public dataController: DataController;
    public navigation: NavigationController;

    public onUpdate: ((s: View) => void)[] = [];
    public view: View = new View();

    public constructor(onUpdate: ((s: View) => void)[])
    {
        (window as any).hub = this;
        onUpdate.forEach(o => this.onUpdate.push(o));

        this.jormun = new Jormun();

        this.server = new ServerController(this);
        this.alert = new AlertController(this);
        this.localRoomController = new LocalRoomController(this);
        this.remoteRoomController = new RemoteRoomController(this);
        this.dataController = new DataController(this);
        this.navigation = new NavigationController(this);

        this.initialize();
        this.loadAnimation();
    }
    private async initialize()
    {
        this.jormun.onSetup.on(this.update, this);
        this.jormun.onSync.on(this.setLeaveConfirmation, this);
        this.jormun.onAnyDataChange.on(this.update, this);
        await this.jormun.initialize(Hub.app, a => this.alert.handleAlert(a));
    }
    private async loadAnimation()
    {
        while (!this.jormun.getStatus().initialized)
        {
            await Wait.secs(0.05);
            this.view.root.loadAnimation++;
            this.update();
        }
    }
    private setLeaveConfirmation(syncing: boolean)
    {
        window.onbeforeunload = syncing ? (() => "Sync is in progress.") : null;
    }
    public update()
    {
        this.onUpdate.forEach(o => o(this.view));
    }
}