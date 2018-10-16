import MouseTool from "./mouseTool";

const Registry = require("../../core/registry");
import Feature from '../../core/feature';
import SimpleQueue from "../../utils/simpleQueue";
const Component = require("../../core/component");
import paper from 'paper';
import Params from "../../core/params";



export default class PositionTool extends MouseTool {
    constructor(typeString, setString) {
        super();
        this.typeString = typeString;
        this.setString = setString;
        this.currentFeatureID = null;
        let ref = this;
        this.lastPoint = null;
        this.showQueue = new SimpleQueue(function () {
            ref.showTarget();
        }, 20, false);
        this.up = function (event) {
            // do nothing
        };
        this.move = function (event) {
            ref.lastPoint = MouseTool.getEventPosition(event);
            ref.showQueue.run();
        };
        this.down = function (event) {
            Registry.viewManager.killParamsWindow();
            paper.project.deselectAll();
            ref.createNewFeature(MouseTool.getEventPosition(event));
        };
    }

    createNewFeature(point) {
        let name = Registry.currentDevice.generateNewName(this.typeString);
        let newFeature = Feature.makeFeature(this.typeString, this.setString, {
            "position": PositionTool.getTarget(point)
        }, name);
        this.currentFeatureID = newFeature.getID();
        Registry.currentLayer.addFeature(newFeature);
    }

    static getTarget(point) {
        let target = Registry.viewManager.snapToGrid(point);
        return [target.x, target.y];
    }

    /**
     * Renders the target
     */
    showTarget() {
        let target = PositionTool.getTarget(this.lastPoint);
        Registry.viewManager.updateTarget(this.typeString, this.setString, target);
    }

    /**
     * Creates a new component and adds it to the registry's current device
     * Note: Takes the feature ids as an array
     * TODO: Modify this to take the MINT String as another parameter
     * @param typeString Type of the Feature
     * @param params Map of all the paramters
     * @param featureIDs [String] Feature id's of all the features that will be a part of this component
     */
    createNewComponent(typeString, paramdata, featureIDs) {
        let params = new Params(null, null, null, paramdata);
        let componentid = Feature.generateID();
        let name = Registry.currentDevice.generateNewName(typeString);
        let newComponent = new Component(typeString, params, name , "TEST MINT", componentid);
        let feature;

        for (let i in featureIDs) {
            newComponent.addFeatureID(featureIDs[i]);

            //Update the component reference
            feature = Registry.currentDevice.getFeatureByID(featureIDs[i]);
            feature.referenceID = componentid;

        }

        Registry.currentDevice.addComponent(newComponent);
        return newComponent;
    }
}
