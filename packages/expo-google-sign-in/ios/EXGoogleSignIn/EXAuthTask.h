// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

static NSString *const EX_E_CONCURRENT_TASK_IN_PROGRESS = @"EX_E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const EX_E_EXCEPTION = @"EX_E_GOOGLE_SIGN_IN";

@interface EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(EXPromiseResolveBlock)resolve
      rejecter:(EXPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
