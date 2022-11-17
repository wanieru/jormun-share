import { Key } from "jormun-sdk/dist/Key";
import { ComponentChild } from "preact";
import { Component } from "preact/compat";
import { Navigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader } from "reactstrap";
import { RoomDirectory } from "../../../Data/RoomDirectory";
import { Hub } from "../../../Hub/Hub";
import { Numbers } from "../../../Utils/Numbers";
import { B64URL } from "../Utility/B64URL";
import { Fas } from "../Utility/Icon";
import { StatusModal } from "./Home/StatusModal";

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

export class ImagesRoute extends Component<ImagesRouteProps, ImagesRouteState>
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
        this.setState({ directory: null, images: [] });
        const directory = await this.props.hub.localRoomController.getDirectory();
        this.setState({ directory: directory });
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
            this.setState({ images: this.state.images });
        }
    }
    public render(p: ImagesRouteProps, s: ImagesRouteState): ComponentChild
    {
        if (!p.hub.jormun.getStatus().loggedIn) return <Navigate to="/" />;
        if (!s.directory) return <>Loading...</>;
        if (s.images.length < 1) return <div style={{ textAlign: "center" }}><b>No images uploaded!</b></div>
        return <div style={{ paddingBottom: "200px" }}>
            {s.images.map((image, idx) => <div key={image.fragment}>
                <Card style={{ marginBottom: "10px" }}>
                    <CardHeader><div style={{ float: "right" }}>
                        <Button onClick={() => this.delete(image.fragment)}><Fas trash /></Button>
                    </div>
                        {image.title}</CardHeader>
                    <CardBody><img style={{ maxWidth: "100px", maxHeight: "100px", cursor: "zoom-in" }} src={image.data} onClick={() => this.setState({ previewImage: image.data })} /></CardBody>
                </Card>

            </div>)}
            <StatusModal header="" status={s.previewImage ? <>
                <img src={s.previewImage} style={{ width: "100%" }} />
            </> : ""} close={() => this.setState({ previewImage: "" })} />
            <StatusModal header="Deleting..." status={s.deleteStatus} />
        </div>;
    }
    private delete = async (fragment: string) =>
    {
        const data = this.props.hub.jormun.me(fragment);
        if (!data) return;
        if (await this.props.hub.jormun.ask("Delete image?", "Do you want to delete this image? It will become unavailable in the room it was posted...", ["Yes", "No"]) !== 0) return;
        this.setState({ deleteStatus: "Deleting..." });
        await data.remove();
        this.setState({ deleteStatus: "Fetching directory..." });
        const directory = await this.props.hub.localRoomController.getDirectory();
        if (directory.submittedImageFragments)
        {
            directory.submittedImageFragments = directory.submittedImageFragments.filter(f => f !== fragment);
        }
        this.setState({ deleteStatus: "Setting directory..." });
        await this.props.hub.localRoomController.setDirectory(directory, false);
        this.setState({ deleteStatus: "Synchronizing..." });
        await this.props.hub.jormun.sync();
        this.setState({ deleteStatus: "Refetching..." });
        await this.fetchData();
        this.setState({ deleteStatus: "" });
    };
}
