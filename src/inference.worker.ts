/*import { AIModule } from "./ai_module";

let ai_module: AIModule = null!;
self.onmessage = (event) => {
    const { data } = event;
    if (data.type === "start") {
        AIModule.initializeModels().then((module) => {
            ai_module = module;
            console.log("worker initialized");
        });
    }
    else {
        if (!ai_module) {
            console.error("AI module not initialized");
            return;
        }

        ai_module.runDeeplab(data.image).then((segmentationMapData) => {
            self.postMessage({ segmentationMapData: segmentationMapData });
        });
    }
};
*/
