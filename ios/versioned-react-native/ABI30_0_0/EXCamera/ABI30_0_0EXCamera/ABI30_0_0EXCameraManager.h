#import <AVFoundation/AVFoundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXViewManager.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <ABI30_0_0EXCamera/ABI30_0_0EXCamera.h>

static const int ABI30_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraType) {
  ABI30_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI30_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraFlashMode) {
  ABI30_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI30_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI30_0_0EXCameraFlashModeTorch = ABI30_0_0EXFlashModeTorch,
  ABI30_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraAutoFocus) {
  ABI30_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI30_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraWhiteBalance) {
  ABI30_0_0EXCameraWhiteBalanceAuto = 0,
  ABI30_0_0EXCameraWhiteBalanceSunny = 1,
  ABI30_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI30_0_0EXCameraWhiteBalanceFlash = 3,
  ABI30_0_0EXCameraWhiteBalanceShadow = 4,
  ABI30_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI30_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraExposureMode) {
  ABI30_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI30_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI30_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraVideoResolution) {
  ABI30_0_0EXCameraVideo2160p = 0,
  ABI30_0_0EXCameraVideo1080p = 1,
  ABI30_0_0EXCameraVideo720p = 2,
  ABI30_0_0EXCameraVideo4x3 = 3,
};

@interface ABI30_0_0EXCameraManager : ABI30_0_0EXViewManager <ABI30_0_0EXModuleRegistryConsumer>

@end
