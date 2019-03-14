#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <EXCamera/EXCameraManager.h>
#import <UMCore/UMModuleRegistry.h>
#import <UMCore/UMAppLifecycleListener.h>
#import <UMCameraInterface/UMCameraInterface.h>

@class EXCameraManager;

@interface EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, UMAppLifecycleListener, UMCameraInterface>

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property (nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, assign) NSInteger flashMode;
@property (nonatomic, assign) CGFloat zoom;
@property (nonatomic, assign) NSInteger autoFocus;
@property (nonatomic, assign) float focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (assign, nonatomic) AVCaptureSessionPreset pictureSize;
@property (nonatomic, assign) NSInteger videoStabilizationMode;

@property (nonatomic, assign) BOOL isScanningBarCodes;
@property (nonatomic, assign) BOOL isDetectingFaces;

- (id)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updatePictureSize;
- (void)updateFaceDetectorSettings:(NSDictionary *)settings;
- (void)setBarCodeScannerSettings:(NSDictionary *)settings;
- (void)takePicture:(NSDictionary *)options resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)resumePreview;
- (void)pausePreview;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onPictureSaved:(NSDictionary *)event;

@end


