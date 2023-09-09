import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three'
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
    // add a cube to the scene
    const geometry = new BoxGeometry(0.1, 0.1, 0.1);
    const material = new MeshBasicMaterial({ map: camera_feed_as_texture, color: 0xffff00 });
    const cube = new Mesh(geometry, material);
    cube.position.z = -0.5;
    scene.add(cube);

    const inference_result_as_texture: Texture = new Texture();
    scene.background = inference_result_as_texture;

    const empty_scene = new Scene();
    empty_scene.background = camera_feed_as_texture;

    const inference_worker = new Worker(new URL('./inference.worker.ts', import.meta.url));

    let take_picture = true;

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

                const size = camera_module.get_camera_image(camera_feed_as_texture);
                const render_target = renderer.getRenderTarget();
                renderer.setRenderTarget(null);
                renderer.render(empty_scene, camera);
                renderer.setRenderTarget(render_target);
                if (take_picture && size) {
                    take_picture = false;

                    createImageBitmap(renderer.domElement).then((image_bmp) => {
                        inference_worker.postMessage({ image: image_bmp, size: size });

                        renderer.setRenderTarget(render_target);
                    });
                }
                renderer.render(scene, camera)
            }
            renderer.setAnimationLoop(render);
        })
    })
})

