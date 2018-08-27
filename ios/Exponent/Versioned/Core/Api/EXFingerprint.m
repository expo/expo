// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXFingerprint.h"
#import "EXModuleRegistryBinding.h"

#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTUtils.h>
#import <EXConstantsInterface/EXConstantsInterface.h>
#import <EXCore/EXUtilities.h>

static BOOL EXIsFaceIDDevice() {
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    RCTAssertMainQueue();

    isIPhoneX = CGSizeEqualToSize(
                                  [UIScreen mainScreen].nativeBounds.size,
                                  CGSizeMake(1125, 2436)
                                  );
  });

  return isIPhoneX;
}

@implementation EXFingerprint

RCT_EXPORT_MODULE(ExponentFingerprint)

RCT_EXPORT_METHOD(hasHardwareAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  if (!isSupported && error.code == LAErrorTouchIDNotAvailable) {
    resolve(@(NO));
  } else {
    resolve(@(YES));
  }
}

RCT_EXPORT_METHOD(isEnrolledAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  resolve(isSupported && !error ? @(YES) : @(NO));
}

RCT_EXPORT_METHOD(authenticateAsync:(NSString *)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  __block BOOL isFaceIdDevice;
  [EXUtilities performSynchronouslyOnMainThread:^{
    isFaceIdDevice = EXIsFaceIDDevice();
  }];
  if (isFaceIdDevice) {
    NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];
    if (!usageDescription) {
      id<EXConstantsInterface> constants = [self.bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
      NSString *errorMessage;
      if ([constants.appOwnership isEqualToString:@"expo"]) {
        errorMessage = @"FaceID is not available in Expo Client. You can use it in a standalone Expo app by providing `NSFaceIDUsageDescription`.";
      } else {
        errorMessage = @"FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`.";
      }
      reject(@"E_FACEID_NOT_CONFIGURED", errorMessage, RCTErrorWithMessage(errorMessage));
      return;
    }
  }
  LAContext *context = [LAContext new];
  if (@available(iOS 11.0, *)) {
    context.interactionNotAllowed = false;
  }
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication
          localizedReason:reason
                    reply:^(BOOL success, NSError *error) {
                      if (success) {
                        resolve(@{@"success": @(YES)});
                      } else {
                        resolve(@{
                          @"success": @(NO),
                          @"error": [self convertErrorCode:error],
                        });
                      }
                    }];


}

- (NSString *)convertErrorCode:(NSError *)error
{
  switch (error.code) {
    case LAErrorSystemCancel:
      return @"system_cancel";
    case LAErrorAppCancel:
      return @"app_cancel";
    case LAErrorTouchIDLockout:
      return @"lockout";
    case LAErrorUserFallback:
      return @"user_fallback";
    case LAErrorUserCancel:
      return @"user_cancel";
    case LAErrorTouchIDNotAvailable:
      return @"not_available";
    case LAErrorInvalidContext:
      return @"invalid_context";
    case LAErrorTouchIDNotEnrolled:
      return @"not_enrolled";
    case LAErrorPasscodeNotSet:
      return @"passcode_not_set";
    case LAErrorAuthenticationFailed:
      return @"authentication_failed";
    default:
      return [@"unknown: " stringByAppendingFormat:@"%ld, %@", error.code, error.localizedDescription];
  }
}

@end
