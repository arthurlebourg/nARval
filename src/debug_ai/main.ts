/*const runningMode = "IMAGE";

import { ImageSegmenter, FilesetResolver, ImageSegmenterResult } from "@mediapipe/tasks-vision";

const legendColors = [
    [255, 197, 0, 255], // Vivid Yellow
    [128, 62, 117, 255], // Strong Purple
    [255, 104, 0, 255], // Vivid Orange
    [166, 189, 215, 255], // Very Light Blue
    [193, 0, 32, 255], // Vivid Red
    [206, 162, 98, 255], // Grayish Yellow
    [129, 112, 102, 255], // Medium Gray
    [0, 125, 52, 255], // Vivid Green
    [246, 118, 142, 255], // Strong Purplish Pink
    [0, 83, 138, 255], // Strong Blue
    [255, 112, 92, 255], // Strong Yellowish Pink
    [83, 55, 112, 255], // Strong Violet
    [255, 142, 0, 255], // Vivid Orange Yellow
    [179, 40, 81, 255], // Strong Purplish Red
    [244, 200, 0, 255], // Vivid Greenish Yellow
    [127, 24, 13, 255], // Strong Reddish Brown
    [147, 170, 0, 255], // Vivid Yellowish Green
    [89, 51, 21, 255], // Deep Yellowish Brown
    [241, 58, 19, 255], // Vivid Reddish Orange
    [35, 44, 22, 255], // Dark Olive Green
    [0, 161, 194, 255] // Vivid Blue
  ];

async function createImageSegmenter() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "/resnet50_waterseg.tflite",
    },
    outputCategoryMask: true,
    outputConfidenceMasks: false,
    runningMode: runningMode
  });
  return imageSegmenter;
}

document.addEventListener("DOMContentLoaded", async () => {

    const canvasClick = document.createElement("canvas");
    document.body.appendChild(canvasClick);

    const imageSegmenter = await createImageSegmenter();

    const image = document.getElementById("image") as HTMLImageElement;
    imageSegmenter.segment(image, callback);

    function callback(result: ImageSegmenterResult) {
        if (!result || !result.categoryMask) {
            return;
        }
        const cxt = canvasClick.getContext("2d")!;
        const { width, height } = result.categoryMask;
        let imageData = cxt.getImageData(0, 0, width, height).data;
        canvasClick.width = width;
        canvasClick.height = height;
        const mask = result.categoryMask.getAsUint8Array();
        for (let i = 0; i < mask.length; ++i) {
        const legendColor = legendColors[mask[i] % legendColors.length];
        imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
        }
        const uint8Array = new Uint8ClampedArray(imageData.buffer);
        const dataNew = new ImageData(uint8Array, width, height);
        cxt.putImageData(dataNew, 0, 0);
    }
});*/

import '@tensorflow/tfjs-backend-webgl';

import {SemanticSegmentation, load} from '@tensorflow-models/deeplab';
import * as tf from '@tensorflow/tfjs-core';

let deeplab : SemanticSegmentation;

const initializeModels = async () => {
    const quantizationBytes = 4;
    deeplab = await load({base :'ade20k', quantizationBytes});
    await tf.nextFrame();
    await runDeeplab();
};

const displaySegmentationMap = (deeplabOutput : any) => {
 const {legend, height, width, segmentationMap} = deeplabOutput;
 const canvas = document.getElementById('output-image')! as HTMLCanvasElement;
 const ctx = canvas.getContext('2d')!;

 const segmentationMapData = new ImageData(segmentationMap, width, height);
 canvas.style.width = '100%';
 canvas.style.height = '100%';
 canvas.width = width;
 canvas.height = height;
 ctx.putImageData(segmentationMapData, 0, 0);

 const legendList = document.getElementById('legend')!;
 while (legendList.firstChild) {
   legendList.removeChild(legendList.firstChild);
 }

 Object.keys(legend).forEach((label) => {
   const tag = document.createElement('span');
   tag.innerHTML = label;
   const [red, green, blue] = legend[label];
   tag.classList.add('column');
   tag.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
   tag.style.padding = '1em';
   tag.style.margin = '1em';
   tag.style.color = '#ffffff';

   legendList.appendChild(tag);
 });

};

const status = (message : string) => {
 const statusMessage = document.getElementById('status-message')!;
 statusMessage.innerText = message;
 console.log(message);
};

const runPrediction = (input : any, initialisationStart : any) => {
   deeplab.segment(input).then((output) => {
     displaySegmentationMap(output);
     status(`Ran in ${
         ((performance.now() - initialisationStart) / 1000).toFixed(2)} s`);
   });
};

const runDeeplab = async () => {
 status(`Running the inference...`);

    const predictionStart = performance.now();
    const input = document.getElementById('image')! as HTMLImageElement;
    if (input.complete && input.naturalHeight !== 0) {
    runPrediction(input, predictionStart);
    } else {
    input.onload = () => {
        runPrediction(input, predictionStart);
    };
    }
};

window.onload = initializeModels;