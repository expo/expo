#import <React/RCTBridge.h>
#import "EXCamera.h"
#import "EXCameraManager.h"
#import "EXFileSystem.h"
#import "EXUnversioned.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <AVFoundation/AVFoundation.h>
#import <AssetsLibrary/ALAssetsLibrary.h>
#import <ImageIO/ImageIO.h>

@interface EXCameraManager ()

@property (assign, nonatomic) NSInteger flashMode;
@property (assign, nonatomic) CGFloat zoom;
@property (assign, nonatomic) NSInteger autoFocus;
@property (assign, nonatomic) float focusDepth;
@property (assign, nonatomic) NSInteger whiteBalance;
@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;
@property (nonatomic, assign, getter=isScanning) BOOL scanning;
@property (nonatomic, strong) RCTPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock videoRecordedReject;

@end

@implementation EXCameraManager

RCT_EXPORT_MODULE(ExponentCameraManager);
RCT_EXPORT_VIEW_PROPERTY(onCameraReady, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, RCTDirectEventBlock);

@synthesize bridge = _bridge;

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  _paused = NO;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
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
    self.camera = [[EXCamera alloc] initWithManager:self bridge:self.bridge];
  }
  return self.camera;
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"Type" :
             @{@"front" : @(EXCameraTypeFront), @"back" : @(EXCameraTypeBack)},
           @"FlashMode" : @{
               @"off" : @(EXCameraFlashModeOff),
               @"on" : @(EXCameraFlashModeOn),
               @"auto" : @(EXCameraFlashModeAuto),
               @"torch" : @(EXCameraFlashModeTorch)
               },
           @"AutoFocus" :
             @{@"on" : @(EXCameraAutoFocusOn), @"off" : @(EXCameraAutoFocusOff)},
           @"WhiteBalance" : @{
               @"auto" : @(EXCameraWhiteBalanceAuto),
               @"sunny" : @(EXCameraWhiteBalanceSunny),
               @"cloudy" : @(EXCameraWhiteBalanceCloudy),
               @"shadow" : @(EXCameraWhiteBalanceShadow),
               @"incandescent" : @(EXCameraWhiteBalanceIncandescent),
               @"fluorescent" : @(EXCameraWhiteBalanceFluorescent)
               },
           @"VideoQuality": @{
               @"2160p": @(EXCameraVideo2160p),
               @"1080p": @(EXCameraVideo1080p),
               @"720p": @(EXCameraVideo720p),
               @"480p": @(EXCameraVideo4x3),
               @"4:3": @(EXCameraVideo4x3),
               },
           @"BarCodeType" : [[self class] validBarCodeTypes],
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onCameraReady", @"onBarCodeRead"];
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

RCT_CUSTOM_VIEW_PROPERTY(type, NSInteger, EXCamera)
{
  NSInteger type = [RCTConvert NSInteger:json];
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
        RCTLogError(@"%s: %@", __func__, error);
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
          RCTLogWarn(@"%s: Can't add null video capture device, doing nothing instead.", __func__);
        }
      }
      
      [self.session commitConfiguration];
    });
    [self initializeCaptureSessionInput:AVMediaTypeVideo];
  } else {
    [self initializeCaptureSessionInput:AVMediaTypeVideo];
    [self startSession];
  }
}

RCT_CUSTOM_VIEW_PROPERTY(flashMode, NSInteger, EXCamera)
{
  self.flashMode = [RCTConvert NSInteger:json];
  [self updateFlashMode];
}

- (void)updateFlashMode {
  dispatch_async(self.sessionQueue, ^{
    AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
    NSError *error = nil;
    
    if (self.flashMode == EXCameraFlashModeTorch) {
      if (![device hasTorch])
        return;
      if (![device lockForConfiguration:&error]) {
        if (error) {
          RCTLogError(@"%s: %@", __func__, error);
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
            RCTLogError(@"%s: %@", __func__, error);
          }
        }
      }
    } else {
      if (![device hasFlash])
        return;
      if (![device lockForConfiguration:&error]) {
        if (error) {
          RCTLogError(@"%s: %@", __func__, error);
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
            RCTLogError(@"%s: %@", __func__, error);
          }
        }
      }
    }

    [device unlockForConfiguration];
  });
}


RCT_CUSTOM_VIEW_PROPERTY(autoFocus, NSInteger, EXCamera)
{
  self.autoFocus = [RCTConvert NSInteger:json];
  [self updateFocusMode];
}

- (void)updateFocusMode {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  if ([device isFocusModeSupported:self.autoFocus]) {
    if ([device lockForConfiguration:&error]) {
      [device setFocusMode:self.autoFocus];
    } else {
      if (error) {
        RCTLogError(@"%s: %@", __func__, error);
      }
    }
  }
  
  [device unlockForConfiguration];
}


RCT_CUSTOM_VIEW_PROPERTY(focusDepth, NSNumber, EXCamera)
{
  self.focusDepth = [RCTConvert float:json];
  [self updateFocusDepth];
}

- (void)updateFocusDepth {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (device.focusMode != EXCameraAutoFocusOff) {
    return;
  }
  
  if (![device respondsToSelector:@selector(isLockingFocusWithCustomLensPositionSupported)] || ![device isLockingFocusWithCustomLensPositionSupported]) {
    RCTLogWarn(@"%s: Setting focusDepth isn't supported for this camera device", __func__);
    return;
  }
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  __weak __typeof__(device) weakDevice = device;
  [device setFocusModeLockedWithLensPosition:self.focusDepth completionHandler:^(CMTime syncTime) {
    [weakDevice unlockForConfiguration];
  }];

}

RCT_CUSTOM_VIEW_PROPERTY(zoom, NSNumber, EXCamera)
{
  self.zoom = [RCTConvert CGFloat:json];
  [self updateZoom];
}

- (void)updateZoom {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  device.videoZoomFactor = (device.activeFormat.videoMaxZoomFactor - 1.0) * self.zoom + 1.0;
  
  [device unlockForConfiguration];
}

RCT_CUSTOM_VIEW_PROPERTY(whiteBalance, NSInteger, EXCamera)
{
  self.whiteBalance = [RCTConvert NSInteger:json];
  [self updateWhiteBalance];
}

- (void)updateWhiteBalance {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  if (self.whiteBalance == EXCameraWhiteBalanceAuto) {
    [device setWhiteBalanceMode:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance];
    [device unlockForConfiguration];
  } else {
    AVCaptureWhiteBalanceTemperatureAndTintValues temperatureAndTint = {
      .temperature = [[self class] temperatureForWhiteBalance:self.whiteBalance],
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
        RCTLogError(@"%s: %@", __func__, error);
      }
    }
  }
  
  [device unlockForConfiguration];
}

RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, EXCamera)
{
  self.scanning = [RCTConvert BOOL:json];
  if (self.videoCaptureDeviceInput != nil && self.isScanning) {
    [self initializeMetadataOutput];
  } else {
    [self.session removeOutput:_metadataOutput];
    _metadataOutput = nil;
  }
}

RCT_CUSTOM_VIEW_PROPERTY(barCodeTypes, NSArray, EXCamera)
{
  NSArray *types = [RCTConvert NSArray:json];
  NSSet *validTypes = [NSSet setWithArray:[[self class] validBarCodeTypes].allValues];
  for (id type in types) {
    if (![validTypes containsObject:type]) {
      RCTLogWarn(@"Unsupported BarCodeType: %@", type);
      return;
    }
  }
  self.barCodeTypes = types;
}

RCT_REMAP_METHOD(takePicture,
                 options:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  float quality = [options[@"quality"] floatValue];
#if TARGET_IPHONE_SIMULATOR
  UIImage *generatedPhoto = [self generatePhoto];
  NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
  response[@"uri"] = [self writeImage:photoData];
  response[@"width"] = @(generatedPhoto.size.width);
  response[@"height"] = @(generatedPhoto.size.height);
  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
  }
  resolve(response);
#else
  AVCaptureConnection *connection = [self.stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[[self class] videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];
  [self.stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    if (imageSampleBuffer && !error) {
      NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageSampleBuffer];

      UIImage *takenImage = [UIImage imageWithData:imageData];
      takenImage = [self cropImage:takenImage];

      NSData *takenImageData = UIImageJPEGRepresentation(takenImage, quality);
      response[@"uri"] = [self writeImage:takenImageData];

      response[@"width"] = @(takenImage.size.width);
      response[@"height"] = @(takenImage.size.height);

      if ([options[@"base64"] boolValue]) {
        response[@"base64"] = [takenImageData base64EncodedStringWithOptions:0];
      }

      if ([options[@"exif"] boolValue]) {
        int imageRotation;
        switch (takenImage.imageOrientation) {
          case UIImageOrientationLeft:
            imageRotation = 90;
            break;
          case UIImageOrientationRight:
            imageRotation = -90;
            break;
          case UIImageOrientationDown:
            imageRotation = 180;
            break;
          default:
            imageRotation = 0;
        }
        [self updatePhotoMetadata:imageSampleBuffer withAdditionalData:@{ @"Orientation": @(imageRotation) } response:response];
      }

      resolve(response);
    } else {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
    }
  }];
#endif
}

RCT_REMAP_METHOD(record,
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
#if TARGET_IPHONE_SIMULATOR
  reject(@"E_RECORDING_FAILED", @"Video recording is not supported on a simulator.", nil);
  return;
#endif
  if (self.movieFileOutput != nil && !self.movieFileOutput.isRecording) {
    if (options[@"maxDuration"]) {
      Float64 maxDuration = [options[@"maxDuration"] floatValue];
      self.movieFileOutput.maxRecordedDuration = CMTimeMakeWithSeconds(maxDuration, 30);
    }

    if (options[@"maxFileSize"]) {
      self.movieFileOutput.maxRecordedFileSize = [options[@"maxFileSize"] integerValue];
    }

    if (options[@"quality"]) {
      [self updateSessionPreset:[[self class] captureSessionPresetForVideoResolution:(EXCameraVideoResolution)[options[@"quality"] integerValue]]];
    }

    [self updateSessionAudioIsMuted:!!options[@"mute"]];

    AVCaptureConnection *connection = [self.movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[[self class] videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];

    dispatch_async(self.sessionQueue, ^{
      NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:[self generateFileName:@".mov"]];
      [self.movieFileOutput startRecordingToOutputFileURL:outputURL recordingDelegate:self];
      self.videoRecordedResolve = resolve;
      self.videoRecordedReject = reject;
    });
  } else {
    reject(@"E_RECORDING_FAILED", @"Starting video recording failed. Another recording might be in progress.", nil);
  }
}

RCT_EXPORT_METHOD(stopRecording) {
  [self.movieFileOutput stopRecording];
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

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  dispatch_async(self.sessionQueue, ^{
    if (self.presetCamera == AVCaptureDevicePositionUnspecified) {
      return;
    }
    
    AVCaptureStillImageOutput *stillImageOutput = [[AVCaptureStillImageOutput alloc] init];
    if ([self.session canAddOutput:stillImageOutput]) {
      stillImageOutput.outputSettings = @{AVVideoCodecKey : AVVideoCodecJPEG};
      [self.session addOutput:stillImageOutput];
      self.stillImageOutput = stillImageOutput;
    }
    
    AVCaptureMovieFileOutput *movieFileOutput = [[AVCaptureMovieFileOutput alloc] init];

    if ([self.session canAddOutput:movieFileOutput]) {
      [self.session addOutput:movieFileOutput];
      self.movieFileOutput = movieFileOutput;
    }

    if (self.isScanning) {
      [self initializeMetadataOutput];
    }

    __weak EXCameraManager *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
     [NSNotificationCenter.defaultCenter
      addObserverForName:AVCaptureSessionRuntimeErrorNotification
      object:self.session
      queue:nil
      usingBlock:^(NSNotification *note) {
        EXCameraManager *strongSelf = weakSelf;
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
  self.camera = nil;
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
    AVCaptureDevice *captureDevice = [self deviceWithMediaType:AVMediaTypeVideo preferringPosition:self.presetCamera];
    AVCaptureDeviceInput *captureDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];
    
    if (error || captureDeviceInput == nil) {
      RCTLog(@"%s: %@", __func__, error);
      return;
    }
    
    [self.session removeInput:self.videoCaptureDeviceInput];
    if ([self.session canAddInput:captureDeviceInput]) {
      [self.session addInput:captureDeviceInput];
      
      self.videoCaptureDeviceInput = captureDeviceInput;
      [self updateFlashMode];
      [self updateZoom];
      [self updateFocusMode];
      [self updateFocusDepth];
      [self updateWhiteBalance];
      self.previewLayer.connection.videoOrientation = [[self class] videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
      [self.metadataOutput setMetadataObjectTypes:self.metadataOutput.availableMetadataObjectTypes];
    }
    
    [self.session commitConfiguration];
  });
}

- (void)initializeMetadataOutput {
  AVCaptureMetadataOutput *metadataOutput = [[AVCaptureMetadataOutput alloc] init];
  if ([self.session canAddOutput:metadataOutput]) {
    [metadataOutput setMetadataObjectsDelegate:self queue:self.sessionQueue];
    [self.session addOutput:metadataOutput];
    
    NSMutableArray *possibleBarCodeTypes = [[NSMutableArray alloc] init];
    for (id type in self.barCodeTypes) {
      if ([metadataOutput.availableMetadataObjectTypes containsObject:type]) {
        [possibleBarCodeTypes addObject:type];
      }
    }
    [metadataOutput setMetadataObjectTypes:possibleBarCodeTypes];
    self.metadataOutput = metadataOutput;
  }
}

#pragma mark - internal

- (void)updateSessionPreset:(NSString *)preset
{
#if !(TARGET_IPHONE_SIMULATOR)
  if (preset) {
    dispatch_async(self.sessionQueue, ^{
      [self.session beginConfiguration];
      if ([self.session canSetSessionPreset:preset]) {
        self.session.sessionPreset = preset;
      }
      [self.session commitConfiguration];
    });
  }
#endif
}

- (void)updateSessionAudioIsMuted:(BOOL)isMuted
{
  dispatch_async(self.sessionQueue, ^{
    [self.session beginConfiguration];

    for (AVCaptureDeviceInput* input in [self.session inputs]) {
      if ([input.device hasMediaType:AVMediaTypeAudio]) {
        if (isMuted) {
          [self.session removeInput:input];
        }
        [self.session commitConfiguration];
        return;
      }
    }

    if (!isMuted) {
      NSError *error = nil;

      AVCaptureDevice *audioCaptureDevice = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeAudio];
      AVCaptureDeviceInput *audioDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:audioCaptureDevice error:&error];

      if (error || audioDeviceInput == nil) {
        RCTLogWarn(@"%s: %@", __func__, error);
        return;
      }

      if ([self.session canAddInput:audioDeviceInput]) {
        [self.session addInput:audioDeviceInput];
      }
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

- (NSString *)generateFileName:(NSString *)extension
{
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];
  NSString *directory = [self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"];
  [EXFileSystem ensureDirExistsWithPath:directory];
  return [directory stringByAppendingPathComponent:fileName];
}

- (NSString *)writeImage:(NSData *)image
{
  NSString *path = [self generateFileName:@".jpg"];
  [image writeToFile:path atomically:YES];
  NSURL *fileURL = [NSURL fileURLWithPath:path];
  return [fileURL absoluteString];
}

- (UIImage *)cropImage:(UIImage *)image
{
  CGRect outputRect = [_previewLayer metadataOutputRectOfInterestForRect:self.camera.frame];
  CGImageRef takenCGImage = image.CGImage;
  size_t width = CGImageGetWidth(takenCGImage);
  size_t height = CGImageGetHeight(takenCGImage);
  CGRect cropRect = CGRectMake(outputRect.origin.x * width, outputRect.origin.y * height, outputRect.size.width * width, outputRect.size.height * height);

  CGImageRef cropCGImage = CGImageCreateWithImageInRect(takenCGImage, cropRect);
  image = [UIImage imageWithCGImage:cropCGImage scale:image.scale orientation:image.imageOrientation];
  CGImageRelease(cropCGImage);
  return image;
}

- (void)updatePhotoMetadata:(CMSampleBufferRef)imageSampleBuffer withAdditionalData:(NSDictionary *)additionalData response:(NSMutableDictionary *)response
{
  CFDictionaryRef exifAttachments = CMGetAttachment(imageSampleBuffer, kCGImagePropertyExifDictionary, NULL);
  NSMutableDictionary *metadata = (__bridge NSMutableDictionary*)exifAttachments;
  metadata[(NSString *)kCGImagePropertyExifPixelYDimension] = response[@"width"];
  metadata[(NSString *)kCGImagePropertyExifPixelXDimension] = response[@"height"];
  
  for (id key in additionalData) {
    metadata[key] = additionalData[key];
  }
  
  NSDictionary *gps = metadata[(NSString *)kCGImagePropertyGPSDictionary];
  if (gps) {
    for (NSString *gpsKey in gps) {
      metadata[[@"GPS" stringByAppendingString:gpsKey]] = gps[gpsKey];
    }
  }

  response[@"exif"] = metadata;
}

- (UIImage *)generatePhoto
{
  CGRect outputRect = self.camera.bounds;
  CGSize outputSize = outputRect.size;
  UIImage *image;
  UIGraphicsBeginImageContextWithOptions(outputSize, YES, 0);
    UIColor *color = [UIColor blackColor];
    [color setFill];
    UIRectFill(outputRect);
    NSDate *currentDate = [NSDate date];
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"dd.MM.YY HH:mm:ss"];
    NSString *text = [dateFormatter stringFromDate:currentDate];
    NSDictionary *attributes = [NSDictionary dictionaryWithObjects: @[[UIFont systemFontOfSize:18.0], [UIColor orangeColor]]
                                                         forKeys: @[NSFontAttributeName, NSForegroundColorAttributeName]];
    [text drawAtPoint:CGPointMake(outputSize.width * 0.1, outputSize.height * 0.9) withAttributes:attributes];
    image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

#pragma mark - enum conversion

+ (AVCaptureVideoOrientation)videoOrientationForInterfaceOrientation:(UIInterfaceOrientation)orientation
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

+ (float)temperatureForWhiteBalance:(EXCameraWhiteBalance)whiteBalance
{
  switch (whiteBalance) {
    case EXCameraWhiteBalanceSunny: default:
      return 5200;
    case EXCameraWhiteBalanceCloudy:
      return 6000;
    case EXCameraWhiteBalanceShadow:
      return 7000;
    case EXCameraWhiteBalanceIncandescent:
      return 3000;
    case EXCameraWhiteBalanceFluorescent:
      return 4200;
  }
}

+ (NSString *)captureSessionPresetForVideoResolution:(EXCameraVideoResolution)resolution
{
  switch (resolution) {
    case EXCameraVideo2160p:
      return AVCaptureSessionPreset3840x2160;
    case EXCameraVideo1080p:
      return AVCaptureSessionPreset1920x1080;
    case EXCameraVideo720p:
      return AVCaptureSessionPreset1280x720;
    case EXCameraVideo4x3:
      return AVCaptureSessionPreset640x480;
    default:
      return AVCaptureSessionPresetHigh;
  }
}

#pragma mark - delegate methods

- (void)captureOutput:(AVCaptureFileOutput *)captureOutput
didFinishRecordingToOutputFileAtURL:(NSURL *)outputFileURL
      fromConnections:(NSArray *)connections
                error:(NSError *)error
{
  BOOL success = YES;
  if ([error code] != noErr) {
    id value = [[error userInfo] objectForKey:AVErrorRecordingSuccessfullyFinishedKey];
    if (value) {
      success = [value boolValue];
    }
  }
  if (success && self.videoRecordedResolve != nil) {
    self.videoRecordedResolve(@{ @"uri": outputFileURL.absoluteString });
  } else if (self.videoRecordedReject != nil) {
    self.videoRecordedReject(@"E_RECORDING_FAILED", @"An error occurred while recording a video.", error);
  }
  self.videoRecordedResolve = nil;
  self.videoRecordedReject = nil;
  // reset recording settings
  self.movieFileOutput.maxRecordedDuration = kCMTimeInvalid;
  self.movieFileOutput.maxRecordedFileSize = 0;

  if (self.session.sessionPreset != AVCaptureSessionPresetHigh) {
    [self updateSessionPreset:AVCaptureSessionPresetHigh];
  }
}

- (void)captureOutput:(AVCaptureOutput *)captureOutput didOutputMetadataObjects:(NSArray *)metadataObjects
       fromConnection:(AVCaptureConnection *)connection
{
  for (AVMetadataMachineReadableCodeObject *metadata in metadataObjects) {
    for (id barcodeType in self.barCodeTypes) {
      if ([metadata.type isEqualToString:barcodeType]) {
        
        NSDictionary *event = @{
                                @"type" : metadata.type,
                                @"data" : metadata.stringValue
                                };
        
        [self.camera onCodeRead:event];
      }
    }
  }
}

@end
