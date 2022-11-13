import { useNavigate } from "react-router";
import { Downloader } from "../Utils/Downloader";
import { Hub } from "./Hub";

export class ServerController
{
    private model: Hub;

    private localInterval: number;
    private remoteInterval: number;

    public constructor(model: Hub)
    {
        this.model = model;
        this.localInterval = window.setInterval(() => this.checkLocal(), 5000);
        this.remoteInterval = window.setInterval(() => this.checkRemote(), 30000);
        this.model.jormun.onSync.on(this.checkBoth, this);
    }

    private async checkBoth()
    {
        await this.checkLocal();
        await this.checkRemote();
    }

    private async checkLocal()
    {
        const result = await this.model.jormun.isLocalDirty();
        this.model.view.sync.localDirty = result.isDirty;
        this.model.view.sync.localVersion = result.localVersion;
        this.model.update();
    }
    private async checkRemote()
    {
        const result = await this.model.jormun.different();
        this.model.view.sync.remoteNewer = !!result.comparison && result.comparison.download && !this.model.jormun.getStatus().syncing;
        this.model.update();
    }
    public async login(p: { username: string, password: string, host: string })
    {
        const remote = {
            username: p.username,
            password: p.password,
            host: p.host,
            token: "",
            downloadSharedData: false
        };
        await this.model.jormun.login(remote);
    }
    public async export() 
    {
        Downloader.download(await this.model.jormun.export(), "data.jormun-share");
    }
    public async import()
    {
        await this.model.jormun.import(await Downloader.import(".jormun-share"));
    }
}