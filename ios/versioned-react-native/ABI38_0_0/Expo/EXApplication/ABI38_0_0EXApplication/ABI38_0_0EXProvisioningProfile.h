// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI38_0_0EXAppReleaseType) {
  ABI38_0_0EXAppReleaseTypeUnknown,
  ABI38_0_0EXAppReleaseSimulator,
  ABI38_0_0EXAppReleaseEnterprise,
  ABI38_0_0EXAppReleaseDev,
  ABI38_0_0EXAppReleaseAdHoc,
  ABI38_0_0EXAppReleaseAppStore
};

@interface ABI38_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI38_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
