import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { BridgeAsync } from '../Utility/BridgeAsync';
import { JSXInternal } from "preact/src/jsx";

export interface ContextOption { title: string | JSXInternal.Element, onClick: () => void }
export interface ContextProps 
{
    title: string | JSXInternal.Element,
    options: ContextOption[]
}
export class ContextBridge
{
    open = false
}
export class ContextState 
{

}

export class Context extends BridgeAsync<ContextProps, ContextState, ContextBridge>
{
    public state = new ContextState();
    public rendering = () => 
    {
        return <>
            <Modal isOpen={this.bridge.open} toggle={() => this.setBridge({ open: false })}>
                <ModalHeader>{this.props.title}</ModalHeader>
                <ModalBody>
                    <div>
                        {this.props.options.map((o, i) => <Button style={{ width: "100%" }} className="mb-3" block key={i} color="primary" onClick={() => { this.setBridge({ open: false }); o.onClick(); }}>{o.title}</Button>)}
                    </div>
                </ModalBody>
            </Modal>
        </>;
    }
}