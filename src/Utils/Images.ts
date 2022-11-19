import { OnStatusChange } from "./StatusChanging";
import { Wait } from "./Wait";

export class Images
{
    public static async tryUploadPictureToDownsizedB64(maxDimension: number, maxLength: number, onStatusChange: OnStatusChange): Promise<string | null>
    {
        let result: string | null = null;
        const element = document.createElement("input");
        element.type = "file";
        element.style.display = "none";
        element.accept = "image/*";
        document.body.appendChild(element);
        element.click();
        await new Promise<void>(resolve => 
        {
            element.onchange = () => resolve();
        });

        if (element.files && element.files.length > 0)
        {
            const fileReader = new FileReader();
            const file = element.files[0];
            const promise = new Promise<void>(resolve => fileReader.onload = () => resolve());
            fileReader.readAsDataURL(file);
            await onStatusChange("Loading file...");
            await promise;
            let dataUrl = fileReader.result;


            if (typeof dataUrl === "string" && !!dataUrl)
            {
                const originalImg = document.createElement("img");
                const originalImgPromise = new Promise<void>(resolve => originalImg.onload = () => resolve());
                originalImg.src = dataUrl ?? "";
                await onStatusChange("Parsing image 1/2...");
                await originalImgPromise;
                const originalImage = new Image();
                const originalImagePromise = new Promise<void>(resolve => originalImage.onload = () => resolve());
                originalImage.src = dataUrl;
                await onStatusChange("Parsing image 2/2...");
                await originalImagePromise;

                let width = originalImage.width;
                let height = originalImage.height;

                if (width > maxDimension)
                {
                    const scale = maxDimension / width;
                    width *= scale;
                    height *= scale;
                }
                if (height > maxDimension)
                {
                    const scale = maxDimension / height;
                    width *= scale;
                    height *= scale;
                }

                while (dataUrl.length > maxLength)
                {
                    await onStatusChange(`Downsizing image to ${width}x${height}...`);
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext("2d");
                    if (!ctx) break;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high"
                    ctx.drawImage(originalImg, 0, 0, width, height);
                    dataUrl = canvas.toDataURL(file.type);
                    width *= 0.9;
                    height *= 0.9;
                }
                if (dataUrl.length < maxLength)
                {
                    result = dataUrl;
                }
            }
        }
        element.remove();
        return result;
    }
}