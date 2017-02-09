#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import "ABI14_0_0EXBarCodeScanner.h"
#import "ABI14_0_0EXBarCodeScannerManager.h"
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTLog.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUtils.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>
#import <AVFoundation/AVFoundation.h>
#import <AssetsLibrary/ALAssetsLibrary.h>
#import <ImageIO/ImageIO.h>

@interface ABI14_0_0EXBarCodeScannerManager ()

@end

@implementation ABI14_0_0EXBarCodeScannerManager

ABI14_0_0RCT_EXPORT_MODULE(ExponentBarCodeScannerManager);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, ABI14_0_0RCTDirectEventBlock);

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
    self.camera = [[ABI14_0_0EXBarCodeScanner alloc] initWithManager:self bridge:self.bridge];
  }
  return self.camera;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"BarCodeType" : @{
      @"upce" : AVMetadataObjectTypeUPCECode,
      @"code39" : AVMetadataObjectTypeCode39Code,
      @"code39mod43" : AVMetadataObjectTypeCode39Mod43Code,
      @"ean13" : AVMetadataObjectTypeEAN13Code,
      @"ean8" : AVMetadataObjectTypeEAN8Code,
      @"code93" : AVMetadataObjectTypeCode93Code,
      @"code138" : AVMetadataObjectTypeCode128Code,
      @"pdf417" : AVMetadataObjectTypePDF417Code,
      @"qr" : AVMetadataObjectTypeQRCode,
      @"aztec" : AVMetadataObjectTypeAztecCode
#ifdef AVMetadataObjectTypeInterleaved2of5Code
      ,
      @"interleaved2of5" : AVMetadataObjectTypeInterleaved2of5Code
#endif
#ifdef AVMetadataObjectTypeITF14Code
      ,
      @"itf14" : AVMetadataObjectTypeITF14Code
#endif
#ifdef AVMetadataObjectTypeDataMatrixCode
      ,
      @"datamatrix" : AVMetadataObjectTypeDataMatrixCode
#endif
    },
    @"Type" :
        @{@"front" : @(ABI14_0_0EXBarCodeScannerTypeFront), @"back" : @(ABI14_0_0EXBarCodeScannerTypeBack)},
    @"TorchMode" : @{
      @"off" : @(ABI14_0_0EXBarCodeScannerTorchModeOff),
      @"on" : @(ABI14_0_0EXBarCodeScannerTorchModeOn),
      @"auto" : @(ABI14_0_0EXBarCodeScannerTorchModeAuto)
    }
  };
}

ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI14_0_0EXBarCodeScanner)
{
  NSInteger type = [ABI14_0_0RCTConvert NSInteger:json];

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
        NSLog(@"%@", error);
        return;
      }

      [self.session beginConfiguration];

      [self.session removeInput:self.videoCaptureDeviceInput];

      if ([self.session canAddInput:captureDeviceInput]) {
        [self.session addInput:captureDeviceInput];
        self.videoCaptureDeviceInput = captureDeviceInput;
      } else {
        [self.session addInput:self.videoCaptureDeviceInput];
      }

      [self.session commitConfiguration];
    });
  }
}

ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(torchMode, NSInteger, ABI14_0_0EXBarCodeScanner)
{
  dispatch_async(self.sessionQueue, ^{
    NSInteger torchMode = [ABI14_0_0RCTConvert NSInteger:json];
    AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
    NSError *error = nil;

    if (![device hasTorch])
      return;
    if (![device lockForConfiguration:&error]) {
      NSLog(@"%@", error);
      return;
    }
    [device setTorchMode:torchMode];
    [device unlockForConfiguration];
  });
}

ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, ABI14_0_0EXBarCodeScanner)
{
  self.barCodeTypes = [ABI14_0_0RCTConvert NSArray:json];
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

    __weak ABI14_0_0EXBarCodeScannerManager *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
              [NSNotificationCenter.defaultCenter
                  addObserverForName:AVCaptureSessionRuntimeErrorNotification
                              object:self.session
                               queue:nil
                          usingBlock:^(NSNotification *note) {
                            ABI14_0_0EXBarCodeScannerManager *strongSelf = weakSelf;
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
      NSLog(@"%@", error);
      return;
    }

    if ([self.session canAddInput:captureDeviceInput]) {
      [self.session addInput:captureDeviceInput];

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
