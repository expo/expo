// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI40_0_0EXAppReleaseType) {
  ABI40_0_0EXAppReleaseTypeUnknown,
  ABI40_0_0EXAppReleaseSimulator,
  ABI40_0_0EXAppReleaseEnterprise,
  ABI40_0_0EXAppReleaseDev,
  ABI40_0_0EXAppReleaseAdHoc,
  ABI40_0_0EXAppReleaseAppStore
};

@interface ABI40_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI40_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
