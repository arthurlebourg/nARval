import * as tf from '@tensorflow/tfjs';

const colorMap: Record<number, [number, number, number]> = {
    0: [120,120,120],
    1: [120,120,180],
    2: [230,230,6],
    3: [50,50,80],
    4: [3,200,4],
    5: [80,120,120],
    6: [140,140,140],
    7: [255,5,204],
    8: [230,230,230],
    9: [7,250,4],
    10: [255,5,224],
    11: [7,255,235],
    12: [61,5,150],
    13: [70,120,120],
    14: [51,255,8],
    15: [82,6,255],
    16: [140,255,143],
    17: [4,255,204],
    18: [7,51,255],
    19: [3,70,204],
    20: [200,102,0],
    21: [250,230,61],
    22: [51,6,255],
    23: [255,102,11],
    24: [71,7,255],
    25: [224,9,255],
    26: [230,7,9],
    27: [220,220,220],
    28: [92,9,255],
    29: [255,9,112],
    30: [214,255,8],
    31: [224,255,7],
    32: [6,184,255],
    33: [71,255,10],
    34: [10,41,255],
    35: [255,255,7],
    36: [8,255,224],
    37: [255,8,102],
    38: [6,61,255],
    39: [7,194,255],
    40: [8, 122, 255],
    41: [20, 255, 0],
    42: [41, 8, 255],
    43: [153, 5, 255],
    44: [255, 51, 6],
    45: [255, 12, 235],
    46: [20, 150, 160],
    47: [255, 163, 0],
    48: [140, 140, 140],
    49: [15, 10, 250],
    50: [0, 255, 20],
    51: [0, 255, 31],
    52: [0, 31, 255],
    53: [0, 224, 255],
    54: [0, 255, 153],
    55: [255, 0, 0],
    56: [0, 71, 255],
    57: [255, 235, 0],
    58: [255, 173, 0],
    59: [255, 0, 31],
    60: [200, 200, 11],
    61: [0, 82, 255],
    62: [245, 255, 0],
    63: [255, 61, 0],
    64: [112, 255, 0],
    65: [133, 255, 0],
    66: [0, 0, 255],
    67: [0, 163, 255],
    68: [0, 102, 255],
    69: [0, 255, 194],
    70: [255, 143, 0],
    71: [0, 255, 51],
    72: [255, 82, 0],
    73: [41, 255, 0],
    74: [173, 255, 0],
    75: [255, 0, 10],
    76: [0, 255, 173],
    77: [153, 255, 0],
    78: [0, 92, 255],
    79: [255, 0, 255],
    80: [245, 0, 255],
    81: [102, 0, 255],
    82: [0, 173, 255],
    83: [20, 0, 255],
    84: [184, 184, 255],
    85: [255, 31, 0],
    86: [61, 255, 0],
    87: [255, 71, 0],
    88: [204, 0, 255],
    89: [194, 255, 0],
    90: [82, 255, 0],
    91: [255, 10, 0],
    92: [255, 112, 0],
    93: [255, 0, 51],
    94: [255, 194, 0],
    95: [255, 122, 0],
    96: [163, 255, 0],
    97: [0, 153, 255],
    98: [10, 255, 0],
    99: [0, 112, 255],
    100: [0, 255, 143],
    101: [255, 0, 82],
    102: [0, 255, 163],
    103: [0, 235, 255],
    104: [170, 184, 8],
    105: [255, 0, 133],
    106: [92, 255, 0],
    107: [255, 0, 184],
    108: [31, 0, 255],
    109: [255, 184, 0],
    110: [255, 214, 0],
    111: [112, 0, 255],
    112: [0, 255, 92],
    113: [255, 224, 0],
    114: [255, 224, 112],
    115: [160, 184, 70],
    116: [255, 0, 163],
    117: [255, 0, 153],
    118: [0, 255, 71],
    119: [163, 0, 255],
    120: [0, 204, 255],
    121: [143, 0, 255],
    122: [235, 255, 0],
    123: [0, 255, 133],
    124: [235, 0, 255],
    125: [255, 0, 245],
    126: [122, 0, 255],
    127: [0, 245, 255],
    128: [212, 190, 10],
    129: [0, 255, 214],
    130: [255, 204, 0],
    131: [255, 0, 20],
    132: [0, 255, 255],
    133: [255, 153, 0],
    134: [255, 41, 0],
    135: [204, 255, 0],
    136: [255, 0, 41],
    137: [0, 255, 41],
    138: [255, 0, 173],
    139: [255, 245, 0],
    140: [255, 0, 71],
    141: [255, 0, 122],
    142: [184, 255, 0],
    143: [255, 92, 0],
    144: [0, 255, 184],
    145: [255, 133, 0],
    146: [0, 214, 255],
    147: [194, 194, 25],
    148: [0, 255, 102],
    149: [255, 0, 92],
};

const status = (message: string) => {
    const statusMessage = document.getElementById('status-message')!;
    statusMessage.innerText = message;
    console.log(message);
};

async function setupWebcam() : Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.width = 512;
    video.height = 512;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    document.body.appendChild(video);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 512, height: 512 } });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

function preprocess(input: tf.Tensor3D): tf.Tensor {
    const resized = tf.image.resizeBilinear(input, [512, 512]).cast('int32') as tf.Tensor3D;
    const inputImgFloat = resized.toFloat().div(255.0);
    // Scale input pixel values to -1 to 1

    /*const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    const inputImgNormalizedsub = inputImgFloat.sub(mean);

    console.log("sub mean:");
    inputImgNormalizedsub.print();

    const inputImgNormalized = inputImgNormalizedsub.div(std);
    console.log("div std:");
    inputImgNormalized.print();*/

    const inputImgNormalized = inputImgFloat.sub(0.5).div(0.5);
    //inputImgNormalized.print();
    const inputTensor = inputImgNormalized.transpose([2, 0, 1]).expandDims();
    //inputTensor.print();
    return inputTensor;
}

function postprocess(output: tf.Tensor): tf.Tensor {
    //return tf.argMax(output.squeeze(), 2); 
    return output.argMax(1).squeeze();
}

async function utilDrawSeg(segMap : tf.Tensor, video : HTMLVideoElement | HTMLImageElement, canvas : HTMLCanvasElement) {
    const imgHeight = video.height;
    const imgWidth = video.width;
  
    // Reshape to 3D tensor, resize, and reshape back to 2D tensor
    const reshapedTensor = segMap.reshape([1, segMap.shape[0], segMap.shape[1]!, 1]) as tf.Tensor3D;
    const resizedTensor3D = tf.image.resizeBilinear(reshapedTensor, [imgHeight, imgWidth]);
    const resizedTensor2D = (resizedTensor3D.squeeze() as tf.Tensor2D).cast("int32");  // Remove singleton dimensions

    // Create an empty tensor with the same shape as the input, but with an additional channel for color
    const colorMapTensor = tf.tensor(Object.values(colorMap), [Object.keys(colorMap).length, 3], 'int32');
    // Use tf.gather to replace class indices with colors
    const colorTensor = tf.gather(colorMapTensor, resizedTensor2D) as tf.Tensor3D;
    tf.browser.toPixels(colorTensor, canvas);
  
    return canvas;
  }

async function run() {
    status('Setting up webcam...');
    //const video = await setupWebcam();

    // put image "https://upload.wikimedia.org/wikipedia/az/6/6d/Abbey_Road_%28albom%29.jpg"

    const video = document.createElement('img');
    video.src = "./Abbey_Road_(albom).jpg";
    document.body.appendChild(video);
    await video.decode();
    status('Loading model...');
    const model = await tf.loadGraphModel('../TopFormer.tfjs/model.json');
    status('Model is ready');

    // Set up canvas for segmentation output
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    // Run segmentation on each frame
    async function predict() {
        const tensor = tf.browser.fromPixels(video);
        const preprocessed = preprocess(tensor);
        tensor.dispose();
        //preprocessed.print();
        const segmentation = await model.executeAsync({ input: preprocessed }) as tf.Tensor;
        segmentation.print();
        preprocessed.dispose();
        const seg = postprocess(segmentation) as tf.Tensor3D;
        console.log("seg:");
        seg.print();
        // Display the segmentation on the canvas
        utilDrawSeg(seg, video, canvas);
        //requestAnimationFrame(predict);
    }

    predict();
}

run();