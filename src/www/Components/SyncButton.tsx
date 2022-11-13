import { NavLink } from "react-router-dom";
import { Hub } from "../../Hub/Hub";
import { Fas } from "./Utility/Icon";

export function SyncButton(p: { hub: Hub })
{
    if (!p.hub.jormun.getStatus().loggedIn) return <></>;
    return <a style={{ cursor: "pointer", minWidth: "170px" }} className="nav-link active" onClick={() => p.hub.jormun.sync()} >
        <SyncButtonContent hub={p.hub} />
    </a>;
}
function SyncButtonContent(p: { hub: Hub })
{
    const sync = p.hub.view.sync;
    if (p.hub.jormun.getStatus().syncing) return <span className="text-secondary"><Fas cloud /> <Fas spinner /></span>;
    if (sync.remoteNewer) return <span className="text-danger"><Fas cloud-arrow-down /> {sync.localVersion}</span>;
    if (sync.localDirty) return <span className="text-warning"><Fas cloud-arrow-up /> {sync.localVersion}</span>;
    return <span className="text-light"><Fas cloud /> {sync.localVersion}</span>;
}