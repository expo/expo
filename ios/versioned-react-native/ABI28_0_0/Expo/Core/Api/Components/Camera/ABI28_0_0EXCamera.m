#import "ABI28_0_0EXCamera.h"
#import "ABI28_0_0EXCameraUtils.h"
#import "ABI28_0_0EXImageUtils.h"
#import "ABI28_0_0EXCameraManager.h"
#import "ABI28_0_0EXCameraPermissionRequester.h"
#import "ABI28_0_0EXFileSystem.h"
#import "ABI28_0_0EXUnversioned.h"
#import "ABI28_0_0EXUtil.h"
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import <AVFoundation/AVFoundation.h>

@interface ABI28_0_0EXCamera ()

@property (nonatomic, weak) ABI28_0_0RCTBridge *bridge;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, strong) ABI28_0_0RCTPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) ABI28_0_0RCTPromiseRejectBlock videoRecordedReject;
@property (nonatomic, strong) id faceDetectorManager;

@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onCameraReady;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onMountError;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onBarCodeRead;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onFacesDetected;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onPictureSaved;

@end

@implementation ABI28_0_0EXCamera

static NSDictionary *defaultFaceDetectorOptions = nil;

- (id)initWithBridge:(ABI28_0_0RCTBridge *)bridge
{
  if ((self = [super init])) {
    self.bridge = bridge;
    self.session = [AVCaptureSession new];
    self.sessionQueue = dispatch_queue_create("cameraQueue", DISPATCH_QUEUE_SERIAL);
    self.faceDetectorManager = [self createFaceDetectorManager];
#if !(TARGET_IPHONE_SIMULATOR)
    self.previewLayer =
    [AVCaptureVideoPreviewLayer layerWithSession:self.session];
    self.previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    self.previewLayer.needsDisplayOnBoundsChange = YES;
#endif
    self.paused = NO;
    self.pictureSize = AVCaptureSessionPresetHigh;
    [self changePreviewOrientation:[UIApplication sharedApplication].statusBarOrientation];
    [self initializeCaptureSessionInput];
    [self startSession];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(orientationChanged:)
                                                 name:UIDeviceOrientationDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidForeground:)
                                                 name:@"EXKernelBridgeDidForegroundNotification"
                                               object:self.bridge];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidBackground:)
                                                 name:@"EXKernelBridgeDidBackgroundNotification"
                                               object:self.bridge];
    
  }
  return self;
}

- (void)onReady:(NSDictionary *)event
{
  if (_onCameraReady) {
    _onCameraReady(nil);
  }
}

- (void)onMountingError:(NSDictionary *)event
{
  if (_onMountError) {
    _onMountError(event);
  }
}

- (void)onCodeRead:(NSDictionary *)event
{
  if (_onBarCodeRead) {
    _onBarCodeRead(event);
  }
}

- (void)onPictureSaved:(NSDictionary *)event
{
  if (_onPictureSaved) {
    _onPictureSaved(event);
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.previewLayer.frame = self.bounds;
  [self setBackgroundColor:[UIColor blackColor]];
  [self.layer insertSublayer:self.previewLayer atIndex:0];
}

- (void)insertReactABI28_0_0Subview:(UIView *)view atIndex:(NSInteger)atIndex
{
  [self insertSubview:view atIndex:atIndex + 1];
  [super insertReactABI28_0_0Subview:view atIndex:atIndex];
  return;
}

- (void)removeReactABI28_0_0Subview:(UIView *)subview
{
  [subview removeFromSuperview];
  [super removeReactABI28_0_0Subview:subview];
  return;
}

- (void)removeFromSuperview
{
  [self stopSession];
  [super removeFromSuperview];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
}

-(void)updateType
{
  dispatch_async(self.sessionQueue, ^{
    [self initializeCaptureSessionInput];
    if (!self.session.isRunning) {
      [self startSession];
    }
  });
}

- (void)updateFlashMode
{
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (self.flashMode == ABI28_0_0EXCameraFlashModeTorch) {
    if (![device hasTorch])
      return;
    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
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
          ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
        }
      }
    }
  } else {
    if (![device hasFlash])
      return;
    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
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
          ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
        }
      }
    }
  }
  
  [device unlockForConfiguration];
}

- (void)updateFocusMode
{
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  if ([device isFocusModeSupported:self.autoFocus]) {
    if ([device lockForConfiguration:&error]) {
      [device setFocusMode:self.autoFocus];
    } else {
      if (error) {
        ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
      }
    }
  }
  
  [device unlockForConfiguration];
}

- (void)updateFocusDepth
{
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (device == nil || device.focusMode != ABI28_0_0EXCameraAutoFocusOff) {
    return;
  }
  
  if (![device respondsToSelector:@selector(isLockingFocusWithCustomLensPositionSupported)] || ![device isLockingFocusWithCustomLensPositionSupported]) {
    ABI28_0_0RCTLogWarn(@"%s: Setting focusDepth isn't supported for this camera device", __func__);
    return;
  }
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  __weak __typeof__(device) weakDevice = device;
  [device setFocusModeLockedWithLensPosition:self.focusDepth completionHandler:^(CMTime syncTime) {
    [weakDevice unlockForConfiguration];
  }];
}

- (void)updateZoom {
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  device.videoZoomFactor = (device.activeFormat.videoMaxZoomFactor - 1.0) * self.zoom + 1.0;
  
  [device unlockForConfiguration];
}

- (void)updateWhiteBalance
{
  AVCaptureDevice *device = [self.videoCaptureDeviceInput device];
  NSError *error = nil;
  
  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
    }
    return;
  }
  
  if (self.whiteBalance == ABI28_0_0EXCameraWhiteBalanceAuto) {
    [device setWhiteBalanceMode:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance];
    [device unlockForConfiguration];
  } else {
    AVCaptureWhiteBalanceTemperatureAndTintValues temperatureAndTint = {
      .temperature = [ABI28_0_0EXCameraUtils temperatureForWhiteBalance:self.whiteBalance],
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
        ABI28_0_0RCTLogError(@"%s: %@", __func__, error);
      }
    }
  }
  
  [device unlockForConfiguration];
}

- (void)updatePictureSize
{
  [self updateSessionPreset:self.pictureSize];
}

- (void)updateFaceDetecting:(id)faceDetecting
{
  [_faceDetectorManager setIsEnabled:faceDetecting];
}

- (void)updateFaceDetectionMode:(id)requestedMode
{
  [_faceDetectorManager setMode:requestedMode];
}

- (void)updateFaceDetectionLandmarks:(id)requestedLandmarks
{
  [_faceDetectorManager setLandmarksDetected:requestedLandmarks];
}

- (void)updateFaceDetectionClassifications:(id)requestedClassifications
{
  [_faceDetectorManager setClassificationsDetected:requestedClassifications];
}

- (void)takePicture:(NSDictionary *)options resolve:(ABI28_0_0RCTPromiseResolveBlock)resolve reject:(ABI28_0_0RCTPromiseRejectBlock)reject
{
  AVCaptureConnection *connection = [self.stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[ABI28_0_0EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];
  [self.stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    if (imageSampleBuffer && !error) {
      BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
      if (useFastMode) {
        resolve(nil);
      }
      NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageSampleBuffer];
      
      UIImage *takenImage = [UIImage imageWithData:imageData];

      CGImageRef takenCGImage = takenImage.CGImage;
      CGSize previewSize;
      if (UIInterfaceOrientationIsPortrait([[UIApplication sharedApplication] statusBarOrientation]))
      {
        previewSize = CGSizeMake(self.previewLayer.frame.size.height, self.previewLayer.frame.size.width);
      } else {
        previewSize = CGSizeMake(self.previewLayer.frame.size.width, self.previewLayer.frame.size.height);
      }
      
      CGRect cropRect = CGRectMake(0, 0, CGImageGetWidth(takenCGImage), CGImageGetHeight(takenCGImage));
      CGRect croppedSize = AVMakeRectWithAspectRatioInsideRect(previewSize, cropRect);
      takenImage = [ABI28_0_0EXImageUtils cropImage:takenImage toRect:croppedSize];
      
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      float quality = [options[@"quality"] floatValue];
      NSData *takenImageData = UIImageJPEGRepresentation(takenImage, quality);
      NSString *path = [ABI28_0_0EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
      response[@"uri"] = [ABI28_0_0EXImageUtils writeImage:takenImageData toPath:path];
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
        [ABI28_0_0EXImageUtils updatePhotoMetadata:imageSampleBuffer withAdditionalData:@{ @"Orientation": @(imageRotation) } inResponse:response]; // TODO
      }
      
      if (useFastMode) {
        [self onPictureSaved:@{@"data": response, @"id": options[@"id"]}];
      } else {
        resolve(response);
      }
    } else {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
    }
  }];
}

- (void)record:(NSDictionary *)options resolve:(ABI28_0_0RCTPromiseResolveBlock)resolve reject:(ABI28_0_0RCTPromiseRejectBlock)reject
{
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
    
    AVCaptureSessionPreset preset;
    if (options[@"quality"]) {
      preset = [ABI28_0_0EXCameraUtils captureSessionPresetForVideoResolution:(ABI28_0_0EXCameraVideoResolution)[options[@"quality"] integerValue]];
    } else if ([self.session.sessionPreset isEqual:AVCaptureSessionPresetPhoto]) {
      preset = AVCaptureSessionPresetHigh;
    }
    
    if (preset != nil) {
      [self updateSessionPreset:preset];
    }
    
    [self updateSessionAudioIsMuted:options[@"mute"] && [options[@"mute"] boolValue]];
    
    AVCaptureConnection *connection = [self.movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[ABI28_0_0EXCameraUtils videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];
    
    dispatch_async(self.sessionQueue, ^{
      NSString *path = [ABI28_0_0EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".mov"];
      NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:path];
      [self.movieFileOutput startRecordingToOutputFileURL:outputURL recordingDelegate:self];
      self.videoRecordedResolve = resolve;
      self.videoRecordedReject = reject;
    });
  }
}

- (void)stopRecording
{
  [self.movieFileOutput stopRecording];
}

- (void)resumePreview
{
  [[self.previewLayer connection] setEnabled:YES];
}

- (void)pausePreview
{
  [[self.previewLayer connection] setEnabled:NO];
}

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  NSDictionary *cameraPermissions = [ABI28_0_0EXCameraPermissionRequester permissions];
  if (![cameraPermissions[@"status"] isEqualToString:@"granted"]) {
    [self onMountingError:@{@"message": @"Camera permissions not granted - component could not be rendered."}];
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
    [self setupOrDisableBarcodeScanner];
    
    __weak ABI28_0_0EXCamera *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
     [NSNotificationCenter.defaultCenter addObserverForName:AVCaptureSessionRuntimeErrorNotification object:self.session queue:nil usingBlock:^(NSNotification *note) {
      ABI28_0_0EXCamera *strongSelf = weakSelf;
      dispatch_async(strongSelf.sessionQueue, ^{
        // Manually restarting the session since it must
        // have been stopped due to an error.
        [strongSelf.session startRunning];
        [strongSelf onReady:nil];
      });
    }]];
    
    [self.session startRunning];
    [self onReady:nil];
  });
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  dispatch_async(self.sessionQueue, ^{
    [_faceDetectorManager stopFaceDetection];
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

- (void)initializeCaptureSessionInput
{
  if (self.videoCaptureDeviceInput.device.position == self.presetCamera) {
    return;
  }
  __block UIInterfaceOrientation interfaceOrientation;
  [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
  AVCaptureVideoOrientation orientation = [ABI28_0_0EXCameraUtils videoOrientationForInterfaceOrientation:interfaceOrientation];
  dispatch_async(self.sessionQueue, ^{
    [self.session beginConfiguration];
    
    NSError *error = nil;
    AVCaptureDevice *captureDevice = [ABI28_0_0EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition:self.presetCamera];
    AVCaptureDeviceInput *captureDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];
    
    if (error || captureDeviceInput == nil) {
      ABI28_0_0RCTLog(@"%s: %@", __func__, error);
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

- (void)updateSessionPreset:(AVCaptureSessionPreset)preset
{
#if !(TARGET_IPHONE_SIMULATOR)
  if (preset) {
    if (self.isDetectingFaces && [preset isEqual:AVCaptureSessionPresetPhoto]) {
      ABI28_0_0RCTLog(@"AVCaptureSessionPresetPhoto not supported during face detection. Falling back to AVCaptureSessionPresetHigh");
      preset = AVCaptureSessionPresetHigh;
    }
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
        ABI28_0_0RCTLogWarn(@"%s: %@", __func__, error);
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

- (void)orientationChanged:(NSNotification *)notification
{
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  [self changePreviewOrientation:orientation];
}

- (void)changePreviewOrientation:(UIInterfaceOrientation)orientation
{
  __weak typeof(self) weakSelf = self;
  AVCaptureVideoOrientation videoOrientation = [ABI28_0_0EXCameraUtils videoOrientationForInterfaceOrientation:orientation];
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf && strongSelf.previewLayer.connection.isVideoOrientationSupported) {
      [strongSelf.previewLayer.connection setVideoOrientation:videoOrientation];
    }
  });
}

# pragma mark - AVCaptureMetadataOutput

- (void)setupOrDisableBarcodeScanner
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
          
          [self onCodeRead:event];
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
  
  if (self.session.sessionPreset != self.pictureSize) {
    [self updateSessionPreset:self.pictureSize];
  }
}

# pragma mark - Face detector

- (id)createFaceDetectorManager
{
  Class faceDetectorManagerClass = NSClassFromString(@"ABI28_0_0EXFaceDetectorManager");
  Class faceDetectorManagerStubClass = NSClassFromString(@"ABI28_0_0EXFaceDetectorManagerStub");
  
  if (faceDetectorManagerClass) {
    return [[faceDetectorManagerClass alloc] initWithSessionQueue:_sessionQueue delegate:self];
  } else if (faceDetectorManagerStubClass) {
    return [[faceDetectorManagerStubClass alloc] init];
  }
  
  return nil;
}

- (void)onFacesDetected:(NSArray<NSDictionary *> *)faces
{
  if (_onFacesDetected) {
    _onFacesDetected(@{
                       @"type": @"face",
                       @"faces": faces
                       });
  }
}

@end
