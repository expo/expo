#import <AVFoundation/AVFoundation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import "ABI25_0_0EXCameraManager.h"

#if __has_include("ABI25_0_0EXFaceDetectorManager.h")
#import "ABI25_0_0EXFaceDetectorManager.h"
#else
#import "ABI25_0_0EXFaceDetectorManagerStub.h"
#endif

@class ABI25_0_0EXCameraManager;

@interface ABI25_0_0EXCamera : UIView <AVCaptureMetadataOutputObjectsDelegate, AVCaptureFileOutputRecordingDelegate, ABI25_0_0EXFaceDetectorDelegate>

@property(nonatomic, strong) dispatch_queue_t sessionQueue;
@property(nonatomic, strong) AVCaptureSession *session;
@property(nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property(nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property(nonatomic, strong) AVCaptureMovieFileOutput *movieFileOutput;
@property(nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property(nonatomic, strong) id runtimeErrorHandlingObserver;
@property(nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property(nonatomic, strong) NSArray *barCodeTypes;

@property(nonatomic, assign) NSInteger presetCamera;
@property (assign, nonatomic) NSInteger flashMode;
@property (assign, nonatomic) CGFloat zoom;
@property (assign, nonatomic) NSInteger autoFocus;
@property (assign, nonatomic) float focusDepth;
@property (assign, nonatomic) NSInteger whiteBalance;
@property (nonatomic, assign, getter=isReadingBarCodes) BOOL barCodeReading;

- (id)initWithBridge:(ABI25_0_0RCTBridge *)bridge;
- (void)updateType;
- (void)updateFlashMode;
- (void)updateFocusMode;
- (void)updateFocusDepth;
- (void)updateZoom;
- (void)updateWhiteBalance;
- (void)updateFaceDetecting:(id)isDetectingFaces;
- (void)updateFaceDetectionMode:(id)requestedMode;
- (void)updateFaceDetectionLandmarks:(id)requestedLandmarks;
- (void)updateFaceDetectionClassifications:(id)requestedClassifications;
- (void)takePicture:(NSDictionary *)options resolve:(ABI25_0_0RCTPromiseResolveBlock)resolve reject:(ABI25_0_0RCTPromiseRejectBlock)reject;
- (void)record:(NSDictionary *)options resolve:(ABI25_0_0RCTPromiseResolveBlock)resolve reject:(ABI25_0_0RCTPromiseRejectBlock)reject;
- (void)stopRecording;
- (void)setupOrDisableBarcodeScanner;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onCodeRead:(NSDictionary *)event;
- (void)onFacesDetected:(NSDictionary *)event;

@end
