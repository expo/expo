#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <EXCamera/EXCameraManager.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXCameraInterface/EXCameraInterface.h>

@class EXCameraManager;

@interface EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, EXAppLifecycleListener, EXCameraInterface>

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property (nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property (nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, strong) NSArray *barCodeTypes;

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, assign) NSInteger flashMode;
@property (nonatomic, assign) CGFloat zoom;
@property (nonatomic, assign) NSInteger autoFocus;
@property (nonatomic, assign) float focusDepth;
@property (nonatomic, assign) NSInteger whiteBalance;
@property (assign, nonatomic) AVCaptureSessionPreset pictureSize;

@property (nonatomic, assign) BOOL isReadingBarCodes;
@property (nonatomic, assign) BOOL isDetectingFaces;

- (id)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updatePictureSize;
- (void)updateFaceDetectorSettings:(NSDictionary *)settings;
- (void)takePicture:(NSDictionary *)options resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)resumePreview;
- (void)pausePreview;
- (void)setupOrDisableBarcodeScanner;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onCodeRead:(NSDictionary *)event;
- (void)onPictureSaved:(NSDictionary *)event;

@end


