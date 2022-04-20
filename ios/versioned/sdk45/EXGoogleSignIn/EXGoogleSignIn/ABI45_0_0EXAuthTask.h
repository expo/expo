// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>

static NSString *const ABI45_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS = @"ABI45_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const ABI45_0_0EX_E_EXCEPTION = @"ABI45_0_0EX_E_GOOGLE_SIGN_IN";

@interface ABI45_0_0EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
      rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
