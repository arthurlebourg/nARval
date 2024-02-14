import { AIModule } from "./ai_module";
import * as tf from '@tensorflow/tfjs';

let ai_module: AIModule = null!;
self.onmessage = (event) =>
{
    const { data } = event;
    if (data.type === "start")
    {
        ai_module = data.ai_module;
    }
    else
    {
        if (!ai_module)
        {
            console.error("AI module not initialized");
            return;
        }
        tf.engine().startScope();
        ai_module.predict(data.webgldata).then((segmentationMapData) =>
        {
            self.postMessage({ segmentationMapData: segmentationMapData });
        });
        tf.engine().endScope();
        tf.engine().disposeVariables();

    }
};
