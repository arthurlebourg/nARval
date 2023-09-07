import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three'
import './style.css'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'

document.addEventListener('DOMContentLoaded', () => {
    const renderer = new WebGLRenderer({ antialias: true })
    renderer.xr.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    //document.body.appendChild(renderer.domElement)

    const scene = new MultiplayerScene();
    // add a cube to the scene
    const geometry = new BoxGeometry(0.1, 0.1, 0.1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    cube.position.z = -0.5;
    scene.add(cube);
    const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

    const button = ARButton.createButton(renderer, { requiredFeatures: ['hit-test', 'camera-access'] })
    document.body.appendChild(button);

    const texture: Texture = new Texture();

    const empty_scene = new Scene();
    empty_scene.background = texture;
    const empty_renderer = new WebGLRenderer({ preserveDrawingBuffer: true });

    const inference_worker = new Worker(new URL('./inference.worker.ts', import.meta.url));

    let init = false;

    button.addEventListener('click', () => {
        inference_worker.postMessage({ type: "start" });
        CameraModule.make_camera_module(renderer).then((camera_module) => {
            const render = () => {
                if (!renderer.xr.getFrame()) {
                    return;
                }

                inference_worker.onmessage = (event) => {
                    const { data } = event;
                    console.log("received results:", data);
                    const size = camera_module.get_camera_image(texture);
                    if (size) {
                        camera.aspect = size[0] / size[1];
                        camera.updateProjectionMatrix();
                        empty_renderer.setSize(size[0], size[1]);
                        empty_renderer.render(empty_scene, camera);
                        createImageBitmap(empty_renderer.domElement).then((image_bmp) => {
                            console.log("sending image");
                            inference_worker.postMessage({ image: image_bmp, size: size });
                        });
                        cube.material.map = texture;
                    }
                }

                if (!init) {
                    const size = camera_module.get_camera_image(texture);
                    if (size) {
                        console.log("initializing");
                        init = true;
                        camera.aspect = size[0] / size[1];
                        camera.updateProjectionMatrix();
                        empty_renderer.setSize(size[0], size[1]);
                        empty_renderer.render(empty_scene, camera);
                        createImageBitmap(empty_renderer.domElement).then((image_bmp) => {
                            inference_worker.postMessage({ image: image_bmp, size: size });
                        });
                        cube.material.map = texture;
                    }
                }
                renderer.render(scene, camera)
            }
            renderer.setAnimationLoop(render);
        })
    })
})

