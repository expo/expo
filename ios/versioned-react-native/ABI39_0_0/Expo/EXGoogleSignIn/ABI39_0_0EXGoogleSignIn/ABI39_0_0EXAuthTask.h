// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistry.h>

static NSString *const ABI39_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS = @"ABI39_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const ABI39_0_0EX_E_EXCEPTION = @"ABI39_0_0EX_E_GOOGLE_SIGN_IN";

@interface ABI39_0_0EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
      rejecter:(ABI39_0_0UMPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
