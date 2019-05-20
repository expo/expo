// Copyright 2018-present 650 Industries. All rights reserved.

#import <LocalAuthentication/LocalAuthentication.h>

#import <UMCore/UMUtilities.h>
#import <UMConstantsInterface/UMConstantsInterface.h>
#import <EXLocalAuthentication/EXLocalAuthentication.h>

typedef NS_ENUM(NSInteger, EXAuthenticationType) {
  EXAuthenticationTypeFingerprint = 1,
  EXAuthenticationTypeFacialRecognition = 2,
};

@implementation EXLocalAuthentication

UM_EXPORT_MODULE(ExpoLocalAuthentication)

UM_EXPORT_METHOD_AS(supportedAuthenticationTypesAsync,
                    supportedAuthenticationTypesAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSMutableArray *results = [NSMutableArray array];
  if ([[self class] isTouchIdDevice]) {
    [results addObject:@(EXAuthenticationTypeFingerprint)];
  }
  if ([[self class] isFaceIdDevice]) {
    [results addObject:@(EXAuthenticationTypeFacialRecognition)];
  }
  resolve(results);
}

UM_EXPORT_METHOD_AS(hasHardwareAsync,
                    hasHardwareAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL isAvailable;

  if (@available(iOS 11.0, *)) {
    isAvailable = isSupported || error.code != LAErrorBiometryNotAvailable;
  } else {
    isAvailable = isSupported || error.code != LAErrorTouchIDNotAvailable;
  }

  resolve(@(isAvailable));
}

UM_EXPORT_METHOD_AS(isEnrolledAsync,
                    isEnrolledAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL isEnrolled = isSupported && error == nil;

  resolve(@(isEnrolled));
}

UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateAsync:(NSString *)reason
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSString *warningMessage;

  if ([[self class] isFaceIdDevice]) {
    NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];

    if (!usageDescription) {
      warningMessage = @"FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`.";
    }
  }

  LAContext *context = [LAContext new];

  if (@available(iOS 11.0, *)) {
    context.interactionNotAllowed = false;
  }

  [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication
          localizedReason:reason
                    reply:^(BOOL success, NSError *error) {
                      resolve(@{
                                @"success": @(success),
                                @"error": error == nil ? [NSNull null] : [self convertErrorCode:error],
                                @"warning": UMNullIfNil(warningMessage),
                                });
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
      return [@"unknown: " stringByAppendingFormat:@"%ld, %@", (long) error.code, error.localizedDescription];
  }
}

+ (BOOL)isFaceIdDevice
{
  static BOOL isFaceIDDevice = NO;

  if (@available(iOS 11.0, *)) {
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
      LAContext *context = [LAContext new];
      [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:nil];
      isFaceIDDevice = context.biometryType == LABiometryTypeFaceID;
    });
  }

  return isFaceIDDevice;
}

+ (BOOL)isTouchIdDevice
{
  static BOOL isTouchIDDevice = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    LAContext *context = [LAContext new];
    [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:nil];
    if (@available(iOS 11.0, *)) {
      isTouchIDDevice = context.biometryType == LABiometryTypeTouchID;
    } else {
      isTouchIDDevice = true;
    }
  });

  return isTouchIDDevice;
}

@end
