#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI38_0_0EXCamera/ABI38_0_0EXCameraManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistry.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleListener.h>
#import <ABI38_0_0UMCameraInterface/ABI38_0_0UMCameraInterface.h>

@class ABI38_0_0EXCameraManager;

static const int ABI38_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraType) {
  ABI38_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI38_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraFlashMode) {
  ABI38_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI38_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI38_0_0EXCameraFlashModeTorch = ABI38_0_0EXFlashModeTorch,
  ABI38_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraVideoStabilizationMode) {
  ABI38_0_0EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  ABI38_0_0EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  ABI38_0_0EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  ABI38_0_0EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraAutoFocus) {
  ABI38_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI38_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraWhiteBalance) {
  ABI38_0_0EXCameraWhiteBalanceAuto = 0,
  ABI38_0_0EXCameraWhiteBalanceSunny = 1,
  ABI38_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI38_0_0EXCameraWhiteBalanceFlash = 3,
  ABI38_0_0EXCameraWhiteBalanceShadow = 4,
  ABI38_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI38_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraExposureMode) {
  ABI38_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI38_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI38_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraVideoResolution) {
  ABI38_0_0EXCameraVideo2160p = 0,
  ABI38_0_0EXCameraVideo1080p = 1,
  ABI38_0_0EXCameraVideo720p = 2,
  ABI38_0_0EXCameraVideo4x3 = 3,
};

@interface ABI38_0_0EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, ABI38_0_0UMAppLifecycleListener, ABI38_0_0UMCameraInterface, AVCapturePhotoCaptureDelegate>

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCapturePhotoOutput *photoOutput;
@property (nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, assign) ABI38_0_0EXCameraFlashMode flashMode;
@property (nonatomic, assign) CGFloat zoom;
@property (nonatomic, assign) NSInteger autoFocus;
@property (nonatomic, assign) float focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (assign, nonatomic) AVCaptureSessionPreset pictureSize;
@property (nonatomic, assign) AVCaptureVideoStabilizationMode videoStabilizationMode;

@property (nonatomic, assign) BOOL isScanningBarCodes;
@property (nonatomic, assign) BOOL isDetectingFaces;

- (id)initWithModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updatePictureSize;
- (void)updateFaceDetectorSettings:(NSDictionary *)settings;
- (void)setBarCodeScannerSettings:(NSDictionary *)settings;
- (void)takePicture:(NSDictionary *)options resolve:(ABI38_0_0UMPromiseResolveBlock)resolve reject:(ABI38_0_0UMPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(ABI38_0_0UMPromiseResolveBlock)resolve reject:(ABI38_0_0UMPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)resumePreview;
- (void)pausePreview;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onPictureSaved:(NSDictionary *)event;

@end


