import { Component, ComponentChild, RenderableProps } from "preact";

export type BridgeParams<Bridge> = { bridge: Bridge, setBridge: (b: Bridge) => void }

export abstract class Bridge<Props, State, Bridge> extends Component<Props & BridgeParams<Bridge>, State>
{
    private static change<S, K extends keyof S>(old: S, change: Pick<S, K>): S
    {
        const obj: S = {} as S;
        for (const key in old)
        {
            if (change.hasOwnProperty(key))
            {
                obj[key] = (change as any)[key];
            }
            else
            {
                obj[key] = old[key];
            }
        }
        return obj;
    }
    public get bridge() { return this.props.bridge };
    public setBridge = <K extends keyof Bridge>(c: Pick<Bridge, K>) =>
    {
        const newBridge = Bridge.change(this.props.bridge, c);
        this.props.setBridge(newBridge);
        this.props.bridge = newBridge;
    };

    public render(props?: RenderableProps<Props & { bridge: Bridge; setBridge: (bridge: Bridge) => void; }, any> | undefined, state?: Readonly<State> | undefined, context?: any): ComponentChild
    {
        return this.renderer(props as Props, state as State, this.bridge);
    }
    protected abstract renderer(p: Props, s: State, b: Bridge): ComponentChild;
}