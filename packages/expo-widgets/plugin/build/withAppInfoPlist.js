"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const withInfoPlistValues_1 = __importDefault(require("./withInfoPlistValues"));
const withAppInfoPlist = (config, { frequentUpdates, groupIdentifier }) => {
    return (0, withInfoPlistValues_1.default)(config, {
        NSSupportsLiveActivities: true,
        NSSupportsLiveActivitiesFrequentUpdates: frequentUpdates,
        ExpoWidgetsAppGroupIdentifier: groupIdentifier,
    });
};
exports.default = withAppInfoPlist;
