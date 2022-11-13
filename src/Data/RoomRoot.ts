import { RoomUser } from "./RoomUser";
import { UserId } from "./UserId";

export interface RoomRoot
{
    name: string;
    roomId: string;
    users: Record<UserId, RoomUser>;
    guestToken: string;
    guestTokenId: string;
}
