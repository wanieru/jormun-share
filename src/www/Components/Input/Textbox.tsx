import { JSXInternal } from 'preact/src/jsx';
import { FormGroup, Label, Input as FormInput, FormText, InputGroup, InputGroupText } from 'reactstrap';
import { Bridge } from '../Utility/Bridge';
import { Dropdown } from './Dropdown';

export interface TextboxProps 
{
    id?: string
    label?: JSXInternal.Element | string
    placeholder?: string,
    hint?: string,
    type: "text" | "password" | "email" | "number",
    decimals?: number,
    prefix?: string | JSXInternal.Element,
    suffix?: string | JSXInternal.Element,
    min?: number
    max?: number
    disabled?: boolean
}
export class TextboxBridge 
{
    value = "";
}
export class TextboxState
{
}

export class Textbox extends Bridge<TextboxProps, TextboxState, TextboxBridge>
{
    public renderer = () => 
    {
        return (
            <FormGroup className="mb-3">
                {!!this.props.label && <Label for={this.props.id}>{this.props.label}</Label>}
                <InputGroup>
                    {!!this.props.prefix && typeof this.props.prefix === "string" && <InputGroupText>{this.props.prefix}</InputGroupText>}
                    {!!this.props.prefix && typeof this.props.prefix !== "string" && this.props.prefix}
                    <FormInput disabled={this.props.disabled} type={this.props.type} name={this.props.id} id={this.props.id} placeholder={this.props.placeholder} value={this.bridge.value} step={this.props.decimals ? (10 ** -this.props.decimals) : undefined} min={this.props.min} max={this.props.max} onChange={(e: any) => this.setBridge({ value: e.target.value })} />
                    {!!this.props.suffix && typeof this.props.suffix === "string" && <InputGroupText>{this.props.suffix}</InputGroupText>}
                    {!!this.props.suffix && typeof this.props.suffix !== "string" && this.props.suffix}
                </InputGroup>
                {!!this.props.hint && <FormText color="muted">
                    {this.props.hint}
                </FormText>}
            </FormGroup>
        );
    }
}