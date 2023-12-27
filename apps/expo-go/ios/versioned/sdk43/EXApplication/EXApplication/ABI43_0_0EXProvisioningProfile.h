// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI43_0_0EXAppReleaseType) {
  ABI43_0_0EXAppReleaseTypeUnknown,
  ABI43_0_0EXAppReleaseSimulator,
  ABI43_0_0EXAppReleaseEnterprise,
  ABI43_0_0EXAppReleaseDev,
  ABI43_0_0EXAppReleaseAdHoc,
  ABI43_0_0EXAppReleaseAppStore
};

@interface ABI43_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI43_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
