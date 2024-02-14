"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attemptModification = void 0;
const config_1 = require("@expo/config");
const chalk_1 = __importDefault(require("chalk"));
const Log = __importStar(require("./log"));
/** Wraps `[@expo/config] modifyConfigAsync()` and adds additional logging. */
async function attemptModification(projectRoot, edits, exactEdits) {
    const modification = await (0, config_1.modifyConfigAsync)(projectRoot, edits, {
        skipSDKVersionRequirement: true,
    });
    if (modification.type === 'success') {
        Log.log();
    }
    else {
        warnAboutConfigAndThrow(modification.type, modification.message, exactEdits);
    }
}
exports.attemptModification = attemptModification;
function logNoConfig() {
    Log.log(chalk_1.default.yellow(`No Expo config was found. Please create an Expo config (${chalk_1.default.bold `app.json`} or ${chalk_1.default.bold `app.config.js`}) in your project root.`));
}
function warnAboutConfigAndThrow(type, message, edits) {
    Log.log();
    if (type === 'warn') {
        // The project is using a dynamic config, give the user a helpful log and bail out.
        Log.log(chalk_1.default.yellow(message));
    }
    else {
        logNoConfig();
    }
    notifyAboutManualConfigEdits(edits);
    throw new Error();
}
function notifyAboutManualConfigEdits(edits) {
    Log.log(chalk_1.default.cyan(`Please add the following to your Expo config`));
    Log.log();
    Log.log(JSON.stringify(edits, null, 2));
    Log.log();
}
