// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXLocalAuthentication/ABI47_0_0EXLocalAuthentication.h>)
#import <LocalAuthentication/LocalAuthentication.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXConstantsInterface.h>

#import "ABI47_0_0EXScopedLocalAuthentication.h"
#import "ABI47_0_0EXConstantsBinding.h"

@interface ABI47_0_0EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI47_0_0EXScopedLocalAuthentication

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI47_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI47_0_0EX_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
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
