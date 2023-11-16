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
Object.defineProperty(exports, "__esModule", { value: true });
exports.XcodeProjectFile = exports.Version = exports.UsesNonExemptEncryption = exports.Updates = exports.Target = exports.Swift = exports.Scheme = exports.RequiresFullScreen = exports.ProvisioningProfile = exports.Orientation = exports.Name = exports.Locales = exports.Maps = exports.Google = exports.DeviceFamily = exports.BuildScheme = exports.BuildProperties = exports.BundleIdentifier = exports.Bitcode = exports.XcodeUtils = exports.Permissions = exports.Paths = exports.Entitlements = void 0;
const Bitcode = __importStar(require("./Bitcode"));
exports.Bitcode = Bitcode;
const BuildProperties = __importStar(require("./BuildProperties"));
exports.BuildProperties = BuildProperties;
const BuildScheme = __importStar(require("./BuildScheme"));
exports.BuildScheme = BuildScheme;
const BundleIdentifier = __importStar(require("./BundleIdentifier"));
exports.BundleIdentifier = BundleIdentifier;
const DeviceFamily = __importStar(require("./DeviceFamily"));
exports.DeviceFamily = DeviceFamily;
const Entitlements = __importStar(require("./Entitlements"));
exports.Entitlements = Entitlements;
const Google = __importStar(require("./Google"));
exports.Google = Google;
const Locales = __importStar(require("./Locales"));
exports.Locales = Locales;
const Maps = __importStar(require("./Maps"));
exports.Maps = Maps;
const Name = __importStar(require("./Name"));
exports.Name = Name;
const Orientation = __importStar(require("./Orientation"));
exports.Orientation = Orientation;
const Paths = __importStar(require("./Paths"));
exports.Paths = Paths;
const Permissions = __importStar(require("./Permissions"));
exports.Permissions = Permissions;
const ProvisioningProfile = __importStar(require("./ProvisioningProfile"));
exports.ProvisioningProfile = ProvisioningProfile;
const RequiresFullScreen = __importStar(require("./RequiresFullScreen"));
exports.RequiresFullScreen = RequiresFullScreen;
const Scheme = __importStar(require("./Scheme"));
exports.Scheme = Scheme;
const Swift = __importStar(require("./Swift"));
exports.Swift = Swift;
const Target = __importStar(require("./Target"));
exports.Target = Target;
const Updates = __importStar(require("./Updates"));
exports.Updates = Updates;
const UsesNonExemptEncryption = __importStar(require("./UsesNonExemptEncryption"));
exports.UsesNonExemptEncryption = UsesNonExemptEncryption;
const Version = __importStar(require("./Version"));
exports.Version = Version;
const XcodeProjectFile = __importStar(require("./XcodeProjectFile"));
exports.XcodeProjectFile = XcodeProjectFile;
const XcodeUtils = __importStar(require("./utils/Xcodeproj"));
exports.XcodeUtils = XcodeUtils;
