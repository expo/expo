"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHashSourcesAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Bare_1 = require("./Bare");
const Expo_1 = require("./Expo");
const Packages_1 = require("./Packages");
const PatchPackage_1 = require("./PatchPackage");
const Profile_1 = require("../utils/Profile");
const debug = require('debug')('expo:fingerprint:sourcer:Sourcer');
async function getHashSourcesAsync(projectRoot, options) {
    const results = await Promise.all([
        // expo
        (0, Profile_1.profile)(options, Expo_1.getExpoAutolinkingAndroidSourcesAsync)(projectRoot, options),
        (0, Profile_1.profile)(options, Expo_1.getExpoAutolinkingIosSourcesAsync)(projectRoot, options),
        (0, Profile_1.profile)(options, Expo_1.getExpoConfigSourcesAsync)(projectRoot, options),
        (0, Profile_1.profile)(options, Expo_1.getEasBuildSourcesAsync)(projectRoot, options),
        (0, Profile_1.profile)(options, Expo_1.getExpoCNGPatchSourcesAsync)(projectRoot, options),
        // bare managed files
        (0, Profile_1.profile)(options, Bare_1.getGitIgnoreSourcesAsync)(projectRoot, options),
        (0, Profile_1.profile)(options, Bare_1.getPackageJsonScriptSourcesAsync)(projectRoot, options),
        // bare native files
        (0, Profile_1.profile)(options, Bare_1.getBareAndroidSourcesAsync)(projectRoot, options),
        (0, Profile_1.profile)(options, Bare_1.getBareIosSourcesAsync)(projectRoot, options),
        // rn-cli autolinking
        (0, Profile_1.profile)(options, Bare_1.getRncliAutolinkingSourcesAsync)(projectRoot, options),
        // patch-package
        (0, Profile_1.profile)(options, PatchPackage_1.getPatchPackageSourcesAsync)(projectRoot, options),
        // some known dependencies, e.g. react-native
        (0, Profile_1.profile)(options, Packages_1.getDefaultPackageSourcesAsync)(projectRoot, options),
    ]);
    // extra sources
    if (options.extraSources) {
        for (const source of options.extraSources) {
            debug(`Adding extra source - ${chalk_1.default.dim(JSON.stringify(source))}`);
        }
        results.push(options.extraSources);
    }
    // flatten results
    return [].concat(...results);
}
exports.getHashSourcesAsync = getHashSourcesAsync;
//# sourceMappingURL=Sourcer.js.map