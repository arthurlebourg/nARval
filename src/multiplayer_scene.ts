import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Scene } from "three"

export class MultiplayerScene extends Scene {
    private offset_corrector: Object3D;

    constructor() {
        super();
        this.offset_corrector = new Object3D();
        this.add(this.offset_corrector);

        // add a cube to the scene
        const geometry = new BoxGeometry(0.1, 0.1, 0.1);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new Mesh(geometry, material);
        cube.position.z = -0.5;
        this.offset_corrector.add(cube);

    }
}