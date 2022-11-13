import { render } from "preact";
import { Wait } from "../Utils/Wait";
import { Root } from "./Components/Root";

async function run()
{
    await Wait.until(() => document.readyState !== "loading");
    render(<Root />, document.body);
}
run();