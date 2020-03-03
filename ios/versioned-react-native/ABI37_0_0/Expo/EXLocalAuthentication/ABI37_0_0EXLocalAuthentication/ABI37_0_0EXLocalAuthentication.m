// Copyright 2018-present 650 Industries. All rights reserved.

#import <LocalAuthentication/LocalAuthentication.h>

#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>
#import <ABI37_0_0UMConstantsInterface/ABI37_0_0UMConstantsInterface.h>
#import <ABI37_0_0EXLocalAuthentication/ABI37_0_0EXLocalAuthentication.h>

typedef NS_ENUM(NSInteger, ABI37_0_0EXAuthenticationType) {
  ABI37_0_0EXAuthenticationTypeFingerprint = 1,
  ABI37_0_0EXAuthenticationTypeFacialRecognition = 2,
};

@implementation ABI37_0_0EXLocalAuthentication

ABI37_0_0UM_EXPORT_MODULE(ExpoLocalAuthentication)

ABI37_0_0UM_EXPORT_METHOD_AS(supportedAuthenticationTypesAsync,
                    supportedAuthenticationTypesAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  NSMutableArray *results = [NSMutableArray array];
  if ([[self class] isTouchIdDevice]) {
    [results addObject:@(ABI37_0_0EXAuthenticationTypeFingerprint)];
  }
  if ([[self class] isFaceIdDevice]) {
    [results addObject:@(ABI37_0_0EXAuthenticationTypeFacialRecognition)];
  }
  resolve(results);
}

ABI37_0_0UM_EXPORT_METHOD_AS(hasHardwareAsync,
                    hasHardwareAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
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

ABI37_0_0UM_EXPORT_METHOD_AS(isEnrolledAsync,
                    isEnrolledAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL isEnrolled = isSupported && error == nil;

  resolve(@(isEnrolled));
}

ABI37_0_0UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  NSString *warningMessage;
  NSString *reason = options[@"promptMessage"];
  NSString *cancelLabel = options[@"cancelLabel"];
  NSString *fallbackLabel = options[@"fallbackLabel"];
  NSString *disableDeviceFallback = options[@"disableDeviceFallback"];

  if ([[self class] isFaceIdDevice]) {
    NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];

    if (!usageDescription) {
      warningMessage = @"FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`.";
    }
  }

  LAContext *context = [LAContext new];

  if (fallbackLabel != nil) {
    context.localizedFallbackTitle = fallbackLabel;
  }

  if (cancelLabel != nil) {
    context.localizedCancelTitle = cancelLabel;
  }

  if (@available(iOS 11.0, *)) {
    context.interactionNotAllowed = false;
  }

  if (disableDeviceFallback) {
    [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:reason
                    reply:^(BOOL success, NSError *error) {
                      resolve(@{
                                @"success": @(success),
                                @"error": error == nil ? [NSNull null] : [self convertErrorCode:error],
                                @"warning": ABI37_0_0UMNullIfNil(warningMessage),
                                });
                    }];
  } else {
    [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication
          localizedReason:reason
                    reply:^(BOOL success, NSError *error) {
                      resolve(@{
                                @"success": @(success),
                                @"error": error == nil ? [NSNull null] : [self convertErrorCode:error],
                                @"warning": ABI37_0_0UMNullIfNil(warningMessage),
                                });
                    }];
  }

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
