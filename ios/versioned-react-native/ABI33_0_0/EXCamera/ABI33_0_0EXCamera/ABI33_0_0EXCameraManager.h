#import <AVFoundation/AVFoundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMViewManager.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>
#import <ABI33_0_0EXCamera/ABI33_0_0EXCamera.h>

static const int ABI33_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraType) {
  ABI33_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI33_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraFlashMode) {
  ABI33_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI33_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI33_0_0EXCameraFlashModeTorch = ABI33_0_0EXFlashModeTorch,
  ABI33_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraVideoStabilizationMode) {
  ABI33_0_0EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  ABI33_0_0EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  ABI33_0_0EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  ABI33_0_0EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraAutoFocus) {
  ABI33_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI33_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraWhiteBalance) {
  ABI33_0_0EXCameraWhiteBalanceAuto = 0,
  ABI33_0_0EXCameraWhiteBalanceSunny = 1,
  ABI33_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI33_0_0EXCameraWhiteBalanceFlash = 3,
  ABI33_0_0EXCameraWhiteBalanceShadow = 4,
  ABI33_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI33_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraExposureMode) {
  ABI33_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI33_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI33_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraVideoResolution) {
  ABI33_0_0EXCameraVideo2160p = 0,
  ABI33_0_0EXCameraVideo1080p = 1,
  ABI33_0_0EXCameraVideo720p = 2,
  ABI33_0_0EXCameraVideo4x3 = 3,
};

@interface ABI33_0_0EXCameraManager : ABI33_0_0UMViewManager <ABI33_0_0UMModuleRegistryConsumer>

@end
