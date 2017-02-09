#import <ReactABI14_0_0/ABI14_0_0RCTViewManager.h>
#import <AVFoundation/AVFoundation.h>

@class ABI14_0_0EXBarCodeScanner;

typedef NS_ENUM(NSInteger, ABI14_0_0EXBarCodeScannerType) {
  ABI14_0_0EXBarCodeScannerTypeFront = AVCaptureDevicePositionFront,
  ABI14_0_0EXBarCodeScannerTypeBack = AVCaptureDevicePositionBack
};

typedef NS_ENUM(NSInteger, ABI14_0_0EXBarCodeScannerTorchMode) {
  ABI14_0_0EXBarCodeScannerTorchModeOff = AVCaptureTorchModeOff,
  ABI14_0_0EXBarCodeScannerTorchModeOn = AVCaptureTorchModeOn,
  ABI14_0_0EXBarCodeScannerTorchModeAuto = AVCaptureTorchModeAuto
};

@interface ABI14_0_0EXBarCodeScannerManager
    : ABI14_0_0RCTViewManager <AVCaptureMetadataOutputObjectsDelegate>

@property(nonatomic, strong) dispatch_queue_t sessionQueue;
@property(nonatomic, strong) AVCaptureSession *session;
@property(nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property(nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property(nonatomic, strong) id runtimeErrorHandlingObserver;
@property(nonatomic, assign) NSInteger presetCamera;
@property(nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property(nonatomic, strong) NSArray *barCodeTypes;
@property(nonatomic, strong) ABI14_0_0EXBarCodeScanner *camera;

- (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position;
- (void)initializeCaptureSessionInput:(NSString *)type;
- (void)startSession;
- (void)stopSession;

@end
