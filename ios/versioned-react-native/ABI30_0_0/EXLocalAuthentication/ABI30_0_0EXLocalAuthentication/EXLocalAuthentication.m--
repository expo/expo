// Copyright 2018-present 650 Industries. All rights reserved.

#import <LocalAuthentication/LocalAuthentication.h>

#import <ABI30_0_0EXCore/ABI30_0_0EXUtilities.h>
#import <ABI30_0_0EXConstantsInterface/ABI30_0_0EXConstantsInterface.h>
#import <ABI30_0_0EXLocalAuthentication/ABI30_0_0EXLocalAuthentication.h>

@interface ABI30_0_0EXLocalAuthentication ()

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI30_0_0EXLocalAuthentication

ABI30_0_0EX_EXPORT_MODULE(ExpoLocalAuthentication)

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI30_0_0EX_EXPORT_METHOD_AS(hasHardwareAsync,
                    hasHardwareAsync:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject)
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

ABI30_0_0EX_EXPORT_METHOD_AS(isEnrolledAsync,
                    isEnrolledAsync:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  NSError *error = nil;

  BOOL isSupported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL isEnrolled = isSupported && error == nil;

  resolve(@(isEnrolled));
}

ABI30_0_0EX_EXPORT_METHOD_AS(authenticateAsync,
                    authenticateAsync:(NSString *)reason
                    resolve:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSString *warningMessage;

  if (ABI30_0_0EXIsFaceIDDevice()) {
    NSString *usageDescription = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"NSFaceIDUsageDescription"];

    if (!usageDescription) {
      id<ABI30_0_0EXConstantsInterface> constants = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXConstantsInterface)];

      // it works fine if there is no module implementing `expo-constants-interface` because in that case we know it isn't Expo Client
      if ([constants.appOwnership isEqualToString:@"expo"]) {
        warningMessage = @"FaceID is not available in Expo Client. You can use it in a standalone Expo app by providing `NSFaceIDUsageDescription`.";
      } else {
        warningMessage = @"FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`.";
      }
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
                                @"warning": ABI30_0_0EXNullIfNil(warningMessage),
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
      return [@"unknown: " stringByAppendingFormat:@"%ld, %@", error.code, error.localizedDescription];
  }
}

static BOOL ABI30_0_0EXIsFaceIDDevice()
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

@end
