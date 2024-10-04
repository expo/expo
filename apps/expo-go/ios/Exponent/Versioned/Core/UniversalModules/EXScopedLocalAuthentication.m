// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXLocalAuthentication/EXLocalAuthentication.h>)
#import <LocalAuthentication/LocalAuthentication.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <ExpoModulesCore/EXConstantsInterface.h>

#import "EXScopedLocalAuthentication.h"
#import "EXConstantsBinding.h"

@interface EXScopedLocalAuthentication ()

@property (nonatomic, assign) BOOL isInExpoClient;

@end

@implementation EXScopedLocalAuthentication

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _isInExpoClient = [((EXConstantsBinding *)[moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)]).appOwnership isEqualToString:@"expo"];
}

EX_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
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
