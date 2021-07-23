"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.getGUID = void 0;
var Application = __importStar(require("expo-application"));
var expo_constants_1 = __importDefault(require("expo-constants"));
var react_native_1 = require("react-native");
var bareMap = {
    ios: {
        // bare-expo
        'dev.expo.Payments': '629683148649-uvkfsi3pckps3lc4mbc2mi7pna8pqej5',
        // NCL standalone
        'host.exp.nclexp': '29635966244-1vu5o3e9ucoh12ujlsjpn30kt3dbersv',
    },
    android: {
        // bare-expo
        'dev.expo.payments': '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
        // NCL standalone
        'host.exp.nclexp': '29635966244-lbejmv84iurcge3hn7fo6aapu953oivs',
    },
};
var BARE_GUIDs = react_native_1.Platform.select(bareMap);
var managedMap = {
    ios: '29635966244-td9jmh1m5trn8uuqa0je1mansia76cln',
    android: '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
};
var GUID = react_native_1.Platform.select(managedMap);
function getGUID() {
    if (['storeClient', 'standalone'].includes(expo_constants_1.default.executionEnvironment)) {
        if (!GUID)
            throw new Error("No valid GUID for Expo Go on platform: " + react_native_1.Platform.OS + ". Supported native platforms are currently: " + Object.keys(managedMap).join(', '));
        return GUID;
    }
    else if (expo_constants_1.default.executionEnvironment === 'bare') {
        if (!BARE_GUIDs) {
            throw new Error("No valid GUID for bare projects on platform: " + react_native_1.Platform.OS + ". Supported native platforms are currently: " + Object.keys(bareMap).join(', '));
        }
        if (!Application.applicationId) {
            throw new Error('Cannot get GUID with null `Application.applicationId`');
        }
        if (!(Application.applicationId in BARE_GUIDs)) {
            throw new Error("No valid GUID for native app Id: " + Application.applicationId + ". Valid GUIDs exist for " + react_native_1.Platform.OS + " projects with native Id: " + Object.keys(BARE_GUIDs).join(', '));
        }
        return BARE_GUIDs[Application.applicationId];
    }
    else {
        throw new Error("No GUID available for executionEnvironment: " + expo_constants_1.default.executionEnvironment);
    }
}
exports.getGUID = getGUID;
//# sourceMappingURL=guid.js.map