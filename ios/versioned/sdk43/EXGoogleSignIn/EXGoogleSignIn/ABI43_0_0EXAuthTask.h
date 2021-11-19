// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>

static NSString *const ABI43_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS = @"ABI43_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const ABI43_0_0EX_E_EXCEPTION = @"ABI43_0_0EX_E_GOOGLE_SIGN_IN";

@interface ABI43_0_0EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
      rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
