// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>

static NSString *const ABI32_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS = @"ABI32_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const ABI32_0_0EX_E_EXCEPTION = @"ABI32_0_0EX_E_GOOGLE_SIGN_IN";

@interface ABI32_0_0EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
      rejecter:(ABI32_0_0EXPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
