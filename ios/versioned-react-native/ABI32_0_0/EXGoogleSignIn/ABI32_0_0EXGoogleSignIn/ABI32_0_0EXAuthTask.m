// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXGoogleSignIn/ABI32_0_0EXAuthTask.h>
#import <ABI32_0_0EXGoogleSignIn/ABI32_0_0EXGoogleSignIn+Serialization.h>

@interface ABI32_0_0EXAuthTask ()

@property (nonatomic, strong) ABI32_0_0EXPromiseResolveBlock resolver;
@property (nonatomic, strong) ABI32_0_0EXPromiseRejectBlock rejecter;
@property (nonatomic, strong) NSString *tag;

@end

@implementation ABI32_0_0EXAuthTask

- (BOOL)update:(NSString *)tag
      resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
      rejecter:(ABI32_0_0EXPromiseRejectBlock)reject
{
  if (!_resolver) {
    _tag = tag;
    _resolver = resolve;
    _rejecter = reject;
    return YES;
  } else {
    reject(ABI32_0_0EX_E_CONCURRENT_TASK_IN_PROGRESS, [NSString stringWithFormat:@"Failed to start %@ as a concurrent GoogleSignIn task is already running", tag], nil);
    return NO;
  }
}

- (void)resolve:(id)result
{
  if (!_resolver) return;
  _resolver(result);
  [self _clear];
}

- (void)reject:(NSString *)message error:(NSError *)error
{
  if (!_resolver) return;
  NSString *errorCode = [NSString stringWithFormat:@"%ld", (long) error.code];
  NSString *errorMessage = [NSString stringWithFormat:@"GoogleSignIn.%@: %@, %@, %@, %@", _tag, message, error.localizedDescription, error.localizedFailureReason, error.localizedRecoverySuggestion];
  _rejecter(errorCode, errorMessage, error);
  
  [self _clear];
}

- (void)parse:(NSDictionary *)user error:(NSError *)error
{
  if (error) {
    // Override this rejection to create parity with FBSDK
    [self reject:[ABI32_0_0EXGoogleSignIn jsonFromGIDSignInErrorCode:error.code] error:error];
  } else {
    [self resolve:ABI32_0_0EXNullIfNil(user)];
  }
}

- (void)_clear
{
  _resolver = nil;
  _rejecter = nil;
  _tag = nil;
}

@end
