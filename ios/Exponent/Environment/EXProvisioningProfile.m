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

@end
