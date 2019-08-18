// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXProvisioningProfile.h"
#import "EXKernelUtil.h"

@implementation EXProvisioningProfile {
  NSDictionary *_plist;
}

+ (instancetype)mainProvisioningProfile
{
  static EXProvisioningProfile *profile;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSDictionary *plist = [self _readProvisioningProfilePlist];
    profile = [[self alloc] initWithPlist:plist];
  });
  return profile;
}

- (instancetype)initWithPlist:(NSDictionary *)plist
{
  if (self = [super init]) {
    _plist = [plist copy];
  }
  return self;
}

- (BOOL)isDevelopment
{
  if (!_plist) {
    return NO;
  }
  
  NSDictionary *entitlements = _plist[@"Entitlements"];
  NSString *apsEnvironment = entitlements[@"aps-environment"];
  if (!apsEnvironment) {
    DDLogWarn(@"aps-environment is missing from the entitlements; ensure that the provisioning profile enables push notifications");
    return NO;
  }
  
  return [apsEnvironment isEqualToString:@"development"];
}

/** embedded.mobileprovision plist format:
 
 AppIDName, // string — TextDetective
 ApplicationIdentifierPrefix[],  // [ string - 66PK3K3KEV ]
 CreationData, // date — 2013-01-17T14:18:05Z
 DeveloperCertificates[], // [ data ]
 Entitlements {
 application-identifier // string - 66PK3K3KEV.com.blindsight.textdetective
 get-task-allow // true or false
 keychain-access-groups[] // [ string - 66PK3K3KEV.* ]
 },
 ExpirationDate, // date — 2014-01-17T14:18:05Z
 Name, // string — Barrierefreikommunizieren (name assigned to the provisioning profile used)
 ProvisionedDevices[], // [ string.... ]
 TeamIdentifier[], // [string — HHBT96X2EX ]
 TeamName, // string — The Blindsight Corporation
 TimeToLive, // integer - 365
 UUID, // string — 79F37E8E-CC8D-4819-8C13-A678479211CE
 Version, // integer — 1
 ProvisionsAllDevices // true or false  ***NB: not sure if this is where this is
 
 */
+ (NSDictionary *)_readProvisioningProfilePlist
{
  NSString *profilePath = [[NSBundle mainBundle] pathForResource:@"embedded" ofType:@"mobileprovision"];
  if (!profilePath) {
    return nil;
  }
  
  NSError *error;
  NSString *profileString = [NSString stringWithContentsOfFile:profilePath encoding:NSASCIIStringEncoding error:&error];
  if (!profileString) {
    DDLogError(@"Error reading provisioning profile: %@", error.localizedDescription);
    return nil;
  }
  
  NSScanner *scanner = [NSScanner scannerWithString:profileString];
  BOOL readPrelude = [scanner scanUpToString:@"<?xml version=\"1.0\" encoding=\"UTF-8\"?>" intoString:nil];
  if (!readPrelude) {
    return nil;
  }
  
  NSString *plistString;
  BOOL readPlist = [scanner scanUpToString:@"</plist>" intoString:&plistString];
  if (!readPlist) {
    return nil;
  }
  plistString = [plistString stringByAppendingString:@"</plist>"];
  
  NSData *plistData = [plistString dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *plistDictionary = [NSPropertyListSerialization propertyListWithData:plistData
                                                                            options:NSPropertyListImmutable
                                                                             format:NULL
                                                                              error:&error];
  if (!plistDictionary) {
    DDLogError(@"Error unserializing provisioning profile plist: %@", error.localizedDescription);
    return nil;
  }
  
  return plistDictionary;
}

+ (EXClientReleaseType)clientReleaseType {
  NSString *provisioningPath = [[NSBundle mainBundle] pathForResource:@"embedded" ofType:@"mobileprovision"];
  if (!provisioningPath) {
    // provisioning profile does not exist
#if TARGET_IPHONE_SIMULATOR
    return EXClientReleaseSimulator;
#else
    return EXClientReleaseAppStore;
#endif
  }
  
  NSDictionary *mobileProvision = [self _readProvisioningProfilePlist];
  if (!mobileProvision) {
    // failure to read other than it simply not existing
    return EXClientReleaseTypeUnknown;
  } else if ([[mobileProvision objectForKey:@"ProvisionsAllDevices"] boolValue]) {
    // enterprise distribution contains ProvisionsAllDevices - true
    return EXClientReleaseEnterprise;
  } else if ([mobileProvision objectForKey:@"ProvisionedDevices"] && [[mobileProvision objectForKey:@"ProvisionedDevices"] count] > 0) {
    // development contains UDIDs and get-task-allow is true
    // ad hoc contains UDIDs and get-task-allow is false
    NSDictionary *entitlements = [mobileProvision objectForKey:@"Entitlements"];
    if ([[entitlements objectForKey:@"get-task-allow"] boolValue]) {
      return EXClientReleaseDev;
    } else {
      return EXClientReleaseAdHoc;
    }
  } else {
    // app store contains no UDIDs (if the file exists at all?)
    return EXClientReleaseAppStore;
  }
}

+ (NSString *)clientReleaseTypeToString:(EXClientReleaseType)releaseType
{
  switch (releaseType)
  {
    case EXClientReleaseTypeUnknown:
      return @"UNKNOWN";
    case EXClientReleaseSimulator:
      return @"SIMULATOR";
    case EXClientReleaseEnterprise:
      return @"ENTERPRISE";
    case EXClientReleaseDev:
      return @"DEVELOPMENT";
    case EXClientReleaseAdHoc:
      return @"ADHOC";
    case EXClientReleaseAppStore:
      return @"APPLE_APP_STORE";
  }
}

@end
