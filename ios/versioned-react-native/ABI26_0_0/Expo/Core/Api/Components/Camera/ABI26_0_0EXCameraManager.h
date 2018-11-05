#import <ReactABI26_0_0/ABI26_0_0RCTViewManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@class ABI26_0_0EXCamera;

static const int ABI26_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI26_0_0EXCameraType) {
  ABI26_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI26_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI26_0_0EXCameraFlashMode) {
  ABI26_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI26_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI26_0_0EXCameraFlashModeTorch = ABI26_0_0EXFlashModeTorch,
  ABI26_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI26_0_0EXCameraAutoFocus) {
  ABI26_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI26_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI26_0_0EXCameraWhiteBalance) {
  ABI26_0_0EXCameraWhiteBalanceAuto = 0,
  ABI26_0_0EXCameraWhiteBalanceSunny = 1,
  ABI26_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI26_0_0EXCameraWhiteBalanceFlash = 3,
  ABI26_0_0EXCameraWhiteBalanceShadow = 4,
  ABI26_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI26_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI26_0_0EXCameraExposureMode) {
  ABI26_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI26_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI26_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI26_0_0EXCameraVideoResolution) {
  ABI26_0_0EXCameraVideo2160p = 0,
  ABI26_0_0EXCameraVideo1080p = 1,
  ABI26_0_0EXCameraVideo720p = 2,
  ABI26_0_0EXCameraVideo4x3 = 3,
};

@interface ABI26_0_0EXCameraManager : ABI26_0_0RCTViewManager <ABI26_0_0RCTBridgeModule>

+ (NSDictionary *)validBarCodeTypes;

@end
