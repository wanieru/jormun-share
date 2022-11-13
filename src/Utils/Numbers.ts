export class Numbers
{
    public static sum(array: number[])
    {
        let sum = 0;
        for (const num of array) sum += num;
        return sum;
    }
    public static round(num: number, decimals: number)
    {
        decimals = Math.round(decimals);
        const factor = 10 ** decimals;
        return Math.round(num * factor) / factor;
    }
}