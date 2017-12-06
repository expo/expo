#import <React/RCTBridge.h>
#import "EXCamera.h"
#import "EXCameraManager.h"
#import "EXFileSystem.h"
#import "EXCameraPermissionRequester.h"
#import "EXUnversioned.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <AVFoundation/AVFoundation.h>
#import <AssetsLibrary/ALAssetsLibrary.h>
#import <ImageIO/ImageIO.h>
#import "EXImageUtils.h"
#import "EXCameraUtils.h"

@interface EXCameraManager ()

@property (assign, nonatomic) CGFloat zoom;
@property (assign, nonatomic) float focusDepth;
@property (assign, nonatomic) NSInteger flashMode;
@property (assign, nonatomic) NSInteger autoFocus;
@property (assign, nonatomic) NSInteger whiteBalance;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;
@property (nonatomic, assign, getter=isReadingBarCodes) BOOL barCodeReading;

@property (nonatomic, strong) RCTPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock videoRecordedReject;
@property (nonatomic, strong) id faceDetectorManager;

@end

@implementation EXCameraManager

RCT_EXPORT_MODULE(ExponentCameraManager);
RCT_EXPORT_VIEW_PROPERTY(onCameraReady, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onMountError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onBarCodeRead, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onFacesDetected, RCTDirectEventBlock);

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
    self.sessionQueue = dispatch_queue_create("cameraManagerQueue", DISPATCH_QUEUE_SERIAL);
    self.faceDetectorManager = [self createFaceDetectorManager];
  }
  return self;
}

- (UIView *)view
{
  self.session = [[AVCaptureSession alloc] init];
  
#if !(TARGET_IPHONE_SIMULATOR)
  self.previewLayer = [[AVCaptureVideoPreviewLayer alloc] initWithSession:_session];
  [self.previewLayer setVideoGravity:AVLayerVideoGravityResizeAspectFill];
  [self.previewLayer setNeedsDisplayOnBoundsChange:YES];
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
           @"FaceDetection" : [_faceDetectorManager constantsToExport]
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onCameraReady", @"onMountError", @"onBarCodeRead", @"onFacesDetected"];
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
      AVCaptureDevice *captureDevice = [EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition:(AVCaptureDevicePosition)position];
      
      if (captureDevice == nil) {
        return;
      }
      
      self.presetCamera = type;
      
      NSError *error = nil;
      AVCaptureDeviceInput *captureDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];
      
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
      .temperature = [EXCameraUtils temperatureForWhiteBalance:self.whiteBalance],
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

RCT_CUSTOM_VIEW_PROPERTY(faceDetectorEnabled, BOOL, EXCamera)
{
  [_faceDetectorManager setIsEnabled:json];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectionMode, NSInteger, EXCamera)
{
  [_faceDetectorManager setMode:json];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectionLandmarks, NSString, EXCamera)
{
  [_faceDetectorManager setLandmarksDetected:json];
}

RCT_CUSTOM_VIEW_PROPERTY(faceDetectionClassifications, NSString, EXCamera)
{
  [_faceDetectorManager setClassificationsDetected:json];
}

RCT_CUSTOM_VIEW_PROPERTY(barCodeScannerEnabled, BOOL, EXCamera)
{
  self.barCodeReading = [RCTConvert BOOL:json];
  [self _setupOrDisableBarcodeScanner];
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
  NSString *path = [self generateFileName:@".jpg"];
#if TARGET_IPHONE_SIMULATOR
  UIImage *generatedPhoto = [EXImageUtils generatePhotoOfSize:CGSizeMake(200, 200)];
  NSData *photoData = UIImageJPEGRepresentation(generatedPhoto, quality);
  response[@"uri"] = [EXImageUtils writeImage:photoData toPath:path];
  response[@"width"] = @(generatedPhoto.size.width);
  response[@"height"] = @(generatedPhoto.size.height);
  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [photoData base64EncodedStringWithOptions:0];
  }
  resolve(response);
#else
  AVCaptureConnection *connection = [self.stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];
  [self.stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    if (imageSampleBuffer && !error) {
      NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageSampleBuffer];
      
      UIImage *takenImage = [UIImage imageWithData:imageData];

      CGRect frame = [_previewLayer metadataOutputRectOfInterestForRect:_camera.frame];
      CGImageRef takenCGImage = takenImage.CGImage;
      size_t width = CGImageGetWidth(takenCGImage);
      size_t height = CGImageGetHeight(takenCGImage);
      CGRect cropRect = CGRectMake(frame.origin.x * width, frame.origin.y * height, frame.size.width * width, frame.size.height * height);
      takenImage = [EXImageUtils cropImage:takenImage toRect:cropRect];
      
      NSData *takenImageData = UIImageJPEGRepresentation(takenImage, quality);
      response[@"uri"] = [EXImageUtils writeImage:takenImageData toPath:path];
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
        [EXImageUtils updatePhotoMetadata:imageSampleBuffer withAdditionalData:@{ @"Orientation": @(imageRotation) } inResponse:response]; // TODO
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
  if (_movieFileOutput == nil) {
    // At the time of writing AVCaptureMovieFileOutput and AVCaptureVideoDataOutput (> GMVDataOutput)
    // cannot coexist on the same AVSession (see: https://stackoverflow.com/a/4986032/1123156).
    // We stop face detection here and restart it in when AVCaptureMovieFileOutput finishes recording.
    [_faceDetectorManager stopFaceDetection];
    [self setupMovieFileCapture];
  }

  if (self.movieFileOutput != nil && !self.movieFileOutput.isRecording && _videoRecordedResolve == nil && _videoRecordedReject == nil) {
    if (options[@"maxDuration"]) {
      Float64 maxDuration = [options[@"maxDuration"] floatValue];
      self.movieFileOutput.maxRecordedDuration = CMTimeMakeWithSeconds(maxDuration, 30);
    }
    
    if (options[@"maxFileSize"]) {
      self.movieFileOutput.maxRecordedFileSize = [options[@"maxFileSize"] integerValue];
    }
    
    if (options[@"quality"]) {
      [self updateSessionPreset:[EXCameraUtils captureSessionPresetForVideoResolution:(EXCameraVideoResolution)[options[@"quality"] integerValue]]];
    }

    [self updateSessionAudioIsMuted:!!options[@"mute"]];
    
    AVCaptureConnection *connection = [self.movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];
    
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

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  NSDictionary *cameraPermissions = [EXCameraPermissionRequester permissions];
  if (![cameraPermissions[@"status"] isEqualToString:@"granted"]) {
    [self.camera onMountingError:@{@"message": @"Camera permissions not granted - component could not be rendered."}];
    return;
  }
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
    
    [_faceDetectorManager maybeStartFaceDetectionOnSession:_session withPreviewLayer:_previewLayer];
    [self _setupOrDisableBarcodeScanner];

    __weak EXCameraManager *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
     [NSNotificationCenter.defaultCenter addObserverForName:AVCaptureSessionRuntimeErrorNotification object:self.session queue:nil usingBlock:^(NSNotification *note) {
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
    [_faceDetectorManager stopFaceDetection];
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
  UIInterfaceOrientation interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  AVCaptureVideoOrientation orientation = [EXCameraUtils videoOrientationForInterfaceOrientation:interfaceOrientation];
  dispatch_async(self.sessionQueue, ^{
    [self.session beginConfiguration];
    
    NSError *error = nil;
    AVCaptureDevice *captureDevice = [EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition:self.presetCamera];
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
      [self.previewLayer.connection setVideoOrientation:orientation];
      [self _updateMetadataObjectsToRecognize];
    }
    
    [self.session commitConfiguration];
  });
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

# pragma mark - AVCaptureMetadataOutput

- (void)_setupOrDisableBarcodeScanner
{
  [self _setupOrDisableMetadataOutput];
  [self _updateMetadataObjectsToRecognize];
}

- (void)_setupOrDisableMetadataOutput
{
  if ([self isReadingBarCodes] && (_metadataOutput == nil || ![self.session.outputs containsObject:_metadataOutput])) {
    AVCaptureMetadataOutput *metadataOutput = [[AVCaptureMetadataOutput alloc] init];
    if ([self.session canAddOutput:metadataOutput]) {
      [metadataOutput setMetadataObjectsDelegate:self queue:self.sessionQueue];
      [self.session addOutput:metadataOutput];
      self.metadataOutput = metadataOutput;
    }
  } else if (_metadataOutput != nil && ![self isReadingBarCodes]) {
    [self.session removeOutput:_metadataOutput];
    _metadataOutput = nil;
  }
}

- (void)_updateMetadataObjectsToRecognize
{
  if (_metadataOutput == nil) {
    return;
  }
  
  NSArray<AVMetadataObjectType> *availableRequestedObjectTypes = [[NSArray alloc] init];
  NSArray<AVMetadataObjectType> *requestedObjectTypes = [NSArray arrayWithArray:self.barCodeTypes];
  NSArray<AVMetadataObjectType> *availableObjectTypes = _metadataOutput.availableMetadataObjectTypes;
  
  for(AVMetadataObjectType objectType in requestedObjectTypes) {
    if ([availableObjectTypes containsObject:objectType]) {
      availableRequestedObjectTypes = [availableRequestedObjectTypes arrayByAddingObject:objectType];
    }
  }
  
  [_metadataOutput setMetadataObjectTypes:availableRequestedObjectTypes];
}

- (void)captureOutput:(AVCaptureOutput *)captureOutput didOutputMetadataObjects:(NSArray *)metadataObjects
       fromConnection:(AVCaptureConnection *)connection
{
  for(AVMetadataObject *metadata in metadataObjects) {
    if([metadata isKindOfClass:[AVMetadataMachineReadableCodeObject class]]) {
      AVMetadataMachineReadableCodeObject *codeMetadata = (AVMetadataMachineReadableCodeObject *) metadata;
      for (id barcodeType in self.barCodeTypes) {
        if ([metadata.type isEqualToString:barcodeType]) {
          
          NSDictionary *event = @{
                                  @"type" : codeMetadata.type,
                                  @"data" : codeMetadata.stringValue
                                  };
          
          [self.camera onCodeRead:event];
        }
      }
    }
  }
}

# pragma mark - AVCaptureMovieFileOutput

- (void)setupMovieFileCapture
{
  AVCaptureMovieFileOutput *movieFileOutput = [[AVCaptureMovieFileOutput alloc] init];
  
  if ([self.session canAddOutput:movieFileOutput]) {
    [self.session addOutput:movieFileOutput];
    self.movieFileOutput = movieFileOutput;
  }
}

- (void)cleanupMovieFileCapture
{
  if ([_session.outputs containsObject:_movieFileOutput]) {
    [_session removeOutput:_movieFileOutput];
    _movieFileOutput = nil;
  }
}

- (void)captureOutput:(AVCaptureFileOutput *)captureOutput didFinishRecordingToOutputFileAtURL:(NSURL *)outputFileURL fromConnections:(NSArray *)connections error:(NSError *)error
{
  BOOL success = YES;
  if ([error code] != noErr) {
    NSNumber *value = [[error userInfo] objectForKey:AVErrorRecordingSuccessfullyFinishedKey];
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

  [self cleanupMovieFileCapture];
  // If face detection has been running prior to recording to file
  // we reenable it here (see comment in -record).
  [_faceDetectorManager maybeStartFaceDetectionOnSession:_session withPreviewLayer:_previewLayer];

  if (self.session.sessionPreset != AVCaptureSessionPresetHigh) {
    [self updateSessionPreset:AVCaptureSessionPresetHigh];
  }
}

# pragma mark - Face detector

- (id)createFaceDetectorManager
{
  Class faceDetectorManagerClass = NSClassFromString(@"EXFaceDetectorManager");
  Class faceDetectorManagerStubClass = NSClassFromString(@"EXFaceDetectorManagerStub");
  
  if (faceDetectorManagerClass) {
    return [[faceDetectorManagerClass alloc] initWithSessionQueue:_sessionQueue delegate:self];
  } else if (faceDetectorManagerStubClass) {
    return [[faceDetectorManagerStubClass alloc] init];
  }
  
  return nil;
}

- (void)onFacesDetected:(NSArray<NSDictionary *> *)faces
{
  if (_camera) {
    [_camera onFacesDetected:@{
                               @"type": @"face",
                               @"faces": faces
                               }];
  }
}

# pragma mark - Utilities

- (NSString *)generateFileName:(NSString *)extension
{
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];
  NSString *directory = [self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"];
  [EXFileSystem ensureDirExistsWithPath:directory];
  return [directory stringByAppendingPathComponent:fileName];
}

@end
