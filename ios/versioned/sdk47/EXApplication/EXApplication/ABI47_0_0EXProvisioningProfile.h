// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI47_0_0EXAppReleaseType) {
  ABI47_0_0EXAppReleaseTypeUnknown,
  ABI47_0_0EXAppReleaseSimulator,
  ABI47_0_0EXAppReleaseEnterprise,
  ABI47_0_0EXAppReleaseDev,
  ABI47_0_0EXAppReleaseAdHoc,
  ABI47_0_0EXAppReleaseAppStore
};

@interface ABI47_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI47_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
