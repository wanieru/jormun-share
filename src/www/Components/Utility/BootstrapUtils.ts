export enum BootstrapSizes
{
    Xl = "xl",
    Lg = "lg",
    Md = "md",
    Sm = "sm",
    Xs = "xs"
}
export class BootstrapUtils
{
    public static getViewport(): BootstrapSizes
    {
        const sizes = this.getViewports();
        return sizes[sizes.length - 1];
    }
    public static getViewports()
    {
        const viewports: BootstrapSizes[] = [];
        const width = Math.max(
            document.documentElement.clientWidth,
            window.innerWidth || 0
        )
        viewports.push(BootstrapSizes.Xs);
        if (width >= 576) viewports.push(BootstrapSizes.Sm);
        if (width >= 768) viewports.push(BootstrapSizes.Md);
        if (width >= 992) viewports.push(BootstrapSizes.Lg);
        if (width >= 1200) viewports.push(BootstrapSizes.Xl);
        return viewports;
    }
}