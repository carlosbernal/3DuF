var Params = require("./params");
var Parameters = require("./parameters");
var Parameter =require("./parameter");
import Feature from './feature';
var Registry = require("./registry");

import Layer from './layer';

var StringValue = Parameters.StringValue;
var FloatValue = Parameters.FloatValue;

/* The Device stores information about a design. */
export default class Device {
    constructor(values, name = "New Device") {
        this.layers = [];
        this.textLayers = [];
        this.params = new Params(values, Device.getUniqueParameters(), Device.getHeritableParameters());
        this.name = StringValue(name);
        this.__components = [];
        this.__connections = [];
        this.__valveMap = new Map();
    }

    /**
     * Adds a connection to the device
     * @param connection
     */
    addConnection(connection){
        this.__connections.push(connection);
    }

    /**
     * Removes a connection from the device
     * @param connection
     */
    removeConnection(connection){
        let i = this.__connections.indexOf(connection);
        if(i != -1) {
            this.__connections.splice(i, 1);
        }

    }

    /**
     * Adds a component to the device
     * @param component
     */
    addComponent(component){
        this.__components.push(component);
    }

    /**
     * Removes a component from the device
     * @param component
     */
    removeComponent(component){
        //Remove the component from the map
        let componentid = component.getID();

        //Check if the valve map has the component
        if(this.__valveMap.has(componentid)){
            this.__valveMap.delete(componentid);
        }

        let i = this.__components.indexOf(component);
        if(i != -1) {
            this.__components.splice(i, 1);
        }
    }

    /**
     * Returns the list of components from the device
     * @return {Array}
     */
    getComponents(){
        return this.__components;
    }

    /**
     * Sets the name of the device
     * @param name
     */
    setName(name){
        this.name = StringValue(name);
        this.updateView();
    }

    /**
     * Updates the parameter
     * @param key
     * @param value
     */
    updateParameter(key, value){
        this.params.updateParameter(key, value);
        this.updateView();
    }

    /* Sort the layers such that they are ordered from lowest to highest z_offset. */
    sortLayers() {
        this.layers.sort(function(a, b) {
            return a.params.getValue("z_offset") - b.params.getValue("z_offset");
        });
    }

    /**
     * Returns the ayer that contains the feature with the given feature ID
     * @param featureID
     * @return Layer
     */
    getLayerFromFeatureID(featureID){
        for (let i = 0; i < this.layers.length; i ++){
            let layer = this.layers[i];
            if (layer.containsFeatureID(featureID)){
                return layer;
            } 
        } 
        for (let i = 0; i < this.textLayers.length; i ++){
            let layer = this.textLayers[i];
            if (layer.containsFeatureID(featureID)){
                return layer;
            }
        }
        throw new Error("FeatureID " + featureID + " not found in any layer.");
    }

    /**
     * Checks if feature with given feature id is part of the device
     * @param featureID
     * @return {boolean}
     */
    containsFeatureID(featureID){
        for (let i = 0; i < this.layers.length; i ++){
            if (this.layers[i].containsFeatureID(featureID)) return true;
        }
        return false;
    }

    /**
     * Returns a list of all the features in the device
     * @return {Array}
     */
    getAllFeaturesFromDevice() {
        let features = [];
        for (let i in this.layers) {
            //features.push.apply(features, layer.features);
            let layer = this.layers[i];
            for(let j in layer.features){
                console.log(layer.features[j]);
                features.push(layer.features[j]);
            }
        }
        return features;
    }

    /**
     * Returns the feature with the given feature id
     * @param featureID
     * @return Feature
     */
    getFeatureByID(featureID){
        let layer =  this.getLayerFromFeatureID(featureID);
        return layer.getFeature(featureID);
    }

    /* Add a layer, and re-sort the layers array.*/
    addLayer(layer) {
        layer.device = this;
        this.layers.push(layer);
        //this.sortLayers();
        if (Registry.viewManager) Registry.viewManager.addLayer(this.layers.indexOf(layer));
    }


    removeFeature(feature){
        this.removeFeatureByID(feature.getID());
    }

    removeFeatureByID(featureID){
        let layer = this.getLayerFromFeatureID(featureID);
        layer.removeFeatureByID(featureID);
    }

    updateViewLayers(){
        if (Registry.viewManager) Registry.viewManager.updateLayers(this);
    }

    updateView(){
        if (Registry.viewManager) Registry.viewManager.updateDevice(this);
    }

    static getUniqueParameters(){
        return {
            "height": "Float",
            "width": "Float"
        }
    }

    static getHeritableParameters(){
        return {};
    }

    __renderLayers2D(){
        let output = [];
        for (let i = 0; i < this.layers.length; i++){
            output.push(this.layers[i].render2D())
        }
        return output;
    }

    __groupsToJSON() {
        let output = [];
        for (let i in this.groups) {
            output.push(this.groups[i].toJSON());
        }
        return output;
    }

    __layersToJSON() {
        let output = [];
        for (let i in this.layers) {
            output.push(this.layers[i].toJSON());
        }
        return output;
    }

    __featureLayersToInterchangeV1(){
        let output = [];
        for(let i in this.layers){
            output.push(this.layers[i].toInterchangeV1())
        }
        return output;
    }

    __loadLayersFromJSON(json) {
        for (let i in json) {
            let newLayer = Layer.fromJSON(json[i]);
            this.addLayer(newLayer);
        }
    }

    __loadFeatureLayersFromInterchangeV1(json){
        for (let i in json){
            let newLayer = Layer.fromInterchangeV1(json[i]);
            this.addLayer(newLayer);
        }
    }

    toJSON() {
        let output = {};
        output.name = this.name.toJSON();
        output.params = this.params.toJSON();
        output.layers = this.__layersToJSON();
        output.groups = this.__groupsToJSON();
        output.defaults = this.defaults;
        return output;
    }

    toInterchangeV1() {
        let output = {};
        output.name = this.name;
        output.params = this.params.toJSON();
        //TODO: Use this to dynamically create enough layers to scroll through
        // output.layers = this.__layersToInterchangeV1();
        // output.components = this.__componentsToInterchangeV1();
        // output.connections = this.__connectionToInterchangeV1();
        //TODO: Use this to render the device features
        output.features = this.__featureLayersToInterchangeV1();
        output.version = 1;
        output.groups = this.__groupsToJSON();
        return output;
    }

    static fromJSON(json) {
        let defaults = json.defaults;
        let newDevice = new Device({
            "width": json.params.width,
            "height": json.params.height
        }, json.name);
        newDevice.__loadLayersFromJSON(json.layers);
        return newDevice;
    }

    static fromInterchangeV1(json) {
        let defaults = json.defaults;
        let newDevice = new Device({
            "width": json.params.width,
            "height": json.params.height
        }, json.name);
        //TODO: Use this to dynamically create enough layers to scroll through
        //newDevice.__loadLayersFromInterchangeV1(json.layers);
        //TODO: Use these two generate a rat's nest
        //newDevice.__loadComponentsFromInterchangeV1(json.layers);
        //newDevice.__loadConnectionsFromInterchangeV1(json.layers);
        //TODO: Use this to render the device features
        newDevice.__loadFeatureLayersFromInterchangeV1(json.features);
        return newDevice;
    }

    render2D(){
        return this.__renderLayers2D();
    }

    /**
     * Set the X-Span Value
     * @param value
     */
    setXSpan(value){
        this.params.updateParameter("width", value);
    }

    /**
     * Set the Y-Span Value
     * @param value
     */
    setYSpan(value){
        this.params.updateParameter("height", value);
    }

    /**
     * Returns the X-Span Value
     * @return {*}
     */
    getXSpan(){
        return this.params.getValue("width");
    }

    /**
     * Returns the Y-Span Value
     * @return {*}
     */
    getYSpan(){
        return this.params.getValue("height");
    }

    /**
     * Create the layers necessary for creating a new level
     * @return {*[]} returns a the layer objects created
     */
    createNewLayerBlock(){
        let flowlayer = new Layer({"z_offset": 0, "flip": false}, "flow");
        let controllayer = new Layer({"z_offset": 0, "flip": false}, "control");
        //TODO: remove cell layer from the whole system
        let cell = new Layer({"z_offset": 0, "flip": false}, "cell");

        this.addLayer(flowlayer);
        this.addLayer(controllayer);

        //TODO:Remove Cell layer from the whole system
        this.addLayer(cell);

        return [flowlayer, controllayer, cell];
    }

    /**
     * Deletes the layer defined by the index
     * @param index
     */
    deleteLayer(index){

        if(index != -1) {
            this.layers.splice(index, 1);
        }

    }

    /**
     * Returns the component identified by the id
     * @param id
     * @return Component
     */
    getComponentForFeatureID(id){
        for(let i in this.__components){
            let component = this.__components[i];
            //go through each component's features
            for(let j in component.features){
                let feature = component.features[j];
                if(feature === id){
                    return component;
                }
            }
        }

        return null;
    }

    /**
     * Returns the connection identified by the id
     * @param id
     * @return Connection
     */
    getConnectionForFeatureID(id){
        for(let i in this.__connections){
            let connection = this.__connections[i];
            //go through each component's features
            for(let j in connection.features){
                let feature = connection.features[j];
                if(feature === id){
                    return connection;
                }
            }
        }

        return null;

    }

    /**
     * Insert a connection between a valve component and the connection component
     * @param valve
     * @param connection
     */
    insertValve(valve, connection){
        this.__valveMap.set(valve.getID(), connection.getID());
    }

    getConnections(){
        return this.__connections;
    }

    //Returns a list of valves mapped onto the connection
    getValvesForConnection(connection){
        let connectionid = connection.getID();
        let ret = [];
        for (let [key, value] of this.__valveMap) {
            // let  = pair;
            if(connectionid == value){
                ret.push(this.getComponentByID(key));
            }
        }

        return ret;
    }

    /**
     * Returns component that identified by the given key
     * @param key
     * @return Component
     */
    getComponentByID(key) {
        for(let i in this.__components){

            let component = this.__components[i];
            if(component.getID() == key){
                return component;
            }
        }
    }
}
