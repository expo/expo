// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>

static NSString *const ABI41_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS = @"ABI41_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const ABI41_0_0EX_E_EXCEPTION = @"ABI41_0_0EX_E_GOOGLE_SIGN_IN";

@interface ABI41_0_0EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
      rejecter:(ABI41_0_0UMPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
