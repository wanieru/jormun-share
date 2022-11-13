export class Strings
{
    public static elips(str: string, maxLength: number)
    {
        if (str.length >= maxLength) return str.substring(0, maxLength - 3) + "...";
        return str;
    }
}