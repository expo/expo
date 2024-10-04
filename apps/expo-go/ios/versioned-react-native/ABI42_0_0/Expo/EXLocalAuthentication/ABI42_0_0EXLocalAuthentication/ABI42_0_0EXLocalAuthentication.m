// Copyright 2018-present 650 Industries. All rights reserved.

#import <LocalAuthentication/LocalAuthentication.h>

#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0EXLocalAuthentication/ABI42_0_0EXLocalAuthentication.h>

typedef NS_ENUM(NSInteger, ABI42_0_0EXAuthenticationType) {
  ABI42_0_0EXAuthenticationTypeFingerprint = 1,
  ABI42_0_0EXAuthenticationTypeFacialRecognition = 2,
};

typedef NS_ENUM(NSInteger, ABI42_0_0EXSecurityLevel) {
  ABI42_0_0EXSecurityLevelNone = 0,
  ABI42_0_0EXSecurityLevelSecret = 1,
  ABI42_0_0EXSecurityLevelBiometric = 2,
};

@implementation ABI42_0_0EXLocalAuthentication

ABI42_0_0UM_EXPORT_MODULE(ExpoLocalAuthentication)

ABI42_0_0UM_EXPORT_METHOD_AS(supportedAuthenticationTypesAsync,
                    supportedAuthenticationTypesAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  NSMutableArray *results = [NSMutableArray array];
  if ([[self class] isTouchIdDevice]) {
    [results addObject:@(ABI42_0_0EXAuthenticationTypeFingerprint)];
  }
  if ([[self class] isFaceIdDevice]) {
    [results addObject:@(ABI42_0_0EXAuthenticationTypeFacialRecognition)];
  }
  resolve(results);
}

ABI42_0_0UM_EXPORT_METHOD_AS(hasHardwareAsync,
                    hasHardwareAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL isAvailable;

  if (@available(iOS 11.0.1, *)) {
    isAvailable = isSupported || error.code != LAErrorBiometryNotAvailable;
  } else {
    isAvailable = isSupported || error.code != LAErrorTouchIDNotAvailable;
  }

  resolve(@(isAvailable));
}

ABI42_0_0UM_EXPORT_METHOD_AS(isEnrolledAsync,
                    isEnrolledAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL isEnrolled = isSupported && error == nil;

  resolve(@(isEnrolled));
}

ABI42_0_0UM_EXPORT_METHOD_AS(getEnrolledLevelAsync,
                    getEnrolledLevelAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  int level = ABI42_0_0EXSecurityLevelNone;
  
  BOOL isAuthenticationSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:&error];
  if (isAuthenticationSupported && error == nil) {
    level = ABI42_0_0EXSecurityLevelSecret;
  }
  BOOL isBiometricsSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  if (isBiometricsSupported && error == nil) {
    level = ABI42_0_0EXSecurityLevelBiometric;
  }

  resolve(@(level));
}

ABI42_0_0UM_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateWithOptions:(NSDictionary *)options
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
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

  if ([disableDeviceFallback boolValue]) {
    if (warningMessage) {
      // If the warning message is set (NSFaceIDUsageDescription is not configured) then we can't use
      // authentication with biometrics — it would crash, so let's just resolve with no success.
      // We could reject, but we already resolve even if there are any errors, so sadly we would need to introduce a breaking change.
      return resolve(@{
        @"success": @NO,
        @"error": @"missing_usage_description",
        @"warning": warningMessage
      });
    }
    [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:reason
                    reply:^(BOOL success, NSError *error) {
                      resolve(@{
                                @"success": @(success),
                                @"error": error == nil ? [NSNull null] : [self convertErrorCode:error],
                                @"warning": ABI42_0_0UMNullIfNil(warningMessage),
                                });
                    }];
  } else {
    [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication
          localizedReason:reason
                    reply:^(BOOL success, NSError *error) {
                      resolve(@{
                                @"success": @(success),
                                @"error": error == nil ? [NSNull null] : [self convertErrorCode:error],
                                @"warning": ABI42_0_0UMNullIfNil(warningMessage),
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

  if (@available(iOS 11.0.1, *)) {
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
    if (@available(iOS 11.0.1, *)) {
      isTouchIDDevice = context.biometryType == LABiometryTypeTouchID;
    } else {
      isTouchIDDevice = true;
    }
  });

  return isTouchIDDevice;
}

@end
