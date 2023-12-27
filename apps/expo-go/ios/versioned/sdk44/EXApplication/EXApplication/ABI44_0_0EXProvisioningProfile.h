// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI44_0_0EXAppReleaseType) {
  ABI44_0_0EXAppReleaseTypeUnknown,
  ABI44_0_0EXAppReleaseSimulator,
  ABI44_0_0EXAppReleaseEnterprise,
  ABI44_0_0EXAppReleaseDev,
  ABI44_0_0EXAppReleaseAdHoc,
  ABI44_0_0EXAppReleaseAppStore
};

@interface ABI44_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI44_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
