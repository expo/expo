// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXLocalAuthentication/EXLocalAuthentication.h>)
#import "EXScopedLocalAuthentication.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <UMCore/UMUtilities.h>
#import "EXConstantsBinding.h"
#import <UMConstantsInterface/UMConstantsInterface.h>

@interface EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation EXScopedLocalAuthentication

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(UMConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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
