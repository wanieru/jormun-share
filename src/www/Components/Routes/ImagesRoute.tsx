import { Key } from "jormun-sdk/dist/Key";
import { ComponentChild, JSX } from "preact";
import { Component } from "preact/compat";
import { Navigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader } from "reactstrap";
import { RoomDirectory } from "../../../Data/RoomDirectory";
import { Hub } from "../../../Hub/Hub";
import { Numbers } from "../../../Utils/Numbers";
import { B64URL } from "../Utility/B64URL";
import { ComponentAsync } from "../Utility/ComponentAsync";
import { Fas } from "../Utility/Icon";
import { StatusModal } from "../Utility/StatusModal";

export interface ImagesRouteProps
{
    hub: Hub
}
export class ImagesRouteState
{
    directory: RoomDirectory | null = null
    previewImage = ""
    deleteStatus = ""
    images: { fragment: string, data: string, title: string }[] = []
}

export class ImagesRoute extends ComponentAsync<ImagesRouteProps, ImagesRouteState>
{
    public state = new ImagesRouteState();

    public componentDidMount()
    {
        this.fetchData();
    }
    public componentWillUnmount()
    {
    }
    private async fetchData()
    {
        await this.setStateAsync({ directory: null, images: [] });
        const directory = await this.props.hub.localRoomController.getDirectory();
        await this.setStateAsync({ directory: directory });
        for (const fragment of directory.submittedImageFragments ?? [])
        {
            const data = this.props.hub.jormun.me(fragment);
            if (!data) continue;
            const image = await data.get();
            const raw = await data.getRaw();
            if (!image) continue;
            const bytes = (image as string).length;
            const kb = bytes / 1000;
            this.state.images.push({ fragment: fragment, data: image, title: `${new Date(raw?.timestamp ?? 0).toLocaleString()} - ${Numbers.round(kb, 0).toLocaleString("en-US")} kb` });
            await this.setStateAsync({ images: this.state.images });
        }
    }
    public renderer(p: ImagesRouteProps, s: ImagesRouteState): ComponentChild
    {
        if (!p.hub.jormun.getStatus().loggedIn) return <Navigate to="/" />;
        if (!s.directory) return <>Loading...</>;
        if (s.images.length < 1) return <div style={{ textAlign: "center" }}><b>No images uploaded!</b></div>
        return <div style={{ paddingBottom: "200px" }}>
            {s.images.map((image, idx) => <div key={image.fragment}>
                <Card style={{ marginBottom: "10px", cursor: "zoom-in" }} onClick={() => this.setStateAsync({ previewImage: image.data })}>
                    <CardHeader><div style={{ float: "right" }}>
                        <Button onClick={(e: JSX.TargetedMouseEvent<HTMLElement>) => { this.delete(image.fragment); e.stopPropagation(); e.preventDefault() }}><Fas trash /></Button>
                    </div>
                        {image.title}</CardHeader>
                    <CardBody><img style={{ maxWidth: "100px", maxHeight: "100px" }} src={image.data} /></CardBody>
                </Card>

            </div>)}
            <StatusModal header="" status={s.previewImage ? <>
                <img src={s.previewImage} style={{ width: "100%" }} />
            </> : ""} close={() => this.setStateAsync({ previewImage: "" })} />
            <StatusModal header="Deleting..." status={s.deleteStatus} />
        </div>;
    }
    private delete = async (fragment: string) =>
    {
        const data = this.props.hub.jormun.me(fragment);
        if (!data) return;
        if (await this.props.hub.jormun.ask("Delete image?", "Do you want to delete this image? It will become unavailable in the room it was posted...", ["Yes", "No"]) !== 0) return;
        await this.setStateAsync({ deleteStatus: "Deleting..." });
        await data.remove();
        await this.setStateAsync({ deleteStatus: "Fetching directory..." });
        const directory = await this.props.hub.localRoomController.getDirectory();
        if (directory.submittedImageFragments)
        {
            directory.submittedImageFragments = directory.submittedImageFragments.filter(f => f !== fragment);
        }
        await this.setStateAsync({ deleteStatus: "Setting directory..." });
        await this.props.hub.localRoomController.setDirectory(directory, false);
        await this.setStateAsync({ deleteStatus: "Synchronizing..." });
        await this.props.hub.jormun.sync();
        await this.setStateAsync({ deleteStatus: "Refetching..." });
        await this.fetchData();
        await this.setStateAsync({ deleteStatus: "" });
    };
}
