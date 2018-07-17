#import <AVFoundation/AVFoundation.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXViewManager.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXExportedModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>
#import <ABI29_0_0EXCamera/ABI29_0_0EXCamera.h>

static const int ABI29_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI29_0_0EXCameraType) {
  ABI29_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI29_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI29_0_0EXCameraFlashMode) {
  ABI29_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI29_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI29_0_0EXCameraFlashModeTorch = ABI29_0_0EXFlashModeTorch,
  ABI29_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI29_0_0EXCameraAutoFocus) {
  ABI29_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI29_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI29_0_0EXCameraWhiteBalance) {
  ABI29_0_0EXCameraWhiteBalanceAuto = 0,
  ABI29_0_0EXCameraWhiteBalanceSunny = 1,
  ABI29_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI29_0_0EXCameraWhiteBalanceFlash = 3,
  ABI29_0_0EXCameraWhiteBalanceShadow = 4,
  ABI29_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI29_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI29_0_0EXCameraExposureMode) {
  ABI29_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI29_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI29_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI29_0_0EXCameraVideoResolution) {
  ABI29_0_0EXCameraVideo2160p = 0,
  ABI29_0_0EXCameraVideo1080p = 1,
  ABI29_0_0EXCameraVideo720p = 2,
  ABI29_0_0EXCameraVideo4x3 = 3,
};

@interface ABI29_0_0EXCameraManager : ABI29_0_0EXViewManager <ABI29_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)validBarCodeTypes;

@end

