import { Clock, PerspectiveCamera, Texture, WebGLRenderer } from 'three'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'
import { AIModule } from './ai_module'
import * as tf from '@tensorflow/tfjs'

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.createElement('canvas');
    const renderer = new WebGLRenderer({ preserveDrawingBuffer: true, antialias: true, canvas: canvas})
    renderer.xr.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    canvas.style.border = '10px solid blue';
    document.body.appendChild(canvas);

    //const worker = new Worker(new URL('./inference.worker.ts', import.meta.url));

    const backend = new tf.MathBackendWebGL(renderer.domElement);
    tf.registerBackend('custom-webgl', () => backend);
    const scene = new MultiplayerScene();

    const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

    const button = ARButton.createButton(renderer, { requiredFeatures: ['camera-access'] })
    document.body.appendChild(button);

    const camera_feed_as_texture: Texture = new Texture();

    const clock = new Clock();

    const AIMod : AIModule = await AIModule.initializeModels();

    /*worker.postMessage({ type: "start", ai_module: AIMod });

    worker.onmessage = (event) => {
        const { data } = event;
        if (data.segmentationMapData) {
            console.log(data.segmentationMapData);
            take_picture = true;
        }
    }*/

    button.addEventListener('click', () => {
        CameraModule.make_camera_module(renderer).then((camera_module) => {
            const render = () => {
                if (!renderer.xr.getFrame()) {
                    return;
                }

                clock.getDelta();

                if (clock.elapsedTime > 1.0) {
                    const camera_info = camera_module.get_camera_image(camera_feed_as_texture);
                    if (camera_info) {
                        tf.engine().startScope();
                        // create tf WegGLData from camera_feed_as_texture
                        const segmentation : tf.WebGLData = { texture: camera_info[2], height: camera_info[1], width: camera_info[0], channels: "RGB"} 
                        //worker.postMessage({ type: "predict", webgldata: segmentation });
                        AIMod.predict(segmentation).then((segmentation) => {
                            console.log(segmentation);
                            tf.engine().endScope();
                            tf.engine().disposeVariables();
                        });
                    }
                    clock.start();
                }
                renderer.render(scene, camera)
            }
            renderer.setAnimationLoop(render);
        })
    })
})

