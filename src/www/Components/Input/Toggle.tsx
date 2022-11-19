import React from "react";
import { FormGroup, Input, Label } from "reactstrap";
import { BridgeAsync } from '../Utility/BridgeAsync';
import { JSXInternal } from 'preact/src/jsx';

export interface ToggleProps 
{
    label: string | JSXInternal.Element;
}
export class ToggleBridge
{
    checked = false;
}
export class ToggleState 
{

}

export class Toggle extends BridgeAsync<ToggleProps, ToggleState, ToggleBridge>
{
    public rendering = () => 
    {
        return (
            <FormGroup check className="mb-3">
                <Label check>
                    <Input checked={this.bridge.checked} onChange={(e: any) => this.setBridge({ checked: e.target.checked })} type="checkbox" />{' '}
                    {this.props.label}
                </Label>
            </FormGroup>
        );
    }
}