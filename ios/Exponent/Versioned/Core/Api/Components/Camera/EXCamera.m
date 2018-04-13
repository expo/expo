#import "EXCamera.h"
#import "EXCameraUtils.h"
#import "EXImageUtils.h"
#import "EXCameraManager.h"
#import "EXCameraPermissionRequester.h"
#import "EXFileSystem.h"
#import "EXUnversioned.h"
#import "EXUtil.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <AVFoundation/AVFoundation.h>

@interface EXCamera ()

@property (nonatomic, weak) RCTBridge *bridge;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, strong) RCTPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock videoRecordedReject;
@property (nonatomic, strong) id faceDetectorManager;

@property (nonatomic, copy) RCTDirectEventBlock onCameraReady;
@property (nonatomic, copy) RCTDirectEventBlock onMountError;
@property (nonatomic, copy) RCTDirectEventBlock onBarCodeRead;
@property (nonatomic, copy) RCTDirectEventBlock onFacesDetected;

@end

@implementation EXCamera

static NSDictionary *defaultFaceDetectorOptions = nil;

- (id)initWithBridge:(RCTBridge *)bridge
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
    [self changePreviewOrientation:[UIApplication sharedApplication].statusBarOrientation];
    [self initializeCaptureSessionInput];
    [self startSession];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(orientationChanged:)
                                                 name:UIDeviceOrientationDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidForeground:)
                                                 name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                               object:self.bridge];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidBackground:)
                                                 name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
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

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.previewLayer.frame = self.bounds;
  [self setBackgroundColor:[UIColor blackColor]];
  [self.layer insertSublayer:self.previewLayer atIndex:0];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  [self insertSubview:view atIndex:atIndex + 1];
  [super insertReactSubview:view atIndex:atIndex];
  return;
}

- (void)removeReactSubview:(UIView *)subview
{
  [subview removeFromSuperview];
  [super removeReactSubview:subview];
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
}

- (void)updateFocusMode
{
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

- (void)updateFocusDepth
{
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

- (void)updateWhiteBalance
{
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

- (void)takePicture:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  AVCaptureConnection *connection = [self.stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];
  [self.stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    if (imageSampleBuffer && !error) {
      NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageSampleBuffer];
      
      UIImage *takenImage = [UIImage imageWithData:imageData];
      
      CGRect frame = [_previewLayer metadataOutputRectOfInterestForRect:self.frame];
      CGImageRef takenCGImage = takenImage.CGImage;
      size_t width = CGImageGetWidth(takenCGImage);
      size_t height = CGImageGetHeight(takenCGImage);
      CGRect cropRect = CGRectMake(frame.origin.x * width, frame.origin.y * height, frame.size.width * width, frame.size.height * height);
      takenImage = [EXImageUtils cropImage:takenImage toRect:cropRect];
      
      NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
      float quality = [options[@"quality"] floatValue];
      NSData *takenImageData = UIImageJPEGRepresentation(takenImage, quality);
      NSString *path = [EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
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
}

- (void)record:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
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
    
    if (options[@"quality"]) {
      [self updateSessionPreset:[EXCameraUtils captureSessionPresetForVideoResolution:(EXCameraVideoResolution)[options[@"quality"] integerValue]]];
    }
    
    [self updateSessionAudioIsMuted:options[@"mute"] && [options[@"mute"] boolValue]];
    
    AVCaptureConnection *connection = [self.movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[EXCameraUtils videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];
    
    dispatch_async(self.sessionQueue, ^{
      NSString *path = [EXFileSystem generatePathInDirectory:[self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".mov"];
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

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  NSDictionary *cameraPermissions = [EXCameraPermissionRequester permissions];
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
      [stillImageOutput setHighResolutionStillImageOutputEnabled:YES];
      self.stillImageOutput = stillImageOutput;
    }
    
    [_faceDetectorManager maybeStartFaceDetectionOnSession:_session withPreviewLayer:_previewLayer];
    [self setupOrDisableBarcodeScanner];
    
    __weak EXCamera *weakSelf = self;
    [self setRuntimeErrorHandlingObserver:
     [NSNotificationCenter.defaultCenter addObserverForName:AVCaptureSessionRuntimeErrorNotification object:self.session queue:nil usingBlock:^(NSNotification *note) {
      EXCamera *strongSelf = weakSelf;
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
  [EXUtil performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
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

- (void)orientationChanged:(NSNotification *)notification
{
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  [self changePreviewOrientation:orientation];
}

- (void)changePreviewOrientation:(UIInterfaceOrientation)orientation
{
  __weak typeof(self) weakSelf = self;
  AVCaptureVideoOrientation videoOrientation = [EXCameraUtils videoOrientationForInterfaceOrientation:orientation];
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
  if (_onFacesDetected) {
    _onFacesDetected(@{
                       @"type": @"face",
                       @"faces": faces
                       });
  }
}

@end
