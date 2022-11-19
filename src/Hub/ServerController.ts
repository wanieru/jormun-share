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
        this.model.jormun.onSync.on(() => this.checkBoth(true), this);
    }

    private async checkBoth(update = false)
    {
        await this.checkLocal();
        await this.checkRemote();
        if (update) this.model.update();
    }

    private async checkLocal(dontUpdate = false)
    {
        const result = await this.model.jormun.isLocalDirty();
        const sync = this.model.view.sync;
        const changed = sync.localDirty !== result.isDirty || sync.localVersion !== result.localVersion;
        sync.localDirty = result.isDirty;
        sync.localVersion = result.localVersion;
        if (changed && !dontUpdate) this.model.update();
    }
    private async checkRemote(dontUpdate = false)
    {
        const result = await this.model.jormun.different();
        const oldNewer = this.model.view.sync.remoteNewer;
        this.model.view.sync.remoteNewer = !!result.comparison && result.comparison.download && !this.model.jormun.getStatus().syncing;
        if (oldNewer !== this.model.view.sync.remoteNewer && !dontUpdate) this.model.update();
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