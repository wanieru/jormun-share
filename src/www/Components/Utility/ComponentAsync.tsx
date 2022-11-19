import { ChangeEvent, Component, JSX } from "react";
import { BridgeAsync } from './BridgeAsync';
import { JSXInternal } from "preact/src/jsx";
import { ComponentChild, RenderableProps } from "preact";
import { Wait } from "../../../Utils/Wait";

export abstract class ComponentAsync<P, S> extends Component<P, S>
{
    private id = Math.random();
    private previouslyRendered: ComponentChild = <></>;
    private queuedRender: ComponentChild | null = null;
    protected isRendering = false;

    public static change<S, K extends keyof S>(old: S, change: Pick<S, K>): S
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

    protected setStateAsync = async <K extends keyof S>(state: Pick<S, K>) =>
    {
        const newState = ComponentAsync.change(this.state, state);
        const promise = new Promise<void>(resolve =>
        {
            this.setState(newState, () => resolve());
        });
        this.state = newState;
        await promise;
        await Wait.until(() => !this.isRendering);
    }

    public render = (p?: RenderableProps<P, any> | undefined, s?: Readonly<S> | undefined, c?: any) => 
    {
        if (this.isRendering) return;
        this.isRendering = true;
        if (!!this.queuedRender)
        {
            this.previouslyRendered = this.queuedRender;
            this.isRendering = false;
        }
        else
        {
            const result = this.renderer(p, s);
            if (result?.constructor?.name === "Promise")
            {
                const promise = result as Promise<ComponentChild>;
                promise.then(p =>
                {
                    this.queuedRender = p;
                    this.isRendering = false;
                    this.forceUpdate(() =>
                    {
                        this.queuedRender = null;
                    });
                });
            }
            else
            {
                this.previouslyRendered = result;
                this.isRendering = false;
            }
        }
        return this.previouslyRendered;
    }
    protected abstract renderer(p?: RenderableProps<P, any> | undefined, s?: Readonly<S> | undefined, c?: any): Promise<ComponentChild> | ComponentChild
}