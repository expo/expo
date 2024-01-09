// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXLocalAuthentication/EXLocalAuthentication.h>)
#import <LocalAuthentication/LocalAuthentication.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <ExpoModulesCore/EXConstantsInterface.h>

#import "EXScopedLocalAuthentication.h"
#import "EXConstantsBinding.h"

@interface EXScopedLocalAuthentication ()

@end

@implementation EXScopedLocalAuthentication

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
}

EX_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [super authenticateWithOptions:options resolve:^(NSDictionary *result) {
    if ([[self class] isFaceIdDevice]) {
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
