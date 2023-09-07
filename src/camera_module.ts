import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, Texture, WebGLRenderer } from "three";

export class CameraModule {
    private _renderer : WebGLRenderer;
    private _reference_space : XRReferenceSpace;
    private _binding : XRWebGLBinding;

    private _texture_camera : PerspectiveCamera;
    private _texture_renderer : WebGLRenderer;
    private _texture_scene : Scene;
    private _texture_material : MeshBasicMaterial;

    private constructor(renderer : WebGLRenderer, reference_space : XRReferenceSpace, binding : XRWebGLBinding)
    {
        this._renderer = renderer;
        this._reference_space = reference_space;
        this._binding = binding;
        this._texture_camera = new PerspectiveCamera();
        this._texture_renderer = new WebGLRenderer();
        this._texture_scene = new Scene();
        this._texture_material = new MeshBasicMaterial();

        const geometry = new PlaneGeometry();
                    
        this._texture_scene.add(new Mesh(geometry, this._texture_material));
    }

    public static async make_camera_module(renderer : WebGLRenderer)
    {
        let session = renderer.xr.getSession();
        while (!session)
        {
            console.log("Waiting for session");
            session = renderer.xr.getSession();
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const reference_space = await session.requestReferenceSpace('local');

        let binding = renderer.xr.getBinding();
        if (!binding)
        {
            let context = renderer.getContext();
            while (!context)
            {
                console.log("Waiting for context");
                context = renderer.getContext();
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            binding = new XRWebGLBinding(session, context);
        }

        const camera_module = new CameraModule(renderer, reference_space, binding);
        return camera_module;
    }

    public get_camera_image() : Texture | null
    {
        const frame = this._renderer.xr.getFrame();
        if (!frame) {
            //console.error("No frame");
            return null;
        }

        const viewerPose = frame.getViewerPose(this._reference_space);
        if (!viewerPose) {
            //console.error("No viewer pose");
            return null;
        }

        for (const view of viewerPose.views)
        {
            // @ts-ignore
            if (view.camera)
            {
                // @ts-ignore
                const cameraTexture : WebGLTexture = this._binding.getCameraImage(view.camera);

                const texture = new Texture();
                this._texture_material.map = texture;
                this._texture_renderer.render(this._texture_scene, this._texture_camera);
                const texProps = this._texture_renderer.properties.get(texture);
                texProps.__webglTexture = cameraTexture;
                return texture;
            }
        }

        //console.error("No camera image");
        return null;

    }
    
}


