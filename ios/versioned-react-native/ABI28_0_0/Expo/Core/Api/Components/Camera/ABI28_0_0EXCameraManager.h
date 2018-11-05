#import <ReactABI28_0_0/ABI28_0_0RCTViewManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@class ABI28_0_0EXCamera;

static const int ABI28_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI28_0_0EXCameraType) {
  ABI28_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI28_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI28_0_0EXCameraFlashMode) {
  ABI28_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI28_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI28_0_0EXCameraFlashModeTorch = ABI28_0_0EXFlashModeTorch,
  ABI28_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI28_0_0EXCameraAutoFocus) {
  ABI28_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI28_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI28_0_0EXCameraWhiteBalance) {
  ABI28_0_0EXCameraWhiteBalanceAuto = 0,
  ABI28_0_0EXCameraWhiteBalanceSunny = 1,
  ABI28_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI28_0_0EXCameraWhiteBalanceFlash = 3,
  ABI28_0_0EXCameraWhiteBalanceShadow = 4,
  ABI28_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI28_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI28_0_0EXCameraExposureMode) {
  ABI28_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI28_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI28_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI28_0_0EXCameraVideoResolution) {
  ABI28_0_0EXCameraVideo2160p = 0,
  ABI28_0_0EXCameraVideo1080p = 1,
  ABI28_0_0EXCameraVideo720p = 2,
  ABI28_0_0EXCameraVideo4x3 = 3,
};

@interface ABI28_0_0EXCameraManager : ABI28_0_0RCTViewManager <ABI28_0_0RCTBridgeModule>

+ (NSDictionary *)validBarCodeTypes;

@end
