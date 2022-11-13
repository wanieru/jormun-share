export class Wait
{
    public static async secs(time: number)
    {
        return new Promise<void>(resolve => window.setTimeout(() => resolve(), time * 1000));
    }
    public static async until(callback: () => boolean)
    {
        return new Promise<void>(resolve =>
        {
            const interval = window.setInterval(() =>
            {
                if (callback())
                {
                    window.clearInterval(interval);
                    resolve();
                }
            }, 1);
        });
    }
}