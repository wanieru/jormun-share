export class Downloader
{
    public static download(str: string, filename: string)
    {
        const element = document.createElement("a");
        element.download = filename;
        document.body.appendChild(element);
        element.href = "data:text/plain," + encodeURIComponent(str);
        element.style.display = "none";
        element.click();
        document.body.removeChild(element);
    }
    public static async import(extension: string)
    {
        const element = document.createElement("input");
        element.type = "file";
        element.style.display = "none";
        element.accept = extension;
        document.body.appendChild(element);
        element.click();
        const promise = new Promise<string>(resolve => 
        {
            element.onchange = () => 
            {
                if (element.files)
                {
                    const selected = element.files[0];
                    let reader = new FileReader();
                    reader.addEventListener("loadend", () => 
                    {
                        if (typeof reader.result == "string")
                            resolve(reader.result);
                    });
                    reader.readAsText(selected);
                }
            }
        });
        return promise;
    }
}