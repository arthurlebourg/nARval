import { PerspectiveCamera, WebGLRenderer } from 'three'
import './style.css'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'



document.addEventListener('DOMContentLoaded', () => {
    const renderer = new WebGLRenderer({ antialias: true })
    renderer.xr.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const scene = new MultiplayerScene();
    const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

    const button = ARButton.createButton(renderer, { requiredFeatures: ['hit-test', 'camera-access'] })
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        CameraModule.make_camera_module(renderer).then((camera_module) => {
            const render = () => {
                if (!renderer.xr.getFrame()) {
                    return;
                }
                const texture = camera_module.get_camera_image();
                if (texture) {
                    scene.background = texture;
                }
                renderer.render(scene, camera)
            }
            renderer.setAnimationLoop(render);
        })
    })
})

