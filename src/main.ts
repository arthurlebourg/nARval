import { PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three'
import './style.css'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'

function combineImages(baseImageData: ImageData, overlayImageData: ImageData | undefined): ImageData {
    if (!overlayImageData) {
        return baseImageData;
    }

    const combined_image = new Uint8ClampedArray(baseImageData.data.length);

    for (let i = 0; i < overlayImageData.data.length; i += 4) {
      // Get the RGB values of the overlay image
      const overlayR = overlayImageData.data[i];
      const overlayG = overlayImageData.data[i + 1];
      const overlayB = overlayImageData.data[i + 2];
      const overlayA = overlayImageData.data[i + 3];

      if (overlayA === 0) {
        // Set the result pixel values
        combined_image[i] = overlayR;
        combined_image[i + 1] = overlayG;
        combined_image[i + 2] = overlayB;
        combined_image[i + 3] = overlayA;
      }
      else
      {
        combined_image[i] = baseImageData.data[i];
        combined_image[i + 1] = baseImageData.data[i + 1];
        combined_image[i + 2] = baseImageData.data[i + 2];
        combined_image[i + 3] = baseImageData.data[i + 3];

      }
    }
    
    return new ImageData(combined_image, baseImageData.width, baseImageData.height);
}

document.addEventListener('DOMContentLoaded', () => {
    const renderer = new WebGLRenderer({ preserveDrawingBuffer: true, antialias: true })
    renderer.xr.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.border = '10px solid blue';
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

    let inference_result: ImageData;

    inference_worker.onmessage = (event) => {
        const { data } = event;
        take_picture = true;
        const imageData = data.segmentationMapData;
        inference_result_as_texture.image = imageData;
        inference_result_as_texture.needsUpdate = true;
        inference_result = imageData;
    }

    const debug_canvas = document.createElement('canvas');
    debug_canvas.style.border = '10px solid red';
    let debug_context = debug_canvas.getContext('2d')!;
    document.body.appendChild(debug_canvas);

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
                        take_picture = false;

                        offscreen_canvas.width = size[0];
                        offscreen_canvas.height = size[1];

                        offscreen_canvas_context.drawImage(renderer.domElement, 0, 0, size[0], size[1]);

                        const image_data = offscreen_canvas_context.getImageData(0, 0, size[0], size[1]);

                        // display the balanced image for debugging with an alert

                        if (inference_result) {
                            // combine the inference result with the camera image
                            const result_on_image = combineImages(image_data, inference_result);

                            debug_canvas.width = size[0];
                            debug_canvas.height = size[1];
                            debug_context = debug_canvas.getContext('2d')!;
                            debug_context.putImageData(result_on_image, 0, 0);
                        }

                        inference_worker.postMessage({ image: image_data });
                        renderer.setRenderTarget(render_target);
                    }
                }
                renderer.render(scene, camera)
            }
            renderer.setAnimationLoop(render);
        })
    })
})

