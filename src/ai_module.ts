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

    private async displaySegmentationMap(deeplabOutput: DeepLabOutput, initialisationStart: number) {
        const { height, width, segmentationMap } = deeplabOutput;

        // Assuming you have the RGB values of the classes you want to filter out
        const classColor1: [number, number, number] = [61, 230, 250]; // First class color to filter (e.g., red)
        const classColor2: [number, number, number] = [9, 7, 230]; // Second class color to filter (e.g., green)

        // Filter out the two specified classes by comparing RGB values
        const filteredImage = new Uint8ClampedArray(segmentationMap.length);

        let n = 0;

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
                n++;
            }
            else {
                // Copy the RGB values to the filtered image array
                filteredImage[i] = 0;
                filteredImage[i + 1] = 0;
                filteredImage[i + 2] = 0;
                filteredImage[i + 3] = 0;
            }
        }

        const segmentationMapData = new ImageData(filteredImage, width, height);

        console.log(`Ran in ${((performance.now() - initialisationStart) / 1000).toFixed(2)} s. ${n} pixels got positive.`);
        return segmentationMapData;
    };

    public async runDeeplab(image: ImageData) {
        console.log(`Running the inference...`);
        const predictionStart = performance.now();

        return this._deeplab.segment(image).then((output) => {
            return this.displaySegmentationMap(output, predictionStart);
        });
    };

}