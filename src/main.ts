import { PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three'
import './style.css'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'

document.addEventListener('DOMContentLoaded', () => {
    const renderer = new WebGLRenderer({ preserveDrawingBuffer: true, antialias: true })
    renderer.xr.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.border = '10px solid black';
    document.body.appendChild(renderer.domElement);

    const scene = new MultiplayerScene();

    const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

    const button = ARButton.createButton(renderer, { requiredFeatures: ['camera-access'] })
    document.body.appendChild(button);

    const camera_feed_as_texture: Texture = new Texture();

    const inference_result_as_texture: Texture = new Texture();
    scene.background = inference_result_as_texture;

    const empty_scene = new Scene();
    empty_scene.background = camera_feed_as_texture;

    const inference_worker = new Worker(new URL('./inference.worker.ts', import.meta.url));

    let take_picture = true;

    const offscreen_canvas = new OffscreenCanvas(0, 0);
    const offscreen_canvas_context = offscreen_canvas.getContext('2d', { willReadFrequently: true })!;

    inference_worker.onmessage = (event) => {
        const { data } = event;
        take_picture = true;
        const imageData = data.segmentationMapData;
        inference_result_as_texture.image = imageData;
        inference_result_as_texture.needsUpdate = true;
    }

    button.addEventListener('click', () => {
        inference_worker.postMessage({ type: "start" });
        CameraModule.make_camera_module(renderer).then((camera_module) => {
            const render = () => {
                if (!renderer.xr.getFrame()) {
                    return;
                }

                if (take_picture) {
                    const size = camera_module.get_camera_image(camera_feed_as_texture);
                    if (size) {
                        const render_target = renderer.getRenderTarget();
                        renderer.setRenderTarget(null);
                        renderer.render(empty_scene, camera);
                        renderer.setRenderTarget(render_target);
                        take_picture = false;

                        offscreen_canvas.width = size[0];
                        offscreen_canvas.height = size[1];

                        offscreen_canvas_context.drawImage(renderer.domElement, 0, 0, size[0], size[1]);

                        const image_data = offscreen_canvas_context.getImageData(0, 0, size[0], size[1]);
                        inference_worker.postMessage({ image: image_data });
                    }
                }
                renderer.render(scene, camera)
            }
            renderer.setAnimationLoop(render);
        })
    })
})

