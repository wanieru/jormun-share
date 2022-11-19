import { JSX } from "preact/jsx-runtime";
import { Modal, ModalBody, ModalHeader } from "reactstrap";

export function StatusModal(p: { header: string, status: string | JSX.Element, close?: () => void })
{
    if (!document.body.classList.contains("modal-open") && document.body.style.overflow == "hidden") document.body.style.overflow = "";
    return <Modal isOpen={!!p.status} toggle={p.close ? () => { p.close && p.close() } : undefined}>
        <ModalHeader toggle={p.close ? () => { p.close && p.close() } : undefined}>
            {p.header}
        </ModalHeader>
        <ModalBody>
            <div>{p.status}</div>
        </ModalBody>
    </Modal>
}