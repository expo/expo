#import <ReactABI24_0_0/ABI24_0_0RCTViewManager.h>
#import <ReactABI24_0_0/ABI24_0_0RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

#if __has_include("ABI24_0_0EXFaceDetectorManager.h")
#import "ABI24_0_0EXFaceDetectorManager.h"
#else
#import "ABI24_0_0EXFaceDetectorManagerStub.h"
#endif

@class ABI24_0_0EXCamera;

static const int ABI24_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI24_0_0EXCameraType) {
  ABI24_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI24_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI24_0_0EXCameraFlashMode) {
  ABI24_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI24_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI24_0_0EXCameraFlashModeTorch = ABI24_0_0EXFlashModeTorch,
  ABI24_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI24_0_0EXCameraAutoFocus) {
  ABI24_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI24_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI24_0_0EXCameraWhiteBalance) {
  ABI24_0_0EXCameraWhiteBalanceAuto = 0,
  ABI24_0_0EXCameraWhiteBalanceSunny = 1,
  ABI24_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI24_0_0EXCameraWhiteBalanceFlash = 3,
  ABI24_0_0EXCameraWhiteBalanceShadow = 4,
  ABI24_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI24_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI24_0_0EXCameraExposureMode) {
  ABI24_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI24_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI24_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI24_0_0EXCameraVideoResolution) {
  ABI24_0_0EXCameraVideo2160p = 0,
  ABI24_0_0EXCameraVideo1080p = 1,
  ABI24_0_0EXCameraVideo720p = 2,
  ABI24_0_0EXCameraVideo4x3 = 3,
};

@interface ABI24_0_0EXCameraManager : ABI24_0_0RCTViewManager <ABI24_0_0RCTBridgeModule, AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, ABI24_0_0EXFaceDetectorDelegate>

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
@property(nonatomic, strong) ABI24_0_0EXCamera *camera;

- (void)initializeCaptureSessionInput:(NSString *)type;
- (void)startSession;
- (void)stopSession;

- (void)onFacesDetected:(NSArray<NSDictionary *> *)faces;

@end
