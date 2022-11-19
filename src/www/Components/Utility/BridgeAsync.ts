import { Component, ComponentChild, RenderableProps } from "preact";
import { Wait } from "../../../Utils/Wait";
import { ComponentAsync } from "./ComponentAsync";

export type BridgeParams<Bridge> = { bridge: Bridge, setBridge: (b: Bridge) => void | Promise<void> }

export abstract class BridgeAsync<Props, State, Bridge> extends ComponentAsync<Props & BridgeParams<Bridge>, State>
{

    public get bridge() { return this.props.bridge };
    public setBridge = async <K extends keyof Bridge>(c: Pick<Bridge, K>) =>
    {
        const newBridge = ComponentAsync.change(this.props.bridge, c);
        const promise = this.props.setBridge(newBridge);
        this.props.bridge = newBridge;
        if (promise) await promise;
        await Wait.until(() => !this.isRendering);
    };

    protected renderer(p?: RenderableProps<Props & BridgeParams<Bridge>, any> | undefined, s?: Readonly<State> | undefined, c?: any): ComponentChild | Promise<ComponentChild>
    {
        return this.rendering(p, s, this.bridge);
    }
    protected abstract rendering(p: RenderableProps<Props, any> | undefined, s: Readonly<State> | undefined, b: Bridge): ComponentChild | Promise<ComponentChild>;
}