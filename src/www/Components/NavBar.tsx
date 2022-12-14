import { Component, ComponentChild, RenderableProps } from "preact";
import { Link, NavLink, useMatch, useRoutes } from "react-router-dom";
import { Collapse, Container, Nav, Navbar, NavbarBrand, NavbarToggler } from "reactstrap";
import { Hub } from "../../Hub/Hub";
import { SyncButton } from "./SyncButton";
import { BootstrapSizes, BootstrapUtils } from "./Utility/BootstrapUtils";
import { ComponentAsync } from "./Utility/ComponentAsync";
import { Fas } from "./Utility/Icon";

export interface NavBarProps
{
    hub: Hub
}
export class NavBarState
{
    open = false;
}

export class NavBar extends ComponentAsync<NavBarProps, NavBarState>
{
    state = new NavBarState();
    private toggleOpen = async () =>
    {
        await this.setStateAsync({ open: !this.state.open });
    }
    renderer(p: NavBarProps, s: NavBarState): ComponentChild
    {
        return <>
            <Navbar fixed="bottom" container="sm" color="primary" dark expand="lg">
                <Link className="navbar-brand" to={`/`}><Fas money-bill-transfer /> {Hub.appTitle}</Link>
                <span className="d-lg-none"><SyncButton hub={p.hub} /></span>
                <NavbarToggler onClick={() => this.toggleOpen()} />
                <Collapse isOpen={this.state.open} navbar>
                    <Nav className="me-auto" navbar>
                        <NavLink className="nav-link" activeClassName="active" to={`/`}><Fas house /> Home</NavLink>
                    </Nav>
                    <Nav navbar>
                        <li className="nav-item d-lg-inline-block d-none"><SyncButton hub={p.hub} /></li>
                        {p.hub.jormun.getStatus().loggedIn && <NavLink className="nav-link" activeClassName="active" to={`/images`}><Fas image /> Images</NavLink>}
                        <NavLink className="nav-link" activeClassName="active" to={`/server`}><Fas plug /> Server</NavLink>
                    </Nav>
                </Collapse>
            </Navbar>
        </>
    }
}
