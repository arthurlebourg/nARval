import * as tf from '@tensorflow/tfjs';

export class AIModule {
    private _model: tf.GraphModel;
    private constructor(model: tf.GraphModel) {
        this._model = model;
        tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 256000000);

    }

    public static async initializeModels() {
        const model = await tf.loadGraphModel('./TopFormer.tfjs/model.json');

        const ai_module = new AIModule(model);
        await tf.nextFrame();
        return ai_module;
    };

    private preprocess(tensor: tf.Tensor3D) {
        const resized = tf.image.resizeBilinear(tensor, [512, 512]);
        const normalized = resized.cast("int32").toFloat().div(255.0);
        resized.dispose();
        const expanded = normalized.transpose([2, 0, 1]).expandDims();
        normalized.dispose();
        return expanded;
    }

    private postprocess(output: tf.Tensor) {
        return output.argMax(1).squeeze();
    }

    private resizeAndReshape(segMap: tf.Tensor, imgWidth: number, imgHeight: number) {
        const reshapedTensor = segMap.reshape([1, segMap.shape[0], segMap.shape[1]!, 1]) as tf.Tensor3D;
        const resizedTensor3D = tf.image.resizeBilinear(reshapedTensor, [imgHeight, imgWidth]);
        const resizedTensor2D = (resizedTensor3D.squeeze() as tf.Tensor2D).cast("int32");

        //keep only the values of the tensor that are 32 and 63 and 55 
        const mask = resizedTensor2D.equal(32).logicalOr(resizedTensor2D.equal(63)).logicalOr(resizedTensor2D.equal(55));

        // replace all non zero values with 1
        const mask2 = mask.cast("int32");
        const mask3 = mask2.mul(tf.scalar(255));
        return mask3;
    }

    public async predict(input: tf.WebGLData) {
        // @ts-ignore
        const tensor = tf.tensor(input, [input.width, input.height, 3], "int32") as tf.Tensor3D;
        const preprocessed = this.preprocess(tensor);
        tensor.dispose();
        const segmentation = await this._model.executeAsync({ input: preprocessed }) as tf.Tensor;
        preprocessed.dispose();
        const seg = this.postprocess(segmentation) as tf.Tensor3D;
        segmentation.dispose();
        this.resizeAndReshape(seg, input.width, input.height);
        seg.dispose();
        return segmentation;
    }
}