import '@tensorflow/tfjs-backend-webgl';

import { SemanticSegmentation, load } from '@tensorflow-models/deeplab';
import * as tf from '@tensorflow/tfjs-core';
import { DeepLabOutput } from '@tensorflow-models/deeplab/dist/types';

export class AIModule {
    private _deeplab: SemanticSegmentation;

    private constructor(deepLab: SemanticSegmentation) {
        this._deeplab = deepLab;
    }

    public static async initializeModels() {
        const quantizationBytes = 4;
        const deeplab = await load({ base: 'ade20k', quantizationBytes });
        const ai_module = new AIModule(deeplab);
        await tf.nextFrame();
        return ai_module;
    };

    private async displaySegmentationMap(deeplabOutput: DeepLabOutput, initialisationStart: any) {
        const { height, width, segmentationMap } = deeplabOutput;
        const canvas = document.getElementById('output-image')! as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;

        // Assuming you have the RGB values of the classes you want to filter out
        const classColor1: [number, number, number] = [61, 230, 250]; // First class color to filter (e.g., red)
        const classColor2: [number, number, number] = [9, 7, 230]; // Second class color to filter (e.g., green)

        // Filter out the two specified classes by comparing RGB values
        const filteredImage = new Uint8ClampedArray(segmentationMap.length);

        // get image as array also
        const image = document.getElementById('image')! as HTMLImageElement;

        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = width;
        imageCanvas.height = height;
        const imageCtx = imageCanvas.getContext('2d')!;
        imageCtx.drawImage(image, 0, 0, width, height);
        const imageData = imageCtx.getImageData(0, 0, width, height);

        const imageArray = imageData.data;

        for (let i = 0; i < segmentationMap.length; i += 4) {
            const r = segmentationMap[i];
            const g = segmentationMap[i + 1];
            const b = segmentationMap[i + 2];

            if (
                (r === classColor1[0] && g === classColor1[1] && b === classColor1[2]) ||
                (r === classColor2[0] && g === classColor2[1] && b === classColor2[2])
            ) {
                // Copy the RGB values to the filtered image array
                filteredImage[i] = 61;
                filteredImage[i + 1] = 230;
                filteredImage[i + 2] = 250;
                filteredImage[i + 3] = segmentationMap[i + 3]; // Copy the alpha value
            }
            else {
                // Copy the RGB values to the filtered image array
                filteredImage[i] = imageArray[i];
                filteredImage[i + 1] = imageArray[i + 1];
                filteredImage[i + 2] = imageArray[i + 2];
                filteredImage[i + 3] = imageArray[i + 3]; // Copy the alpha value
            }
        }

        const segmentationMapData = new ImageData(filteredImage, width, height);
        //const segmentationMapData = new ImageData(segmentationMap, width, height);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = width;
        canvas.height = height;

        ctx.putImageData(segmentationMapData, 0, 0);

        const legendList = document.getElementById('legend')!;
        while (legendList.firstChild) {
            legendList.removeChild(legendList.firstChild);
        }

        console.log(`Ran in ${((performance.now() - initialisationStart) / 1000).toFixed(2)} s`);
    };

    public async runDeeplab() {
        console.log(`Running the inference...`);

        const predictionStart = performance.now();
        const input = document.getElementById('image')! as HTMLImageElement; // TODO: Change this to the input canvas aka the image
        if (input.complete && input.naturalHeight !== 0) {
            this._deeplab.segment(input).then((output) => {
                this.displaySegmentationMap(output, predictionStart);
            });
        } else {
            input.onload = () => {
                this._deeplab.segment(input).then((output) => {
                    this.displaySegmentationMap(output, predictionStart);
                });
            };
        }
    };

}