import { Component, ComponentChild, RenderableProps } from "preact";
import { Alert, Button, Container, Modal, ModalBody, ModalFooter, ModalHeader, Toast, ToastBody, ToastHeader } from "reactstrap";
import { Hub } from "../../Hub/Hub";

export function Toasts(p: { hub: Hub })
{
    return <Container style={{ position: "absolute", bottom: "70px", left: 0, right: 0 }}>{
        p.hub.view.alerts.toasts.map((t, idx) =>
            <Toast className="mx-auto mb-3" isOpen={true} key={idx}>
                <ToastHeader toggle={() => p.hub.alert.resolveToast(t.content)}>{t.timeStr}</ToastHeader>
                <ToastBody>
                    <strong>{t.content.title}</strong>
                    {t.content.title && t.content.message ? ": " : ""}
                    {t.content.message}
                </ToastBody>
            </Toast>)
    }
    </Container>;
}
export function Question(p: { hub: Hub })
{
    if (p.hub.view.alerts.questions.length < 1)
        return <></>;
    const question = p.hub.view.alerts.questions[0];
    return <>
        <Modal isOpen={true}>
            <ModalHeader style={{ whiteSpace: "pre-wrap" }}>{question.content.title}</ModalHeader>
            <ModalBody style={{ whiteSpace: "pre-wrap" }}>{question.content.message}</ModalBody>
            <ModalFooter>
                {question.content.options.map((c, i) => <Button key={i} color="primary" onClick={() => p.hub.alert.resolveQuestion(question.content, i)}>{c}</Button>)}
            </ModalFooter>
        </Modal>
    </>;
}