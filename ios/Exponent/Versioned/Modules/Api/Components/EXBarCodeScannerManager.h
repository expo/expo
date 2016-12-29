#import <React/RCTViewManager.h>
#import <AVFoundation/AVFoundation.h>

@class EXBarCodeScanner;

typedef NS_ENUM(NSInteger, EXBarCodeScannerType) {
  EXBarCodeScannerTypeFront = AVCaptureDevicePositionFront,
  EXBarCodeScannerTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, EXBarCodeScannerTorchMode) {
  EXBarCodeScannerTorchModeOff = AVCaptureTorchModeOff,
  EXBarCodeScannerTorchModeOn = AVCaptureTorchModeOn,
  EXBarCodeScannerTorchModeAuto = AVCaptureTorchModeAuto
};

@interface EXBarCodeScannerManager
    : RCTViewManager <AVCaptureMetadataOutputObjectsDelegate>

@property(nonatomic, strong) dispatch_queue_t sessionQueue;
@property(nonatomic, strong) AVCaptureSession *session;
@property(nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property(nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property(nonatomic, strong) id runtimeErrorHandlingObserver;
@property(nonatomic, assign) NSInteger presetCamera;
@property(nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property(nonatomic, strong) NSArray *barCodeTypes;
@property(nonatomic, strong) EXBarCodeScanner *camera;

- (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position;
- (void)initializeCaptureSessionInput:(NSString *)type;
- (void)startSession;
- (void)stopSession;

@end
