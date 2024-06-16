// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXClientReleaseType.h"
#if __has_include(<EXApplication/EXProvisioningProfile.h>)
#import <EXApplication/EXProvisioningProfile.h>
#endif

@implementation EXClientReleaseType

+ (NSString *)clientReleaseType
{
  // The only scenario in which we care about the app release type is when the App Store release of
  // the Expo development client is run on a real device so the development client knows to restrict
  // projects it can run. We always include expo-application in the App Store release of the
  // development client, so we correctly return "APPLE_APP_STORE" in the aforementioned scenario.
  //
  // In all other scenarios, we don't restrict the projects the client can run and can return either
  // the actual release type or "UNKNOWN" for the same behavior, so it doesn't matter whether
  // expo-application is linked.
#if __has_include(<EXApplication/EXProvisioningProfile.h>)
  EXAppReleaseType releaseType = [[EXProvisioningProfile mainProvisioningProfile] appReleaseType];
  switch (releaseType) {
    case EXAppReleaseTypeUnknown:
      return @"UNKNOWN";
    case EXAppReleaseSimulator:
      return @"SIMULATOR";
    case EXAppReleaseEnterprise:
      return @"ENTERPRISE";
    case EXAppReleaseDev:
      return @"DEVELOPMENT";
    case EXAppReleaseAdHoc:
      return @"ADHOC";
    case EXAppReleaseAppStore:
      return @"APPLE_APP_STORE";
  }
#else
  return @"UNKNOWN";
#endif
}

@end
