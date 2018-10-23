//
//  EXAuthTask.h
//  EXGoogleSignIn
//
//  Created by Evan Bacon on 10/19/18.
//

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>

static NSString *const E_CONCURRENT_TASK_IN_PROGRESS = @"E_CONCURRENT_TASK_IN_PROGRESS";
static NSString *const E_EXCEPTION = @"E_GOOGLE_SIGN_IN";

@interface EXAuthTask : NSObject
- (BOOL)update:(NSString *)tag
      resolver:(EXPromiseResolveBlock)resolve
      rejecter:(EXPromiseRejectBlock)reject;
- (void)parse:(NSDictionary *)user error:(NSError *)error;
@end
