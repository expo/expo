// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI45_0_0EXAppReleaseType) {
  ABI45_0_0EXAppReleaseTypeUnknown,
  ABI45_0_0EXAppReleaseSimulator,
  ABI45_0_0EXAppReleaseEnterprise,
  ABI45_0_0EXAppReleaseDev,
  ABI45_0_0EXAppReleaseAdHoc,
  ABI45_0_0EXAppReleaseAppStore
};

@interface ABI45_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI45_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
