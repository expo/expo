#import <AVFoundation/AVFoundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXViewManager.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>
#import <ABI31_0_0EXCamera/ABI31_0_0EXCamera.h>

static const int ABI31_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraType) {
  ABI31_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI31_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraFlashMode) {
  ABI31_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI31_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI31_0_0EXCameraFlashModeTorch = ABI31_0_0EXFlashModeTorch,
  ABI31_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraVideoStabilizationMode) {
  ABI31_0_0EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  ABI31_0_0EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  ABI31_0_0EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  ABI31_0_0EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraAutoFocus) {
  ABI31_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI31_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraWhiteBalance) {
  ABI31_0_0EXCameraWhiteBalanceAuto = 0,
  ABI31_0_0EXCameraWhiteBalanceSunny = 1,
  ABI31_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI31_0_0EXCameraWhiteBalanceFlash = 3,
  ABI31_0_0EXCameraWhiteBalanceShadow = 4,
  ABI31_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI31_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraExposureMode) {
  ABI31_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI31_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI31_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraVideoResolution) {
  ABI31_0_0EXCameraVideo2160p = 0,
  ABI31_0_0EXCameraVideo1080p = 1,
  ABI31_0_0EXCameraVideo720p = 2,
  ABI31_0_0EXCameraVideo4x3 = 3,
};

@interface ABI31_0_0EXCameraManager : ABI31_0_0EXViewManager <ABI31_0_0EXModuleRegistryConsumer>

@end
