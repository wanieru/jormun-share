import { Key } from "jormun-sdk/dist/Key";
import { Navigate, useParams } from "react-router-dom";
import { Hub } from "../../../Hub/Hub";
import { B64URL } from "../Utility/B64URL";

export function JoinRoute(p: { hub: Hub })
{
    const params = useParams();
    const hostb64 = params.host;
    const roomId = params.roomId;
    const userId = params.userId;
    if (!!hostb64 && !!roomId && !!userId)
    {
        let host = B64URL.FromBase64(hostb64);
        if (!host) return <></>;
        if (!host.startsWith("http")) host = `https://${host}`;
        const rootKey = new Key(Hub.app, parseInt(userId), `room_${roomId}`);
        p.hub.remoteRoomController.joinRoom(host, rootKey.stringifyRemote(-1), s => { });
    }
    return <><Navigate to="/" /></>;
}