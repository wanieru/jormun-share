import { render } from "preact";
import { Hub } from "../Hub/Hub";
import { Wait } from "../Utils/Wait";
import { Root } from "./Components/Root";

async function run()
{
    await Wait.until(() => document.readyState !== "loading");
    $("title").text(Hub.appTitle);
    render(<Root />, document.body);
}
run();