import * as THREE from 'three'

import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { MultiplayerScene } from './multiplayer_scene'
import { CameraModule } from './camera_module'
import { AIModule } from './ai_module'
import * as tf from '@tensorflow/tfjs'

document.addEventListener('DOMContentLoaded', async () =>
{
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true, canvas: canvas })
    renderer.xr.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    canvas.style.border = '10px solid blue';
    document.body.appendChild(canvas);

    //const worker = new Worker(new URL('./inference.worker.ts', import.meta.url));

    const backend = new tf.MathBackendWebGL(renderer.domElement);
    tf.registerBackend('custom-webgl', () => backend);
    const scene = new MultiplayerScene();

    //const empty_scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

    const button = ARButton.createButton(renderer, { requiredFeatures: ['camera-access', "local-floor"] })
    document.body.appendChild(button);

    const camera_feed_as_texture: THREE.Texture = new THREE.Texture();

    const clock = new THREE.Clock();

    const AIMod: AIModule = await AIModule.initializeModels();

    // post process of result
    // Create a plane with the texture
    /*const geometry = new THREE.PlaneGeometry(10, 10); // Adjust size as needed
    const material = new THREE.ShaderMaterial({
        vertexShader: "void main() { \
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); \
      }",
        fragmentShader: "uniform sampler2D texture; \
    uniform vec3 cameraPos; \
    void main() { \
      vec2 uv = gl_FragCoord.xy / resolution.xy; // normalized UV coordinates \
      vec4 texColor = texture2D(texture, uv); \
      if (texColor.r == 1.0) { \
        vec3 rayDirection = normalize(vec3(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, -1.0)); \
        vec3 rayOrigin = cameraPos; \
        // Perform ray-plane intersection with y = 0 \
        float t = -rayOrigin.y / rayDirection.y; \
        vec3 intersectionPoint = rayOrigin + t * rayDirection; \
        // Output intersection point in world coordinates \
        gl_FragColor = vec4(intersectionPoint, 1.0); \
      } else { \
        discard; // Skip pixels where the value is not 1 \
      } \
    }",
        uniforms: {
            texture: { value: camera_feed_as_texture },
            cameraPos: { value: camera.position }
        }
    });

    const plane = new THREE.Mesh(geometry, material);
    empty_scene.add(plane);*/

    button.addEventListener('click', () =>
    {
        console.log("click")   
        CameraModule.make_camera_module(renderer).then((camera_module) =>
        {
            const render = async () =>
            {
                if (!renderer.xr.getFrame())
                {
                    return;
                }

                clock.getDelta();

                if (clock.elapsedTime > 15.0)
                {
                    const camera_info = camera_module.get_camera_image(camera_feed_as_texture);

                    if (camera_info)
                    {
                        tf.engine().startScope();
                        // create tf WegGLData from camera_feed_as_texture
                        const segmentation: tf.WebGLData = { texture: camera_info[2], height: camera_info[1], width: camera_info[0], channels: "RGB" }
                        const segmentation_result = await AIMod.predict(segmentation)
                        const resultCPU = segmentation_result.dataSync();
                        for (let i = 0; i < 4096; i++)
                        {
                            if (resultCPU[i] == 1)
                            {
                                // get x y  from i
                                const x = i % camera_info[0];
                                const y = Math.floor(i / camera_info[0]);

                                const resized_x = x * camera_info[0];
                                const resized_y = y * camera_info[1];

                                const rayDirection = new THREE.Vector3(
                                    resized_x * 2 - 1,
                                    -(resized_y * 2 - 1),
                                    -1
                                ).normalize();

                                const rayOrigin = camera.position.clone();

                                const t = -rayOrigin.y / rayDirection.y;
                                const intersectionPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t));
                                // add sphere to scene
                                const geometry = new THREE.SphereGeometry(0.1, 32, 32);
                                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                                const sphere = new THREE.Mesh(geometry, material);
                                sphere.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
                                scene.add(sphere);
                                //console.log("intersectionPoint", intersectionPoint)
                            }
                        }
                        /*const pixels = new Uint8Array(4 * camera_info[1] * camera_info[0]); // Assuming RGBA format
                        const texture = segmentation_result.dataToGPU();
                        plane.material.uniforms.texture.value = texture;
                        plane.material.uniforms.cameraPos.value = camera.position;

                        renderer.render(empty_scene, camera);

                        renderer.readRenderTargetPixels(
                            renderer.getRenderTarget()!,
                            0, 0, camera_info[0], camera_info[1],
                            pixels // Assuming RGBA format
                        );
                        console.log("pixels", pixels)
                        const intersectionPoints = []; // Array to store intersection points
                        // Process the pixels and collect intersection points
                        for (let i = 0; i < camera_info[0] * camera_info[1]; i++)
                        {
                            const x = i % camera_info[0];
                            const y = Math.floor(i / camera_info[0]);

                            const pixelValue = new THREE.Vector4(
                                pixels[i * 4] / 255,
                                pixels[i * 4 + 1] / 255,
                                pixels[i * 4 + 2] / 255,
                                pixels[i * 4 + 3] / 255
                            );

                            // Assuming the pixel value for intersection is (1, 1, 1, 1)
                            if (pixelValue.equals(new THREE.Vector4(1, 1, 1, 1)))
                            {
                                console.log("pixelValue", pixelValue)
                                const normalizedX = x / camera_info[0];
                                const normalizedY = y / camera_info[1];

                                const rayDirection = new THREE.Vector3(
                                    normalizedX * 2 - 1,
                                    -(normalizedY * 2 - 1),
                                    -1
                                ).normalize();

                                const rayOrigin = camera.position.clone();

                                const t = -rayOrigin.y / rayDirection.y;
                                const intersectionPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t));

                                intersectionPoints.push(intersectionPoint);
                            }
                        }*/
                        tf.engine().endScope();
                        tf.engine().disposeVariables();
                    }
                    clock.start();
                }


                renderer.render(scene, camera)
                camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
                console.log("camera.position", camera.position)
            }

            // TODO : Change setAnimationLoop to make my own loop so that I have real control over the loop and WebXR data
            renderer.setAnimationLoop(render);
        })
    })
})

