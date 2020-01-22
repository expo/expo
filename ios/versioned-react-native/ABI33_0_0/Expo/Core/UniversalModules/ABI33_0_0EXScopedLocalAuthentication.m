// Copyright © 2019-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXScopedLocalAuthentication.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMUtilities.h>
#import "ABI33_0_0EXConstantsBinding.h"
#import <ABI33_0_0UMConstantsInterface/ABI33_0_0UMConstantsInterface.h>

@interface ABI33_0_0EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation ABI33_0_0EXScopedLocalAuthentication

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((ABI33_0_0EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(ABI33_0_0UMConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

ABI33_0_0UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateAsync:(NSString *)reason
                    resolve:(ABI33_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI33_0_0UMPromiseRejectBlock)reject)
{
  BOOL isInExpoClient = _isInExpoClient;
  [super authenticateAsync:reason resolve:^(NSDictionary *result) {
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
