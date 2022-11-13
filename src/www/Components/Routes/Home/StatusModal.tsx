import { Modal, ModalBody, ModalHeader } from "reactstrap";

export function StatusModal(p: { header: string, status: string })
{
    return <Modal isOpen={!!p.status}>
        <ModalHeader>
            {p.header}
        </ModalHeader>
        <ModalBody>
            <div>{p.status}</div>
        </ModalBody>
    </Modal>
}