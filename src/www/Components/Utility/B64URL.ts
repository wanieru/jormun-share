export class B64URL
{
    public static ToBase64(obj: string)
    {
        return window.btoa(obj).replaceAll("/", "-").replaceAll("=", "_");
    }
    public static FromBase64(str: string): string | null
    {
        try
        {
            return window.atob(str.replaceAll("_", "=").replaceAll("-", "/"));
        }
        catch (e)
        {
            console.log(e);
            return null;
        }
    }
}