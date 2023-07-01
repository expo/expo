// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI49_0_0EXAppReleaseType) {
  ABI49_0_0EXAppReleaseTypeUnknown,
  ABI49_0_0EXAppReleaseSimulator,
  ABI49_0_0EXAppReleaseEnterprise,
  ABI49_0_0EXAppReleaseDev,
  ABI49_0_0EXAppReleaseAdHoc,
  ABI49_0_0EXAppReleaseAppStore
};

@interface ABI49_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI49_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
