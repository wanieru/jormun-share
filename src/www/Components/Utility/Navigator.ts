export class Navigator
{
    private static target = "";
    public static setTarget(target: string)
    {
        Navigator.target = target;
    }
    public static popTarget()
    {
        const target = Navigator.target;
        Navigator.target = "";
        return target;
    }
}