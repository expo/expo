"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createInfoPlistFile;
const plist_1 = __importDefault(require("@expo/plist"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function createInfoPlistFile(targetDirectory, appGroupId, urlScheme, activationRule) {
    const infoPlistPath = path_1.default.join(targetDirectory, 'Info.plist');
    let activationRuleValue;
    if (typeof activationRule === 'string') {
        activationRuleValue = activationRule;
    }
    else {
        const rules = {};
        if (activationRule.supportsText) {
            rules.NSExtensionActivationSupportsText = true;
        }
        if (activationRule.supportsWebUrlWithMaxCount) {
            rules.NSExtensionActivationSupportsWebURLWithMaxCount =
                activationRule.supportsWebUrlWithMaxCount;
        }
        if (activationRule.supportsImageWithMaxCount) {
            rules.NSExtensionActivationSupportsImageWithMaxCount =
                activationRule.supportsImageWithMaxCount;
        }
        if (activationRule.supportsMovieWithMaxCount) {
            rules.NSExtensionActivationSupportsMovieWithMaxCount =
                activationRule.supportsMovieWithMaxCount;
        }
        if (activationRule.supportsFileWithMaxCount) {
            rules.NSExtensionActivationSupportsFileWithMaxCount = activationRule.supportsFileWithMaxCount;
        }
        if (activationRule.supportsWebPageWithMaxCount) {
            rules.NSExtensionActivationSupportsWebPageWithMaxCount =
                activationRule.supportsWebPageWithMaxCount;
        }
        if (activationRule.supportsAttachmentsWithMaxCount) {
            rules.NSExtensionActivationSupportsAttachmentsWithMaxCount =
                activationRule.supportsAttachmentsWithMaxCount;
        }
        activationRuleValue = rules;
    }
    const buildObject = {
        AppGroupId: appGroupId,
        MainTargetUrlScheme: urlScheme,
        CFBundleDevelopmentRegion: '$(DEVELOPMENT_LANGUAGE)',
        CFBundleDisplayName: '$(PRODUCT_NAME)',
        CFBundleExecutable: '$(EXECUTABLE_NAME)',
        CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
        CFBundleInfoDictionaryVersion: '6.0',
        CFBundleName: '$(PRODUCT_NAME)',
        CFBundlePackageType: 'XPC!',
        CFBundleShortVersionString: '$(MARKETING_VERSION)',
        CFBundleVersion: '$(CURRENT_PROJECT_VERSION)',
        NSExtension: {
            NSExtensionAttributes: {
                NSExtensionActivationRule: activationRuleValue,
            },
            NSExtensionPointIdentifier: 'com.apple.share-services',
            NSExtensionPrincipalClass: '$(PRODUCT_MODULE_NAME).ShareIntoViewController',
        },
    };
    const builtPlist = plist_1.default.build(buildObject);
    return fs_1.default.writeFileSync(infoPlistPath, builtPlist);
}
