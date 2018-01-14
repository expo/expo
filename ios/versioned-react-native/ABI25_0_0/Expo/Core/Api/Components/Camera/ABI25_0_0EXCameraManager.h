#import <ReactABI25_0_0/ABI25_0_0RCTViewManager.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@class ABI25_0_0EXCamera;

static const int ABI25_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI25_0_0EXCameraType) {
  ABI25_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI25_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI25_0_0EXCameraFlashMode) {
  ABI25_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI25_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI25_0_0EXCameraFlashModeTorch = ABI25_0_0EXFlashModeTorch,
  ABI25_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI25_0_0EXCameraAutoFocus) {
  ABI25_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI25_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI25_0_0EXCameraWhiteBalance) {
  ABI25_0_0EXCameraWhiteBalanceAuto = 0,
  ABI25_0_0EXCameraWhiteBalanceSunny = 1,
  ABI25_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI25_0_0EXCameraWhiteBalanceFlash = 3,
  ABI25_0_0EXCameraWhiteBalanceShadow = 4,
  ABI25_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI25_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI25_0_0EXCameraExposureMode) {
  ABI25_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI25_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI25_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI25_0_0EXCameraVideoResolution) {
  ABI25_0_0EXCameraVideo2160p = 0,
  ABI25_0_0EXCameraVideo1080p = 1,
  ABI25_0_0EXCameraVideo720p = 2,
  ABI25_0_0EXCameraVideo4x3 = 3,
};

@interface ABI25_0_0EXCameraManager : ABI25_0_0RCTViewManager <ABI25_0_0RCTBridgeModule>

+ (NSDictionary *)validBarCodeTypes;

@end
