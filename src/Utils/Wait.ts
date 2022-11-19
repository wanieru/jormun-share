export class Wait
{
    public static async secs(time: number)
    {
        return new Promise<void>(resolve => window.setTimeout(() => resolve(), time * 1000));
    }
    public static async until(callback: () => boolean)
    {
        if (!callback())
        {
            return new Promise<void>(resolve =>
            {
                const interval = window.setInterval(() =>
                {
                    const result = callback();
                    if (result)
                    {
                        window.clearInterval(interval);
                        resolve();
                    }
                }, 1);
            });
        }
    }
}