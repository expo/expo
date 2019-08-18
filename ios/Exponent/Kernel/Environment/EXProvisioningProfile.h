// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

typedef NS_ENUM(NSInteger, EXClientReleaseType) {
  EXClientReleaseTypeUnknown,
  EXClientReleaseSimulator,
  EXClientReleaseEnterprise,
  EXClientReleaseDev,
  EXClientReleaseAdHoc,
  EXClientReleaseAppStore
};

@interface EXProvisioningProfile : NSObject

+ (instancetype)mainProvisioningProfile;

@property (nonatomic, readonly, getter=isDevelopment) BOOL development;

+ (EXClientReleaseType)clientReleaseType;
+ (NSString *)clientReleaseTypeToString:(EXClientReleaseType)releaseType;
@end
