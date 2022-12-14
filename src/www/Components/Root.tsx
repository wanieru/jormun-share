import { Attributes, Component, ComponentChild, ComponentChildren, Ref } from "preact"
import { HashRouter, Navigate, Route, Router, Routes } from "react-router-dom";
import { Hub } from "../../Hub/Hub";
import { View } from "../View/View";
import { Question, Toasts } from "./Alerts";
import { NavBar } from "./NavBar";
import { HomeRoute } from "./Routes/HomeRoute";
import { ImagesRoute } from "./Routes/ImagesRoute";
import { JoinRoute } from "./Routes/JoinRoute";
import { RoomRoute, RoomRouteRoot } from "./Routes/RoomRoute";
import { ServerRoute } from "./Routes/ServerRoute";
import { ComponentAsync } from "./Utility/ComponentAsync";
import { Fas } from "./Utility/Icon";

export class Root extends ComponentAsync<{}, View>
{
    public state = new View();
    public hub = new Hub([s => this.setStateAsync(s)]);
    renderer(p: {}, s: View): ComponentChild
    {
        const navigateTarget = this.hub.navigation.popTarget();
        if (!this.hub.jormun.getStatus().initialized) return <h1 className="text-center mt-5"><LoadAnimation animation={s.root.loadAnimation} /> Loading...</h1>
        return <>
            <HashRouter>
                {navigateTarget && <Navigate to={navigateTarget} />}
                <NavBar hub={this.hub} />
                <div class="container pt-3 pb-3">
                    <Routes>
                        <Route path="/" element={<HomeRoute hub={this.hub} />} />
                        <Route path="/server" element={<ServerRoute hub={this.hub} />} />
                        <Route path="/join/:host/:userId/:roomId" element={<JoinRoute hub={this.hub} />} />
                        <Route path="/room/:host/:userId/:roomId" element={<RoomRouteRoot hub={this.hub} />} />
                        <Route path="/images" element={<ImagesRoute hub={this.hub} />} />
                    </Routes>
                </div>
                <Toasts hub={this.hub} />
                <Question hub={this.hub} />
            </HashRouter>
        </>;
    }
}

function LoadAnimation(p: { animation: number })
{
    return <Fas receipt />;
}