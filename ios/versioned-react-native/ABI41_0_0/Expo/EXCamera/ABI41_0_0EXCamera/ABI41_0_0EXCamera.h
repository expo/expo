#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI41_0_0EXCamera/ABI41_0_0EXCameraManager.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleListener.h>
#import <ABI41_0_0UMCameraInterface/ABI41_0_0UMCameraInterface.h>

@class ABI41_0_0EXCameraManager;

static const int ABI41_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraType) {
  ABI41_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI41_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraFlashMode) {
  ABI41_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI41_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI41_0_0EXCameraFlashModeTorch = ABI41_0_0EXFlashModeTorch,
  ABI41_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraVideoStabilizationMode) {
  ABI41_0_0EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  ABI41_0_0EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  ABI41_0_0EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  ABI41_0_0EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraAutoFocus) {
  ABI41_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI41_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraWhiteBalance) {
  ABI41_0_0EXCameraWhiteBalanceAuto = 0,
  ABI41_0_0EXCameraWhiteBalanceSunny = 1,
  ABI41_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI41_0_0EXCameraWhiteBalanceFlash = 3,
  ABI41_0_0EXCameraWhiteBalanceShadow = 4,
  ABI41_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI41_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraExposureMode) {
  ABI41_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI41_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI41_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraVideoResolution) {
  ABI41_0_0EXCameraVideo2160p = 0,
  ABI41_0_0EXCameraVideo1080p = 1,
  ABI41_0_0EXCameraVideo720p = 2,
  ABI41_0_0EXCameraVideo4x3 = 3,
};

@interface ABI41_0_0EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, ABI41_0_0UMAppLifecycleListener, ABI41_0_0UMCameraInterface, AVCapturePhotoCaptureDelegate>

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCapturePhotoOutput *photoOutput;
@property (nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, assign) ABI41_0_0EXCameraFlashMode flashMode;
@property (nonatomic, assign) CGFloat zoom;
@property (nonatomic, assign) NSInteger autoFocus;
@property (nonatomic, assign) float focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (assign, nonatomic) AVCaptureSessionPreset pictureSize;
@property (nonatomic, assign) AVCaptureVideoStabilizationMode videoStabilizationMode;

@property (nonatomic, assign) BOOL isScanningBarCodes;
@property (nonatomic, assign) BOOL isDetectingFaces;

- (id)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updatePictureSize;
- (void)updateFaceDetectorSettings:(NSDictionary *)settings;
- (void)setBarCodeScannerSettings:(NSDictionary *)settings;
- (void)takePicture:(NSDictionary *)options resolve:(ABI41_0_0UMPromiseResolveBlock)resolve reject:(ABI41_0_0UMPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(ABI41_0_0UMPromiseResolveBlock)resolve reject:(ABI41_0_0UMPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)resumePreview;
- (void)pausePreview;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onPictureSaved:(NSDictionary *)event;

@end


