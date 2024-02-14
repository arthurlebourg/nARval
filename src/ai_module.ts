import * as tf from '@tensorflow/tfjs';

export class AIModule
{
    private _model: tf.GraphModel;
    private constructor(model: tf.GraphModel)
    {
        this._model = model;
        tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 256000000);

    }

    public static async initializeModels()
    {
        const model = await tf.loadGraphModel('./TopFormer.tfjs/model.json');

        const ai_module = new AIModule(model);
        await tf.nextFrame();
        console.log("AI Model loaded");
        return ai_module;
    };

    private preprocess(tensor: tf.Tensor3D)
    {
        const resized = tf.image.resizeBilinear(tensor, [512, 512]);
        const normalized = resized.cast("int32").toFloat().div(255.0);
        resized.dispose();
        const expanded = normalized.transpose([2, 0, 1]).expandDims();
        normalized.dispose();
        return expanded;
    }

    private postprocess(output: tf.Tensor)
    {
        return output.argMax(1).squeeze();
    }

    private processData(segMap: tf.Tensor)
    {
        //keep only the values of the tensor that are 32 and 63 and 55 and replace them with 1
        const mask1 = segMap.equal(32).cast("int32");
        const mask2 = segMap.equal(63).cast("int32");
        const mask3 = segMap.equal(55).cast("int32");
        const maskdebug = segMap.equal(5).cast("int32"); // for debug
        const mask = mask1.add(mask2).add(mask3).add(maskdebug);
        console.log("mask", mask.dataSync());
        return mask;
    }

    public async predict(input: tf.WebGLData)
    {
        // @ts-ignore
        const tensor = tf.tensor(input, [input.width, input.height, 3], "int32") as tf.Tensor3D;
        const preprocessed = this.preprocess(tensor);
        tensor.dispose();
        const segmentation = await this._model.executeAsync({ input: preprocessed }) as tf.Tensor;
        preprocessed.dispose();
        const seg = this.postprocess(segmentation) as tf.Tensor3D;
        segmentation.dispose();
        const res = this.processData(seg);
        seg.dispose();
        return res;
    }
}