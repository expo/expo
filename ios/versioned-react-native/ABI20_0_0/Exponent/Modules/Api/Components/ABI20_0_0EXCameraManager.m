#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import "ABI20_0_0EXCamera.h"
#import "ABI20_0_0EXCameraManager.h"
#import "ABI20_0_0EXFileSystem.h"
#import "ABI20_0_0EXUnversioned.h"
#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>
#import <ReactABI20_0_0/ABI20_0_0RCTLog.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import <AVFoundation/AVFoundation.h>
#import <AssetsLibrary/ALAssetsLibrary.h>
#import <ImageIO/ImageIO.h>

@interface ABI20_0_0EXCameraManager ()

@property (assign, nonatomic) NSInteger flashMode;
@property (assign, nonatomic) CGFloat zoom;
@property (assign, nonatomic) NSInteger autoFocus;
@property (assign, nonatomic) float focusDepth;
@property (assign, nonatomic) NSInteger whiteBalance;
@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@end

@implementation ABI20_0_0EXCameraManager

ABI20_0_0RCT_EXPORT_MODULE(ExponentCameraManager);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onCameraReady, ABI20_0_0RCTDirectEventBlock);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI20_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _paused = NO;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:@"EXKernelBridgeDidForegroundNotification"
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:@"EXKernelBridgeDidBackgroundNotification"
                                             object:self.bridge];
}

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
    self.camera = [[ABI20_0_0EXCamera alloc] initWithManager:self bridge:self.bridge];
  }
  return self.camera;
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(ABI20_0_0EXCameraTypeFront), @"back" : @(ABI20_0_0EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(ABI20_0_0EXCameraFlashModeOff),
               @"on" : @(ABI20_0_0EXCameraFlashModeOn),
               @"auto" : @(ABI20_0_0EXCameraFlashModeAuto),
               @"torch" : @(ABI20_0_0EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(ABI20_0_0EXCameraAutoFocusOn), @"off" : @(ABI20_0_0EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(ABI20_0_0EXCameraWhiteBalanceAuto),
               @"sunny" : @(ABI20_0_0EXCameraWhiteBalanceSunny),
               @"cloudy" : @(ABI20_0_0EXCameraWhiteBalanceCloudy),
               @"shadow" : @(ABI20_0_0EXCameraWhiteBalanceShadow),
               @"incandescent" : @(ABI20_0_0EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(ABI20_0_0EXCameraWhiteBalanceFluorescent)
               },
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onCameraReady"];
}

ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, ABI20_0_0EXCamera)
{
  NSInteger type = [ABI20_0_0RCTConvert NSInteger:json];
  
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
        ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
        return;
      }
      
      [self.session beginConfiguration];
      
      [self.session removeInput:self.videoCaptureDeviceInput];
      
      if ([self.session canAddInput:captureDeviceInput]) {
        [self.session addInput:captureDeviceInput];
        self.videoCaptureDeviceInput = captureDeviceInput;
        [self updateFlashMode];
      } else {
        if (self.videoCaptureDeviceInput) {
          [self.session addInput:self.videoCaptureDeviceInput];
        } else {
          ABI20_0_0RCTLogWarn(@"%s: Can't add null video capture device, doing nothing instead.", __func__);
        }
      }
      
      [self.session commitConfiguration];
    });
  }
  [self initializeCaptureSessionInput:AVMediaTypeVideo];
}

ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, ABI20_0_0EXCamera)
{
  self.flashMode = [ABI20_0_0RCTConvert NSInteger:json];
  [self updateFlashMode];
}

- (void)updateFlashMode {
  dispatch_async(self.sessionQueue, ^{
    AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
    NSError *error = nil;
    
    if (self.flashMode == ABI20_0_0EXCameraFlashModeTorch) {
      if (![device hasTorch])
        return;
      if (![device lockForConfiguration:&error]) {
        if (error) {
          ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
        }
        return;
      }
      if (device.hasTorch && [device isTorchModeSupported:AVCaptureTorchModeOn])
      {
        NSError *error = nil;
        if ([device lockForConfiguration:&error]) {
          [device setFlashMode:AVCaptureFlashModeOff];
          [device setTorchMode:AVCaptureTorchModeOn];
          [device unlockForConfiguration];
        } else {
          if (error) {
            ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
          }
        }
      }
    } else {
      if (![device hasFlash])
        return;
      if (![device lockForConfiguration:&error]) {
        if (error) {
          ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
        }
        return;
      }
      if (device.hasFlash && [device isFlashModeSupported:self.flashMode])
      {
        NSError *error = nil;
        if ([device lockForConfiguration:&error]) {
          if ([device isTorchModeSupported:AVCaptureTorchModeOff]) {
            [device setTorchMode:AVCaptureTorchModeOff];
          }
          [device setFlashMode:self.flashMode];
          [device unlockForConfiguration];
        } else {
          if (error) {
            ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
          }
        }
      }
    }

    [device unlockForConfiguration];
  });
}


ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, ABI20_0_0EXCamera)
{
  self.autoFocus = [ABI20_0_0RCTConvert NSInteger:json];
  [self updateFocusMode];
}

- (void)updateFocusMode {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  if ([device isFocusModeSupported:self.autoFocus]) {
    if ([device lockForConfiguration:&error]) {
      [device setFocusMode:self.autoFocus];
    } else {
      if (error) {
        ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
      }
    }
  }
  
  [device unlockForConfiguration];
}


ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, ABI20_0_0EXCamera)
{
  self.focusDepth = [ABI20_0_0RCTConvert float:json];
  [self updateFocusDepth];
}

- (void)updateFocusDepth {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (device.focusMode != ABI20_0_0EXCameraAutoFocusOff) {
    return;
  }
  
  if (![device isLockingFocusWithCustomLensPositionSupported]) {
    ABI20_0_0RCTLogWarn(@"%s: Setting focusDepth isn't supported for this camera device", __func__);
    return;
  }
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  __weak __typeof__(device) weakDevice = device;
  [device setFocusModeLockedWithLensPosition:self.focusDepth completionHandler:^(CMTime syncTime) {
    [weakDevice unlockForConfiguration];
  }];

}

ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, ABI20_0_0EXCamera)
{
  self.zoom = [ABI20_0_0RCTConvert CGFloat:json];
  [self updateZoom];
}

- (void)updateZoom {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  device.videoZoomFactor = (device.activeFormat.videoMaxZoomFactor - 1.0) * self.zoom + 1.0;
  
  [device unlockForConfiguration];
}

ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, ABI20_0_0EXCamera)
{
  self.whiteBalance = [ABI20_0_0RCTConvert NSInteger:json];
  [self updateWhiteBalance];
}

- (void)updateWhiteBalance {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  if (self.whiteBalance == ABI20_0_0EXCameraWhiteBalanceAuto) {
    [device setWhiteBalanceMode:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance];
    [device unlockForConfiguration];
  } else {
    AVCaptureWhiteBalanceTemperatureAndTintValues temperatureAndTint = {
      .temperature = [self.whiteBalanceTemperatures[@(self.whiteBalance)] floatValue],
      .tint = 0,
    };
    AVCaptureWhiteBalanceGains rgbGains = [device deviceWhiteBalanceGainsForTemperatureAndTintValues:temperatureAndTint];
    __weak __typeof__(device) weakDevice = device;
    if ([device lockForConfiguration:&error]) {
      [device setWhiteBalanceModeLockedWithDeviceWhiteBalanceGains:rgbGains completionHandler:^(CMTime syncTime) {
        [weakDevice unlockForConfiguration];
      }];
    } else {
      if (error) {
        ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
      }
    }
  }
  
  [device unlockForConfiguration];
}

ABI20_0_0RCT_REMAP_METHOD(takePicture,
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
  AVCaptureConnection *connection = [self.stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:(AVCaptureVideoOrientation) [self convertToAVCaptureVideoOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];
  [self.stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    if (imageSampleBuffer && !error) {
      NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageSampleBuffer];

      // crop image to preview size
      UIImage *takenImage = [UIImage imageWithData:imageData];
      CGRect outputRect = [_previewLayer metadataOutputRectOfInterestForRect:_previewLayer.bounds];
      CGImageRef takenCGImage = takenImage.CGImage;
      size_t width = CGImageGetWidth(takenCGImage);
      size_t height = CGImageGetHeight(takenCGImage);
      CGRect cropRect = CGRectMake(outputRect.origin.x * width, outputRect.origin.y * height, outputRect.size.width * width, outputRect.size.height * height);

      CGImageRef cropCGImage = CGImageCreateWithImageInRect(takenCGImage, cropRect);
      takenImage = [UIImage imageWithCGImage:cropCGImage scale:1 orientation:takenImage.imageOrientation];
      CGImageRelease(cropCGImage);

      NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:@".jpg"];
      NSString *directory = [self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"];
      [ABI20_0_0EXFileSystem ensureDirExistsWithPath:directory];
      NSString *path = [directory stringByAppendingPathComponent:fileName];
      [UIImageJPEGRepresentation(takenImage, 100) writeToFile:path atomically:YES];
      NSURL *fileURL = [NSURL fileURLWithPath:path];
      NSString *filePath = [fileURL absoluteString];
      resolve(filePath);
    } else {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
    }
  }];
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
    
    AVCaptureStillImageOutput *stillImageOutput = [[AVCaptureStillImageOutput alloc] init];
    if ([self.session canAddOutput:stillImageOutput])
    {
      stillImageOutput.outputSettings = @{AVVideoCodecKey : AVVideoCodecJPEG};
      [self.session addOutput:stillImageOutput];
      self.stillImageOutput = stillImageOutput;
    }
    
    __weak ABI20_0_0EXCameraManager *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
     [NSNotificationCenter.defaultCenter
      addObserverForName:AVCaptureSessionRuntimeErrorNotification
      object:self.session
      queue:nil
      usingBlock:^(NSNotification *note) {
        ABI20_0_0EXCameraManager *strongSelf = weakSelf;
        dispatch_async(strongSelf.sessionQueue, ^{
          // Manually restarting the session since it must
          // have been stopped due to an error.
          [strongSelf.session startRunning];
          [strongSelf.camera onReady:nil];
        });
      }]];
    
    [self.session startRunning];
    [self.camera onReady:nil];
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
      ABI20_0_0RCTLogError(@"%s: %@", __func__, error);
      return;
    }
    
    if ([self.session canAddInput:captureDeviceInput]) {
      [self.session addInput:captureDeviceInput];
      
      self.videoCaptureDeviceInput = captureDeviceInput;
      [self updateFlashMode];
      [self updateZoom];
      [self updateFocusMode];
      [self updateFocusDepth];
      [self updateWhiteBalance];
      self.previewLayer.connection.videoOrientation = [self convertToAVCaptureVideoOrientation:[[UIApplication sharedApplication] statusBarOrientation]];

    }
    
    [self.session commitConfiguration];
  });
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  
  if (![self.session isRunning] && [self isSessionPaused]) {
    self.paused = NO;
    dispatch_async( self.sessionQueue, ^{
      [self.session startRunning];
    });
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  if ([self.session isRunning] && ![self isSessionPaused]) {
    self.paused = YES;
    dispatch_async( self.sessionQueue, ^{
      [self.session stopRunning];
    });
  }
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

- (AVCaptureVideoOrientation)convertToAVCaptureVideoOrientation:(UIInterfaceOrientation)orientation
{
  switch (orientation) {
    case UIInterfaceOrientationPortrait:
      return AVCaptureVideoOrientationPortrait;
    case UIInterfaceOrientationPortraitUpsideDown:
      return AVCaptureVideoOrientationPortraitUpsideDown;
    case UIInterfaceOrientationLandscapeRight:
      return AVCaptureVideoOrientationLandscapeRight;
    case UIInterfaceOrientationLandscapeLeft:
      return AVCaptureVideoOrientationLandscapeLeft;
    default:
      return 0;
  }
}

- (NSDictionary *)whiteBalanceTemperatures
{
  return @{
           @(ABI20_0_0EXCameraWhiteBalanceSunny): @5200,
           @(ABI20_0_0EXCameraWhiteBalanceCloudy): @6000,
           @(ABI20_0_0EXCameraWhiteBalanceShadow): @7000,
           @(ABI20_0_0EXCameraWhiteBalanceIncandescent): @3000,
           @(ABI20_0_0EXCameraWhiteBalanceFluorescent): @4200,
           };
}

@end
