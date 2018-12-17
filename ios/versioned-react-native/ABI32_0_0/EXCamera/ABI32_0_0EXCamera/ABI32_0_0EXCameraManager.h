#import <AVFoundation/AVFoundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXViewManager.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>
#import <ABI32_0_0EXCamera/ABI32_0_0EXCamera.h>

static const int ABI32_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraType) {
  ABI32_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI32_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraFlashMode) {
  ABI32_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI32_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI32_0_0EXCameraFlashModeTorch = ABI32_0_0EXFlashModeTorch,
  ABI32_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraVideoStabilizationMode) {
  ABI32_0_0EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  ABI32_0_0EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  ABI32_0_0EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  ABI32_0_0EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraAutoFocus) {
  ABI32_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI32_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraWhiteBalance) {
  ABI32_0_0EXCameraWhiteBalanceAuto = 0,
  ABI32_0_0EXCameraWhiteBalanceSunny = 1,
  ABI32_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI32_0_0EXCameraWhiteBalanceFlash = 3,
  ABI32_0_0EXCameraWhiteBalanceShadow = 4,
  ABI32_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI32_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraExposureMode) {
  ABI32_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI32_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI32_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraVideoResolution) {
  ABI32_0_0EXCameraVideo2160p = 0,
  ABI32_0_0EXCameraVideo1080p = 1,
  ABI32_0_0EXCameraVideo720p = 2,
  ABI32_0_0EXCameraVideo4x3 = 3,
};

@interface ABI32_0_0EXCameraManager : ABI32_0_0EXViewManager <ABI32_0_0EXModuleRegistryConsumer>

@end
