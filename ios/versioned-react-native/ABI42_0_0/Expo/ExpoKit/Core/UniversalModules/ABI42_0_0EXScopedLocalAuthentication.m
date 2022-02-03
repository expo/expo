// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXLocalAuthentication/ABI42_0_0EXLocalAuthentication.h>)
#import <LocalAuthentication/LocalAuthentication.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXConstantsInterface.h>

#import "ABI42_0_0EXScopedLocalAuthentication.h"
#import "ABI42_0_0EXConstantsBinding.h"

@interface ABI42_0_0EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI42_0_0EXScopedLocalAuthentication

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI42_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI42_0_0UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
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
