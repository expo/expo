#import <ReactABI23_0_0/ABI23_0_0RCTViewManager.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@class ABI23_0_0EXCamera;

static const int ABI23_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI23_0_0EXCameraType) {
  ABI23_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI23_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI23_0_0EXCameraFlashMode) {
  ABI23_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI23_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI23_0_0EXCameraFlashModeTorch = ABI23_0_0EXFlashModeTorch,
  ABI23_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI23_0_0EXCameraAutoFocus) {
  ABI23_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI23_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI23_0_0EXCameraWhiteBalance) {
  ABI23_0_0EXCameraWhiteBalanceAuto = 0,
  ABI23_0_0EXCameraWhiteBalanceSunny = 1,
  ABI23_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI23_0_0EXCameraWhiteBalanceFlash = 3,
  ABI23_0_0EXCameraWhiteBalanceShadow = 4,
  ABI23_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI23_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI23_0_0EXCameraExposureMode) {
  ABI23_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI23_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI23_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI23_0_0EXCameraVideoResolution) {
  ABI23_0_0EXCameraVideo2160p = 0,
  ABI23_0_0EXCameraVideo1080p = 1,
  ABI23_0_0EXCameraVideo720p = 2,
  ABI23_0_0EXCameraVideo4x3 = 3,
};

@interface ABI23_0_0EXCameraManager
: ABI23_0_0RCTViewManager <ABI23_0_0RCTBridgeModule, AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate>

@property(nonatomic, strong) dispatch_queue_t sessionQueue;
@property(nonatomic, strong) AVCaptureSession *session;
@property(nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property(nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property(nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property(nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property(nonatomic, strong) id runtimeErrorHandlingObserver;
@property(nonatomic, assign) NSInteger presetCamera;
@property(nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property(nonatomic, strong) NSArray *barCodeTypes;
@property(nonatomic, strong) ABI23_0_0EXCamera *camera;

- (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position;
- (void)initializeCaptureSessionInput:(NSString *)type;
- (void)startSession;
- (void)stopSession;

@end
