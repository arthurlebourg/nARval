import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Texture, WebGLRenderer } from 'three'
import './style.css'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'
import { AIModule } from './ai_module'



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

    const texture : Texture = new Texture();

    button.addEventListener('click', () => {
        CameraModule.make_camera_module(renderer).then((camera_module) => {
            AIModule.initializeModels().then((ai_module) => {
                const render = () => {
                    if (!renderer.xr.getFrame()) {
                        return;
                    }
                    camera_module.get_camera_image(texture);
                    if (texture) {
                        ai_module;//.runDeeplab(texture);
                        cube.material.map = texture;

                    }
                    renderer.render(scene, camera)
                }
                renderer.setAnimationLoop(render);
            })
        })
    })
})

