// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXGoogleSignIn/EXAuthTask.h>
#import <EXGoogleSignIn/EXGoogleSignIn+Serialization.h>

@interface EXAuthTask ()

@property (nonatomic, strong) EXPromiseResolveBlock resolver;
@property (nonatomic, strong) EXPromiseRejectBlock rejecter;
@property (nonatomic, strong) NSString *tag;

@end

@implementation EXAuthTask

- (BOOL)update:(NSString *)tag
      resolver:(EXPromiseResolveBlock)resolve
      rejecter:(EXPromiseRejectBlock)reject
{
  if (!_resolver) {
    _tag = tag;
    _resolver = resolve;
    _rejecter = reject;
    return YES;
  } else {
    reject(EX_E_CONCURRENT_TASK_IN_PROGRESS, [NSString stringWithFormat:@"Failed to start %@ as a concurrent GoogleSignIn task is already running", tag], nil);
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
    [self reject:[EXGoogleSignIn jsonFromGIDSignInErrorCode:error.code] error:error];
  } else {
    [self resolve:EXNullIfNil(user)];
  }
}

- (void)_clear
{
  _resolver = nil;
  _rejecter = nil;
  _tag = nil;
}

@end
