import { Object3D, Scene } from "three"

export class MultiplayerScene extends Scene
{
    private offset_corrector: Object3D;

    constructor()
    {
        super();
        this.offset_corrector = new Object3D();
        this.add(this.offset_corrector);

    }
}