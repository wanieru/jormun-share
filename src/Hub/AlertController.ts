import { AlertContent } from "jormun-sdk/dist/Jormun";
import { Wait } from "../Utils/Wait";
import { Hub } from "./Hub";

export class AlertController
{
    private model: Hub;
    private updateToastsHandle;
    public constructor(model: Hub)
    {
        this.model = model;
        this.updateToastsHandle = window.setInterval(() => this.updateToasts(), 2000);
    }
    private async updateToasts()
    {
        let changed = false;
        for (const toast of this.model.view.alerts.toasts)
        {
            const interval = (Date.now() - toast.time) / 1000;
            const str = AlertController.secsAgoToStr(interval) + "...";
            if (toast.timeStr !== str)
            {
                toast.timeStr = str;
                changed = true;
            }
        }
        if (changed) this.model.update();
    }
    public static secsAgoToStr(secs: number)
    {
        if (secs < 5) return "Just now";
        if (secs < 10) return "5 seconds ago";
        if (secs < 30) return "10 seconds ago";
        if (secs < 60) return "30 seconds ago";
        const mins = Math.floor(secs / 60);
        if (mins == 1) return "1 minute ago";
        if (mins < 60) return `${mins} minutes ago`;
        const hours = Math.floor(mins / 60);
        if (hours == 1) return "1 hour ago";
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days == 1) return "Yesterday";
        if (days < 31) return `${days} days ago`;
        const months = Math.floor(days / 31);
        if (months == 1) return "Last month";
        if (days < 365) return `${months} months ago`;
        const years = Math.floor(days / 365);
        if (years == 1) return "Last year";
        return `${years} years ago`;
    }
    public static timeToAgoStr(time: number, maxAgoTime: number)
    {
        const secsAgo = (Date.now() - time) / 1000;
        if (secsAgo > maxAgoTime) return new Date(time).toLocaleDateString();
        return this.secsAgoToStr(secsAgo);
    }

    public async handleAlert(obj: AlertContent): Promise<number>
    {
        if (obj.title === "Syncing")
        {
            for (let i = 0; i < obj.options.length; i++)
            {
                if (obj.options[i].startsWith("Remote")) 
                {
                    console.log("Forcing a remote sync!");
                    return i;
                }
            }
        }
        return await new Promise<number>(resolve =>
        {
            if (obj.options.length > 1)
            {
                this.model.view.alerts.questions.push({ content: obj, resolve: resolve });
            }
            else
            {
                const resolveWrapper = () => resolve(obj.options.length > 0 ? 0 : -1);
                this.model.view.alerts.toasts.unshift({ content: obj, resolve: () => { }, time: Date.now(), timeStr: AlertController.secsAgoToStr(0) });
                Wait.secs(0.1).then(() => resolveWrapper());
            }
            this.model.update();
        });
    }
    public async resolveToast(content: AlertContent)
    {
        const t = this.model.view.alerts.toasts.find(t => t.content === content);
        this.model.view.alerts.toasts = this.model.view.alerts.toasts.filter(t => t.content !== content);
        t?.resolve();
        this.model.update();
    }
    public async resolveQuestion(content: AlertContent, choice: number)
    {
        const t = this.model.view.alerts.questions.find(t => t.content === content);
        this.model.view.alerts.questions = this.model.view.alerts.questions.filter(t => t.content !== content);
        t?.resolve(choice);
        this.model.update();
    }
}