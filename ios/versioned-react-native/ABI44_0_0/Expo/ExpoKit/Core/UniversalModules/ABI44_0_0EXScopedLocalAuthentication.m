// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXLocalAuthentication/ABI44_0_0EXLocalAuthentication.h>)
#import <LocalAuthentication/LocalAuthentication.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilities.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXConstantsInterface.h>

#import "ABI44_0_0EXScopedLocalAuthentication.h"
#import "ABI44_0_0EXConstantsBinding.h"

@interface ABI44_0_0EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI44_0_0EXScopedLocalAuthentication

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI44_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI44_0_0EX_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  BOOL isInExpoClient = _isInExpoClient;
  [super authenticateWithOptions:options resolve:^(NSDictionary *result) {
    if (isInExpoClient && [[self class] isFaceIdDevice]) {
      NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];

      if (!usageDescription) {
        NSMutableDictionary *scopedResult = [[NSMutableDictionary alloc] initWithDictionary:result];
        scopedResult[@"warning"] = @"Face ID is not available in Expo Go. You can use it in a standalone Expo app by providing `NSFaceIDUsageDescription`.";
        resolve(scopedResult);
        return;
      }
    }
    resolve(result);
  } reject:reject];
}

@end
#endif
