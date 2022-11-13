import { AlertContent } from "jormun-sdk/dist/Jormun"

export class View
{
    public root = {
        loadAnimation: 0
    };
    public sync = {
        localDirty: false,
        localVersion: "-",
        remoteNewer: false
    }
    public alerts = {
        toasts: [] as { content: AlertContent, resolve: () => void, time: number, timeStr: string }[],
        questions: [] as { content: AlertContent, resolve: (val: number) => void }[]
    }
}
