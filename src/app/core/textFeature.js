var Params = require('./params');
var Parameters = require('./parameters');
var Parameter = require("./parameter");
var StringValue = Parameters.StringValue;
var FeatureSets = require("../featureSets");
var Registry = require("./registry");
import Feature from "./feature";

export default class TextFeature extends Feature{
    constructor(text, params, id = TextFeature.generateID()){
        super("TEXT", "Basic", params, id, id);
        this.__text = text;
        this.__params.updateParameter("text", text);
    }


    static generateID() {
        return Registry.generateID();
    }

    toJSON() {
        let output = {};
        output.id = this.__id;
        output.name = this.__name.toJSON();
        output.type = this.__type;
        output.set = this.__set;
        output.params = this.__params.toJSON();
        return output;
    }

    toInterchangeV1(){
        //TODO: We need to figure out what to do and what the final feature format will be
        let output = {};
        output.id = this.__id;
        output.name = this.__name.toJSON();
        output.macro = this.__type;
        output.set = this.__set;
        output.params = this.__params.toJSON();
        output.type = this.__fabtype;
        return output;
    }


    getID(){
        return this.__id;
    }

    setName(name){
        this.__name = StringValue(name);
    }

    getName(){
        return this.__name.getValue();
    }

    getType(){
        return this.__type;
    }

    getText(){
        return this.__text;
    }

    static getFeatureGenerator(typeString, setString){
        return function(values){
            return Feature.makeFeature(typeString, setString, values);
        }
    }

    getValue(key){
        try {
            return this.__params.getValue(key);
        } catch (err){
            if (this.hasDefaultParam(key)) return this.getDefaults()[key];
            else throw new Error("Unable to get value for key: " + key);
        }
    }

    hasDefaultParam(key){
        if (this.getDefaults().hasOwnProperty(key)) return true;
        else return false;
    }

    hasUniqueParam(key){
        return this.__params.isUnique(key);
    }

    hasHeritableParam(key){
        return this.__params.isHeritable(key);
    }

    getHeritableParams(){
        return Feature.getDefinitionForType(this.getType(), this.getSet()).heritable;
    }

    getUniqueParams(){
        return Feature.getDefinitionForType(this.getType(), this.getSet()).unique;
    }

    getDefaults(){
        return Feature.getDefaultsForType(this.getType(), this.getSet());
    }

    getParams(){
        return this.__params.parameters;
    }

    setParams(params){
        this.__params.parameters = params;
    }

    static getDefaultsForType(typeString, setString){
        return Registry.featureDefaults[setString][typeString];
    }

    static getDefinitionForType(typeString, setString){
        return FeatureSets.getDefinition(typeString, setString);
    }

    static checkDefaults(values, heritable, defaults){
        for (let key in heritable){
            if (!values.hasOwnProperty(key)) values[key] = defaults[key];
        }
        return values;
    }

    static fromJSON(json) {
        let set;
        if (json.hasOwnProperty("set")) set = json.set;
        else set = "Basic";
        return Feature.makeFeature(json.type, set, json.params, json.name, json.id);
    }

    static fromInterchangeV1(json){
        let set;
        if (json.hasOwnProperty("set")) set = json.set;
        else set = "Basic";
        //TODO: This will have to change soon when the thing is updated
        return Feature.makeFeature(json.macro, set, json.params, json.name, json.id, json.type);
    }

    static makeFeature(textcontent, typeString, setString, values, name = "New Feature", id=undefined){
        // let featureType = FeatureSets.getDefinition(typeString, setString);
        // Feature.checkDefaults(values, featureType.heritable, Feature.getDefaultsForType(typeString, setString));
        // let params = new Params(values, featureType.unique, featureType.heritable);
        return new TextFeature(textcontent, values, id)
    }

    updateView(){
        if(Registry.viewManager) Registry.viewManager.updateFeature(this);
    }

    //I wish I had abstract methods. :(
    render2D(){
        throw new Error("Base class Feature cannot be rendered in 2D.");
    }
}