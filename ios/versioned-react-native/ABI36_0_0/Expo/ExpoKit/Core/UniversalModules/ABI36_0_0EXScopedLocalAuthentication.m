// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI36_0_0EXLocalAuthentication/ABI36_0_0EXLocalAuthentication.h>)
#import "ABI36_0_0EXScopedLocalAuthentication.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMUtilities.h>
#import "ABI36_0_0EXConstantsBinding.h"
#import <ABI36_0_0UMConstantsInterface/ABI36_0_0UMConstantsInterface.h>

@interface ABI36_0_0EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI36_0_0EXScopedLocalAuthentication

- (void)setModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI36_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI36_0_0UMConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI36_0_0UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  BOOL isInExpoClient = _isInExpoClient;
  [super authenticateWithOptions:options resolve:^(NSDictionary *result) {
    if (isInExpoClient && [[self class] isFaceIdDevice]) {
      NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];

      if (!usageDescription) {
        NSMutableDictionary *scopedResult = [[NSMutableDictionary alloc] initWithDictionary:result];
        scopedResult[@"warning"] = @"FaceID is not available in Expo Client. You can use it in a standalone Expo app by providing `NSFaceIDUsageDescription`.";
        resolve(scopedResult);
        return;
      }
    }
    resolve(result);
  } reject:reject];
}

@end
#endif
