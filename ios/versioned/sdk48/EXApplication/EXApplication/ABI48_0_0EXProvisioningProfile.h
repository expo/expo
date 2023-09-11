// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI48_0_0EXAppReleaseType) {
  ABI48_0_0EXAppReleaseTypeUnknown,
  ABI48_0_0EXAppReleaseSimulator,
  ABI48_0_0EXAppReleaseEnterprise,
  ABI48_0_0EXAppReleaseDev,
  ABI48_0_0EXAppReleaseAdHoc,
  ABI48_0_0EXAppReleaseAppStore
};

@interface ABI48_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI48_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
