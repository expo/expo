#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI46_0_0EXCamera/ABI46_0_0EXCameraManager.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistry.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAppLifecycleListener.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXCameraInterface.h>

@class ABI46_0_0EXCameraManager;

static const int ABI46_0_0EXFlashModeTorch = 3;

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraType) {
  ABI46_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI46_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraFlashMode) {
  ABI46_0_0EXCameraFlashModeOff = AVCaptureFlashModeOff,
  ABI46_0_0EXCameraFlashModeOn = AVCaptureFlashModeOn,
  ABI46_0_0EXCameraFlashModeTorch = ABI46_0_0EXFlashModeTorch,
  ABI46_0_0EXCameraFlashModeAuto = AVCaptureFlashModeAuto
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraVideoStabilizationMode) {
  ABI46_0_0EXCameraVideoStabilizationModeOff = AVCaptureVideoStabilizationModeOff,
  ABI46_0_0EXCameraVideoStabilizationModeStandard = AVCaptureVideoStabilizationModeStandard,
  ABI46_0_0EXCameraVideoStabilizationModeCinematic = AVCaptureVideoStabilizationModeCinematic,
  ABI46_0_0EXCameraAVCaptureVideoStabilizationModeAuto = AVCaptureVideoStabilizationModeAuto
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraAutoFocus) {
  ABI46_0_0EXCameraAutoFocusOff = AVCaptureFocusModeLocked,
  ABI46_0_0EXCameraAutoFocusOn = AVCaptureFocusModeContinuousAutoFocus,
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraWhiteBalance) {
  ABI46_0_0EXCameraWhiteBalanceAuto = 0,
  ABI46_0_0EXCameraWhiteBalanceSunny = 1,
  ABI46_0_0EXCameraWhiteBalanceCloudy = 2,
  ABI46_0_0EXCameraWhiteBalanceFlash = 3,
  ABI46_0_0EXCameraWhiteBalanceShadow = 4,
  ABI46_0_0EXCameraWhiteBalanceIncandescent = 5,
  ABI46_0_0EXCameraWhiteBalanceFluorescent = 6,
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraExposureMode) {
  ABI46_0_0EXCameraExposureLocked = AVCaptureExposureModeLocked,
  ABI46_0_0EXCameraExposureAuto = AVCaptureExposureModeContinuousAutoExposure,
  ABI46_0_0EXCameraExposureCustom = AVCaptureExposureModeCustom,
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraVideoResolution) {
  ABI46_0_0EXCameraVideo2160p = 0,
  ABI46_0_0EXCameraVideo1080p = 1,
  ABI46_0_0EXCameraVideo720p = 2,
  ABI46_0_0EXCameraVideo4x3 = 3,
};

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraVideoCodec) {
  ABI46_0_0EXCameraVideoCodecH264 = 0,
  ABI46_0_0EXCameraVideoCodecHEVC = 1,
  ABI46_0_0EXCameraVideoCodecJPEG = 2,
  ABI46_0_0EXCameraVideoCodecAppleProRes422 = 3,
  ABI46_0_0EXCameraVideoCodecAppleProRes4444 = 4,
};

@interface ABI46_0_0EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, ABI46_0_0EXAppLifecycleListener, ABI46_0_0EXCameraInterface, AVCapturePhotoCaptureDelegate>

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCapturePhotoOutput *photoOutput;
@property (nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, assign) ABI46_0_0EXCameraFlashMode flashMode;
@property (nonatomic, assign) CGFloat zoom;
@property (nonatomic, assign) NSInteger autoFocus;
@property (nonatomic, assign) float focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (assign, nonatomic) AVCaptureSessionPreset pictureSize;
@property (nonatomic, assign) AVCaptureVideoStabilizationMode videoStabilizationMode;

@property (nonatomic, assign) BOOL isScanningBarCodes;
@property (nonatomic, assign) BOOL isDetectingFaces;
@property (nonatomic, assign) AVVideoCodecType videoCodecType;

- (id)initWithModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updatePictureSize;
- (void)updateFaceDetectorSettings:(NSDictionary *)settings;
- (void)setBarCodeScannerSettings:(NSDictionary *)settings;
- (void)takePicture:(NSDictionary *)options resolve:(ABI46_0_0EXPromiseResolveBlock)resolve reject:(ABI46_0_0EXPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(ABI46_0_0EXPromiseResolveBlock)resolve reject:(ABI46_0_0EXPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)resumePreview;
- (void)pausePreview;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onPictureSaved:(NSDictionary *)event;

@end

