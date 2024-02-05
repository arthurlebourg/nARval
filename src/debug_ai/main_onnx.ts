// use ES6 style import syntax (recommended)
/*import * as ort from 'onnxruntime-web';

async function setupWebcam() : Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.width = 512;
    video.height = 512;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    document.body.appendChild(video);
    const stream = await navigator.mediaDevices.getUserMedia({ 'video': true });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function buildSession() {
    const session = await ort.InferenceSession.create('../TopFormer.onnx',{ executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    return session;
}

function scaleInputImage(inputImage: Uint8ClampedArray, width: number, height: number): Float32Array {
    const outputImage = new Float32Array(width * height * 3);
    const transforms = [[0.4914, 0.4822, 0.4465], [0.2023, 0.1994, 0.2010]];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;

            outputImage[i * 3] = ((inputImage[i * 4 + 0] / 255) - transforms[0][0]) / transforms[1][0];
            outputImage[i * 3 + 1] = ((inputImage[i * 4 + 1] / 255) - transforms[0][1]) / transforms[1][1];
            outputImage[i * 3 + 2] = ((inputImage[i * 4 + 2] / 255) - transforms[0][2]) / transforms[1][2];
        }
    }
    console.log("outputImage", outputImage);
    return outputImage;
}

// Function to find argmax along a specified axis
const argmax = (data: Uint8Array, shape: readonly number[], axis: number): Uint8Array => {
    if (axis < 0 || axis >= shape.length) {
        throw new Error('Invalid axis value');
    }

    const axisSize = shape[axis];
    const numElements = data.length;
    const numAxes = numElements / axisSize;

    if (numAxes % 1 !== 0) {
        throw new Error('Invalid array shape');
    }

    const result: number[] = [];

    for (let i = 0; i < numAxes; i++) {
        const startIndex = i * axisSize;
        const endIndex = startIndex + axisSize;

        let maxIndex = startIndex;
        let maxValue = data[startIndex];

        for (let j = startIndex + 1; j < endIndex; j++) {
            if (data[j] > maxValue) {
                maxIndex = j;
                maxValue = data[j];
            }
        }

        // Adjust the index based on the specified axis
        const adjustedIndex = maxIndex % axisSize;
        result.push(adjustedIndex);
    }

    return new Uint8Array(result);
};

async function inference(session: ort.InferenceSession, input: ImageData) {
    const { data, width, height } = input;
    const processed = scaleInputImage(data, width, height);
    const tensor = new ort.Tensor("float32", processed, [1, 3, width, height]);
    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0]] = tensor;
    const result = await session.run(feeds);
    console.log("result", result);
    const resdata = result.output.data as Uint8Array;
    console.log("resdata", resdata);
    return argmax(resdata, result.output.dims, 1);
}

const status = (message: string) => {
    const statusMessage = document.getElementById('status-message')!;
    statusMessage.innerText = message;
    console.log(message);
};

async function run() {
    status('Setting up webcam...');
    const video = await setupWebcam();
    status('Loading model...');
    const model = await buildSession();
    status('Model is ready');

    // Set up canvas for segmentation output
    const videocanvas = document.createElement('canvas');
    // add black lines around canvas in css
    videocanvas.width = video.width;
    videocanvas.height = video.height;
    videocanvas.style.border = '1px solid black';

    const resultcanvas = document.createElement('canvas');
    // add black lines around canvas in css
    resultcanvas.width = video.width;
    resultcanvas.height = video.height;
    resultcanvas.style.border = '1px solid black';

    document.body.appendChild(videocanvas);
    document.body.appendChild(resultcanvas);
    type Color = [number, number, number];
    const colorMap: Record<number, Color> = {
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

    // Run segmentation on each frame
    async function predict() {
        const videoctx = videocanvas.getContext("2d")!;
        const ctx = resultcanvas.getContext("2d")!;

        videoctx.drawImage(video, 0, 0, video.width, video.height);
        const frame = videoctx.getImageData(0, 0, video.width, video.height);
        const segmentation = await inference(model, frame);
        console.log("seg", segmentation);
        // Draw the segmentation output
        const imageData = ctx.createImageData(video.width, video.height);
        
        for (let i = 0; i < 4096; i++) {
        //https://docs.google.com/spreadsheets/d/1se8YEtb2detS7OuPE86fXGyD269pMycAWe2mtKUj2W8/edit#gid=0
            /*if (segmentation[i] === 22 || segmentation[i] === 27 || segmentation[i] === 61) {
                for (let j = 0; j < 8; j++) {
                    for (let k = 0; k < 8; k++) {
                        const idx = ((j + i * 8) * video.width + (k + i * 8)) * 4;
                        imageData.data[idx] = 0;
                        imageData.data[idx + 1] = 0;
                        imageData.data[idx + 2] = 255;
                        imageData.data[idx + 3] = 255;
                    }
                }
            }* /
            const c = colorMap[segmentation[i] - 1];
            if (c === undefined) {
                continue;
            }
            for (let j = 0; j < 8; j++) {
                for (let k = 0; k < 8; k++) {
                    const idx = ((j + (i/64) * 8) * video.width + (k + (i%64) * 8)) * 4;
                    //const idx = ((j + i * 8) * video.width + (k + i * 8)) * 4;
                    imageData.data[idx] = c[0];
                    imageData.data[idx + 1] = c[1];
                    imageData.data[idx + 2] = c[2];
                    imageData.data[idx + 3] = 255;
                }
            }

        }
        ctx.putImageData(imageData, 0, 0);

        requestAnimationFrame(predict);
    }

    predict();
}

run();*/