// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXFingerprint.h"
#import "ABI29_0_0EXModuleRegistryBinding.h"

#import <LocalAuthentication/LocalAuthentication.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUtils.h>
#import <ABI29_0_0EXConstantsInterface/ABI29_0_0EXConstantsInterface.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXUtilities.h>

static BOOL ABI29_0_0EXIsFaceIDDevice() {
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    ABI29_0_0RCTAssertMainQueue();

    isIPhoneX = CGSizeEqualToSize(
                                  [UIScreen mainScreen].nativeBounds.size,
                                  CGSizeMake(1125, 2436)
                                  );
  });

  return isIPhoneX;
}

@implementation ABI29_0_0EXFingerprint

ABI29_0_0RCT_EXPORT_MODULE(ExponentFingerprint)

ABI29_0_0RCT_EXPORT_METHOD(hasHardwareAsync:(ABI29_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
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

ABI29_0_0RCT_EXPORT_METHOD(isEnrolledAsync:(ABI29_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  resolve(isSupported && !error ? @(YES) : @(NO));
}

ABI29_0_0RCT_EXPORT_METHOD(authenticateAsync:(NSString *)reason
                  resolve:(ABI29_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  __block BOOL isFaceIdDevice;
  [ABI29_0_0EXUtilities performSynchronouslyOnMainThread:^{
    isFaceIdDevice = ABI29_0_0EXIsFaceIDDevice();
  }];
  if (isFaceIdDevice) {
    NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];
    if (!usageDescription) {
      id<ABI29_0_0EXConstantsInterface> constants = [self.bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(ABI29_0_0EXConstantsInterface)];
      NSString *errorMessage;
      if ([constants.appOwnership isEqualToString:@"expo"]) {
        errorMessage = @"FaceID is not available in Expo Client. You can use it in a standalone Expo app by providing `NSFaceIDUsageDescription`.";
      } else {
        errorMessage = @"FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`.";
      }
      reject(@"E_FACEID_NOT_CONFIGURED", errorMessage, ABI29_0_0RCTErrorWithMessage(errorMessage));
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
