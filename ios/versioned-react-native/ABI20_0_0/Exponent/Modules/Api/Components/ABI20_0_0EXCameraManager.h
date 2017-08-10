#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@class ABI20_0_0EXCamera;

static const int ABI20_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI20_0_0EXCameraType) {
  ABI20_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI20_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI20_0_0EXCameraFlashMode) {
  ABI20_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI20_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI20_0_0EXCameraFlashModeTorch = ABI20_0_0EXFlashModeTorch,
  ABI20_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI20_0_0EXCameraAutoFocus) {
  ABI20_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI20_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI20_0_0EXCameraWhiteBalance) {
  ABI20_0_0EXCameraWhiteBalanceAuto = 0,
  ABI20_0_0EXCameraWhiteBalanceSunny = 1,
  ABI20_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI20_0_0EXCameraWhiteBalanceFlash = 3,
  ABI20_0_0EXCameraWhiteBalanceShadow = 4,
  ABI20_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI20_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI20_0_0EXCameraExposureMode) {
  ABI20_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI20_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI20_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

@interface ABI20_0_0EXCameraManager
: ABI20_0_0RCTViewManager <ABI20_0_0RCTBridgeModule, AVCaptureMetadataOutputObjectsDelegate>

@property(nonatomic, strong) dispatch_queue_t sessionQueue;
@property(nonatomic, strong) AVCaptureSession *session;
@property(nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property(nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property(nonatomic, strong) id runtimeErrorHandlingObserver;
@property(nonatomic, assign) NSInteger presetCamera;
@property(nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property(nonatomic, strong) ABI20_0_0EXCamera *camera;

- (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position;
- (void)initializeCaptureSessionInput:(NSString *)type;
- (void)startSession;
- (void)stopSession;

@end
