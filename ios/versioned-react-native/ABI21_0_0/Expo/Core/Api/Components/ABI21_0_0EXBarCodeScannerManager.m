#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import "ABI21_0_0EXBarCodeScanner.h"
#import "ABI21_0_0EXBarCodeScannerManager.h"
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTLog.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUtils.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>
#import <AVFoundation/AVFoundation.h>
#import <AssetsLibrary/ALAssetsLibrary.h>
#import <ImageIO/ImageIO.h>

@interface ABI21_0_0EXBarCodeScannerManager ()

@property (assign, nonatomic) NSInteger torchMode;

@end

@implementation ABI21_0_0EXBarCodeScannerManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentBarCodeScannerManager);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, ABI21_0_0RCTDirectEventBlock);

- (id)init
{
  if (self = [super init]) {
    self.sessionQueue =
    dispatch_queue_create("cameraManagerQueue", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (UIView *)viewWithProps:(__unused NSDictionary *)props
{
  self.presetCamera = ((NSNumber *)props[@"type"]).integerValue;
  return [self view];
}

- (UIView *)view
{
  self.session = [AVCaptureSession new];
#if !(TARGET_IPHONE_SIMULATOR)
  self.previewLayer =
      [AVCaptureVideoPreviewLayer layerWithSession:self.session];
  self.previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
  self.previewLayer.needsDisplayOnBoundsChange = YES;
#endif

  if (!self.camera) {
    self.camera = [[ABI21_0_0EXBarCodeScanner alloc] initWithManager:self bridge:self.bridge];
  }
  return self.camera;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"BarCodeType" : [[self class] validBarCodeTypes],
    @"Type" :
        @{@"front" : @(ABI21_0_0EXBarCodeScannerTypeFront), @"back" : @(ABI21_0_0EXBarCodeScannerTypeBack)},
    @"TorchMode" : @{
      @"off" : @(ABI21_0_0EXBarCodeScannerTorchModeOff),
      @"on" : @(ABI21_0_0EXBarCodeScannerTorchModeOn),
      @"auto" : @(ABI21_0_0EXBarCodeScannerTorchModeAuto)
    }
  };
}

+ (NSDictionary *)validBarCodeTypes
{
  return @{
     @"upc_e" : AVMetadataObjectTypeUPCECode,
     @"code39" : AVMetadataObjectTypeCode39Code,
     @"code39mod43" : AVMetadataObjectTypeCode39Mod43Code,
     @"ean13" : AVMetadataObjectTypeEAN13Code,
     @"ean8" : AVMetadataObjectTypeEAN8Code,
     @"code93" : AVMetadataObjectTypeCode93Code,
     @"code138" : AVMetadataObjectTypeCode128Code,
     @"pdf417" : AVMetadataObjectTypePDF417Code,
     @"qr" : AVMetadataObjectTypeQRCode,
     @"aztec" : AVMetadataObjectTypeAztecCode,
     @"interleaved2of5" : AVMetadataObjectTypeInterleaved2of5Code,
     @"itf14" : AVMetadataObjectTypeITF14Code,
     @"datamatrix" : AVMetadataObjectTypeDataMatrixCode
  };
}

ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI21_0_0EXBarCodeScanner)
{
  NSInteger type = [ABI21_0_0RCTConvert NSInteger:json];

  self.presetCamera = type;
  if (self.session.isRunning) {
    dispatch_async(self.sessionQueue, ^{
      AVCaptureDevicePosition position = (AVCaptureDevicePosition)type;
      AVCaptureDevice *captureDevice =
          [self deviceWithMediaType:AVMediaTypeVideo
                 preferringPosition:(AVCaptureDevicePosition)position];

      if (captureDevice == nil) {
        return;
      }

      self.presetCamera = type;

      NSError *error = nil;
      AVCaptureDeviceInput *captureDeviceInput =
          [AVCaptureDeviceInput deviceInputWithDevice:captureDevice
                                                error:&error];

      if (error || captureDeviceInput == nil) {
        ABI21_0_0RCTLogError(@"%s: %@", __func__, error);
        return;
      }

      [self.session beginConfiguration];

      [self.session removeInput:self.videoCaptureDeviceInput];

      if ([self.session canAddInput:captureDeviceInput]) {
        [self.session addInput:captureDeviceInput];
        self.videoCaptureDeviceInput = captureDeviceInput;
        [self setTorchMode];
      } else {
        if (self.videoCaptureDeviceInput) {
          [self.session addInput:self.videoCaptureDeviceInput];
        } else {
          ABI21_0_0RCTLogWarn(@"%s: Can't add null video capture device, doing nothing instead.", __func__);
        }
      }

      [self.session commitConfiguration];
    });
  }
  [self initializeCaptureSessionInput:AVMediaTypeVideo];
}

ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(torchMode, NSInteger, ABI21_0_0EXBarCodeScanner)
{
  self.torchMode = [ABI21_0_0RCTConvert NSInteger:json];
  [self setTorchMode];
}

- (void)setTorchMode {
  dispatch_async(self.sessionQueue, ^{
    AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
    NSError *error = nil;
    
    if (![device hasFlash])
      return;
    if (![device lockForConfiguration:&error]) {
      ABI21_0_0RCTLogError(@"%s: %@", __func__, error);
      return;
    }
    if (device.hasTorch && [device isFlashModeSupported:self.torchMode])
    {
      NSError *error = nil;
      if ([device lockForConfiguration:&error]) {
        [device setTorchMode:self.torchMode];
        [device unlockForConfiguration];
      } else {
        ABI21_0_0RCTLogError(@"%s: %@", __func__, error);
      }
    }
    [device unlockForConfiguration];
  });
  }

ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, ABI21_0_0EXBarCodeScanner)
{
  NSArray *types = [ABI21_0_0RCTConvert NSArray:json];
  NSSet *validTypes = [NSSet setWithArray:[[self class] validBarCodeTypes].allValues];
  for (id type in types) {
    if (![validTypes containsObject:type]) {
      ABI21_0_0RCTLogWarn(@"Unsupported BarCodeType: %@", type);
      return;
    }
  }
  self.barCodeTypes = types;
}

- (NSArray *)customDirectEventTypes
{
  return @[];
}

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  dispatch_async(self.sessionQueue, ^{
    if (self.presetCamera == AVCaptureDevicePositionUnspecified) {
      self.presetCamera = AVCaptureDevicePositionBack;
    }

    AVCaptureMetadataOutput *metadataOutput =
        [[AVCaptureMetadataOutput alloc] init];
    if ([self.session canAddOutput:metadataOutput]) {
      [metadataOutput setMetadataObjectsDelegate:self queue:self.sessionQueue];
      [self.session addOutput:metadataOutput];
      [metadataOutput setMetadataObjectTypes:self.barCodeTypes];
      self.metadataOutput = metadataOutput;
    }

    __weak ABI21_0_0EXBarCodeScannerManager *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
              [NSNotificationCenter.defaultCenter
                  addObserverForName:AVCaptureSessionRuntimeErrorNotification
                              object:self.session
                               queue:nil
                          usingBlock:^(NSNotification *note) {
                            ABI21_0_0EXBarCodeScannerManager *strongSelf = weakSelf;
                            dispatch_async(strongSelf.sessionQueue, ^{
                              // Manually restarting the session since it must
                              // have been stopped due to an error.
                              [strongSelf.session startRunning];
                            });
                          }]];

    [self.session startRunning];
  });
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  dispatch_async(self.sessionQueue, ^{
    self.camera = nil;
    [self.previewLayer removeFromSuperlayer];
    [self.session commitConfiguration];
    [self.session stopRunning];
    for (AVCaptureInput *input in self.session.inputs) {
      [self.session removeInput:input];
    }

    for (AVCaptureOutput *output in self.session.outputs) {
      [self.session removeOutput:output];
    }
  });
}

- (void)captureOutput:(AVCaptureOutput *)captureOutput
    didOutputMetadataObjects:(NSArray *)metadataObjects
              fromConnection:(AVCaptureConnection *)connection
{
  for (AVMetadataMachineReadableCodeObject *metadata in metadataObjects) {
    for (id barcodeType in self.barCodeTypes) {
      if ([metadata.type isEqualToString:barcodeType]) {

        NSDictionary *event = @{
          @"type" : metadata.type,
          @"data" : metadata.stringValue
        };

        [self.camera onRead:event];
      }
    }
  }
}

- (void)initializeCaptureSessionInput:(NSString *)type
{
  dispatch_async(self.sessionQueue, ^{
    [self.session beginConfiguration];

    NSError *error = nil;
    AVCaptureDevice *captureDevice =
        [self deviceWithMediaType:AVMediaTypeVideo
               preferringPosition:self.presetCamera];

    AVCaptureDeviceInput *captureDeviceInput =
        [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];

    if (error || captureDeviceInput == nil) {
      ABI21_0_0RCTLogError(@"%s: %@", __func__, error);
      return;
    }

    if ([self.session canAddInput:captureDeviceInput]) {
      [self.session addInput:captureDeviceInput];
      
      self.videoCaptureDeviceInput = captureDeviceInput;
      [self setTorchMode];

      [self.metadataOutput
          setMetadataObjectTypes:self.metadataOutput
                                     .availableMetadataObjectTypes];
    }

    [self.session commitConfiguration];
  });
}

- (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType
                      preferringPosition:(AVCaptureDevicePosition)position
{
  NSArray *devices = [AVCaptureDevice devicesWithMediaType:mediaType];
  AVCaptureDevice *captureDevice = [devices firstObject];

  for (AVCaptureDevice *device in devices) {
    if ([device position] == position) {
      captureDevice = device;
      break;
    }
  }

  return captureDevice;
}

@end
