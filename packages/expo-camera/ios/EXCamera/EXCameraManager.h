#import <AVFoundation/AVFoundation.h>
#import <UMCore/UMViewManager.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <EXCamera/EXCamera.h>

static const int EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, EXCameraType) {
  EXCameraTypeFront = AVCaptureDevicePositionFront,
  EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, EXCameraFlashMode) {
  EXCameraFlashModeOff = AVCaptureFlashModeOff,
  EXCameraFlashModeOn = AVCaptureFlashModeOn,
  EXCameraFlashModeTorch = EXFlashModeTorch,
  EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, EXCameraVideoStabilizationMode) {
  EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, EXCameraAutoFocus) {
  EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, EXCameraWhiteBalance) {
  EXCameraWhiteBalanceAuto = 0,
  EXCameraWhiteBalanceSunny = 1,
  EXCameraWhiteBalanceCloudy = 2,
  EXCameraWhiteBalanceFlash = 3,
  EXCameraWhiteBalanceShadow = 4,
  EXCameraWhiteBalanceIncandescent = 5,
  EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, EXCameraExposureMode) {
  EXCameraExposureLocked = AVCaptureExposureModeLocked,
  EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, EXCameraVideoResolution) {
  EXCameraVideo2160p = 0,
  EXCameraVideo1080p = 1,
  EXCameraVideo720p = 2,
  EXCameraVideo4x3 = 3,
};

@interface EXCameraManager : UMViewManager <UMModuleRegistryConsumer>

@end
