const FontAwesome = (style: string, props: any) =>
{
    let className = style;
    let css: any = undefined;
    for (let i in props) 
    {
        if (i === "className")
        {
            className += " " + props[i];
        }
        else if (i === "style")
        {
            css = props[i];
        }
        else if (i === "icon")
        {
            className += " fa-" + props[i];
        }
        else
        {
            className += " fa-" + i;
        }
    }
    return (<i className={className} style={css}></i>);
}

export const Fas = (props: any) => FontAwesome("fas", props);
export const Far = (props: any) => FontAwesome("far", props);
export const Fad = (props: any) => FontAwesome("fad", props);
export const Fal = (props: any) => FontAwesome("fal", props);
export const Fab = (props: any) => FontAwesome("fab", props);