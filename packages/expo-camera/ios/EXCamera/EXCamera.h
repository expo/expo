#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <ExpoModulesCore/EXCameraInterface.h>
#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>

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

typedef NS_ENUM(NSInteger, EXCameraVideoCodec) {
  EXCameraVideoCodecH264 = 0,
  EXCameraVideoCodecHEVC = 1,
  EXCameraVideoCodecJPEG = 2,
  EXCameraVideoCodecAppleProRes422 = 3,
  EXCameraVideoCodecAppleProRes4444 = 4,
};

@interface EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, EXAppLifecycleListener, EXCameraInterface, AVCapturePhotoCaptureDelegate, EXLegacyExpoViewProtocol>

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCapturePhotoOutput *photoOutput;
@property (nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, assign) EXCameraFlashMode flashMode;
@property (nonatomic, assign) CGFloat zoom;
@property (nonatomic, assign) NSInteger autoFocus;
@property (nonatomic, assign) float focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (assign, nonatomic) AVCaptureSessionPreset pictureSize;
@property (nonatomic, assign) AVCaptureVideoStabilizationMode videoStabilizationMode;
@property (nonatomic, assign) BOOL responsiveOrientationWhenOrientationLocked;


@property (nonatomic, assign) BOOL isScanningBarCodes;
@property (nonatomic, assign) BOOL isDetectingFaces;
@property (nonatomic, assign) AVVideoCodecType videoCodecType;

- (nonnull instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updatePictureSize;
- (void)updateResponsiveOrientationWhenOrientationLocked;
- (void)updateFaceDetectorSettings:(NSDictionary *)settings;
- (void)setBarCodeScannerSettings:(NSDictionary *)settings;
- (void)takePicture:(NSDictionary *)options resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)resumePreview;
- (void)pausePreview;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onResponsiveOrientationChanged:(NSDictionary *)event;
- (void)onPictureSaved:(NSDictionary *)event;

@end

