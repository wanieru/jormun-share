import { Wait } from "../Utils/Wait";
import { Hub } from "./Hub";

export class NavigationController
{
    private hub: Hub;
    public constructor(hub: Hub)
    {
        this.hub = hub;
    }
    private target = "";
    public setTarget(target: string)
    {
        this.target = target;
        this.hub.update();
    }
    public popTarget()
    {
        const target = this.target;
        this.target = "";
        if (target !== this.target)
        {
            Wait.secs(0).then(() => this.hub.update());
        }
        return target;
    }
}