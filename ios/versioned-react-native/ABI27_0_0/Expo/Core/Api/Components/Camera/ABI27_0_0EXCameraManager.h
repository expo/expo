#import <ReactABI27_0_0/ABI27_0_0RCTViewManager.h>
#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@class ABI27_0_0EXCamera;

static const int ABI27_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI27_0_0EXCameraType) {
  ABI27_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI27_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI27_0_0EXCameraFlashMode) {
  ABI27_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI27_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI27_0_0EXCameraFlashModeTorch = ABI27_0_0EXFlashModeTorch,
  ABI27_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI27_0_0EXCameraAutoFocus) {
  ABI27_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI27_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI27_0_0EXCameraWhiteBalance) {
  ABI27_0_0EXCameraWhiteBalanceAuto = 0,
  ABI27_0_0EXCameraWhiteBalanceSunny = 1,
  ABI27_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI27_0_0EXCameraWhiteBalanceFlash = 3,
  ABI27_0_0EXCameraWhiteBalanceShadow = 4,
  ABI27_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI27_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI27_0_0EXCameraExposureMode) {
  ABI27_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI27_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI27_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI27_0_0EXCameraVideoResolution) {
  ABI27_0_0EXCameraVideo2160p = 0,
  ABI27_0_0EXCameraVideo1080p = 1,
  ABI27_0_0EXCameraVideo720p = 2,
  ABI27_0_0EXCameraVideo4x3 = 3,
};

@interface ABI27_0_0EXCameraManager : ABI27_0_0RCTViewManager <ABI27_0_0RCTBridgeModule>

+ (NSDictionary *)validBarCodeTypes;

@end
