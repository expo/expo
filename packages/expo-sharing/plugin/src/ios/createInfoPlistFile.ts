import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';

import { ActivationRule } from '../sharingPlugin.types';

export default function createInfoPlistFile(
  targetDirectory: string,
  appGroupId: string,
  urlScheme: string,
  activationRule: ActivationRule
) {
  const infoPlistPath = path.join(targetDirectory, 'Info.plist');

  let activationRuleValue: string | Record<string, unknown>;

  if (typeof activationRule === 'string') {
    activationRuleValue = activationRule;
  } else {
    const rules: Record<string, unknown> = {};

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

  const builtPlist = plist.build(buildObject);

  return fs.writeFileSync(infoPlistPath, builtPlist);
}
