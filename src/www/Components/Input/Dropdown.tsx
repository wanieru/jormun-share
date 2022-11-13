import { ChangeEvent, JSX } from "react";
import { Bridge } from '../Utility/Bridge';
import { JSXInternal } from "preact/src/jsx";

export interface DropdownOption { key: string, value: string, disabled?: boolean }
export interface DropdownProps 
{
    label?: string | JSXInternal.Element;
    options: DropdownOption[]
    initial?: string,
    labelBlock?: boolean
    id?: string
    style?: JSX.CSSProperties
    disabled?: boolean
}
export class DropdownBridge
{
    current = "";
}
export class DropdownState 
{

}

export class Dropdown extends Bridge<DropdownProps, DropdownState, DropdownBridge>
{
    componentDidMount = () => 
    {
        if (!this.bridge.current)
            this.setBridge({ current: this.props.initial ?? "" });
    };
    public state = new DropdownState();
    private onChange = (e: string) => 
    {
        this.setBridge({ current: e });
    }
    public renderer = () => 
    {
        const options = [];
        for (const option of this.props.options)
        {
            options.push(<option key={option.key} value={option.key} disabled={option.disabled ?? false}>{option.value}</option>);
        }
        return <>
            {this.props.label && <label className="form-label" style={{ marginRight: "10px", display: this.props.labelBlock ? "block" : "inline-block" }}>{this.props.label ?? ""}</label>}
            <select disabled={this.props.disabled} style={this.props.style} id={this.props.id} value={this.bridge.current} onChange={(e: any) => this.onChange(e.target.value)} className={"form-select"}>
                {options}
            </select>
        </>;
    }
}