// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI46_0_0EXAppReleaseType) {
  ABI46_0_0EXAppReleaseTypeUnknown,
  ABI46_0_0EXAppReleaseSimulator,
  ABI46_0_0EXAppReleaseEnterprise,
  ABI46_0_0EXAppReleaseDev,
  ABI46_0_0EXAppReleaseAdHoc,
  ABI46_0_0EXAppReleaseAppStore
};

@interface ABI46_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI46_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
