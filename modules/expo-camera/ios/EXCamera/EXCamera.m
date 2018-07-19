#import <AVFoundation/AVFoundation.h>

#import <EXCamera/EXCamera.h>
#import <EXCamera/EXCameraUtils.h>
#import <EXCamera/EXCameraManager.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXFaceDetectorInterface/EXFaceDetectorManager.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXCore/EXUtilities.h>

@interface EXCamera ()

@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) id<EXFaceDetectorManager> faceDetectorManager;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, strong) EXPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) EXPromiseRejectBlock videoRecordedReject;

@property (nonatomic, copy) EXDirectEventBlock onCameraReady;
@property (nonatomic, copy) EXDirectEventBlock onMountError;
@property (nonatomic, copy) EXDirectEventBlock onBarCodeRead;
@property (nonatomic, copy) EXDirectEventBlock onFacesDetected;
@property (nonatomic, copy) EXDirectEventBlock onPictureSaved;

@end

@implementation EXCamera

static NSDictionary *defaultFaceDetectorOptions = nil;

- (id)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _moduleRegistry = moduleRegistry;
    _session = [AVCaptureSession new];
    _sessionQueue = dispatch_queue_create("cameraQueue", DISPATCH_QUEUE_SERIAL);
    _faceDetectorManager = [self createFaceDetectorManager];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXAppLifecycleService)];
    _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
#if !(TARGET_IPHONE_SIMULATOR)
    _previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:_session];
    _previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    _previewLayer.needsDisplayOnBoundsChange = YES;
#endif
    _paused = NO;
    _pictureSize = AVCaptureSessionPresetHigh;
    [self changePreviewOrientation:[UIApplication sharedApplication].statusBarOrientation];
    [self initializeCaptureSessionInput];
    [self startSession];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(orientationChanged:)
                                                 name:UIDeviceOrientationDidChangeNotification
                                               object:nil];
    [_lifecycleManager registerAppLifecycleListener:self];
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
  _previewLayer.frame = self.bounds;
  [self setBackgroundColor:[UIColor blackColor]];
  [self.layer insertSublayer:_previewLayer atIndex:0];
}

- (void)removeFromSuperview
{
  [_lifecycleManager unregisterAppLifecycleListener:self];
  [self stopSession];
  [super removeFromSuperview];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
}

- (void)updateType
{
  __weak EXCamera *weakSelf = self;
  dispatch_async(_sessionQueue, ^{
    __strong EXCamera *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf initializeCaptureSessionInput];
      if (!strongSelf.session.isRunning) {
        [strongSelf startSession];
      }
    }
  });
}

- (void)updateFlashMode
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (_flashMode == EXCameraFlashModeTorch) {
    if (![device hasTorch]) {
      return;
    }

    if (![device lockForConfiguration:&error]) {
      if (error) {
        EXLogInfo(@"%s: %@", __func__, error);
      }
      return;
    }

    if ([device hasTorch] && [device isTorchModeSupported:AVCaptureTorchModeOn]) {
      if ([device lockForConfiguration:&error]) {
        [device setFlashMode:AVCaptureFlashModeOff];
        [device setTorchMode:AVCaptureTorchModeOn];
        [device unlockForConfiguration];
      } else {
        if (error) {
          EXLogInfo(@"%s: %@", __func__, error);
        }
      }
    }
  } else {
    if (![device hasFlash]) {
      return;
    }

    if (![device lockForConfiguration:&error]) {
      if (error) {
        EXLogInfo(@"%s: %@", __func__, error);
      }
      return;
    }

    if ([device hasFlash] && [device isFlashModeSupported:_flashMode])
    {
      if ([device lockForConfiguration:&error]) {
        if ([device isTorchModeSupported:AVCaptureTorchModeOff]) {
          [device setTorchMode:AVCaptureTorchModeOff];
        }
        [device setFlashMode:_flashMode];
        [device unlockForConfiguration];
      } else {
        if (error) {
          EXLogInfo(@"%s: %@", __func__, error);
        }
      }
    }
  }

  [device unlockForConfiguration];
}

- (void)updateFocusMode
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (![device lockForConfiguration:&error]) {
    if (error) {
      EXLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  if ([device isFocusModeSupported:_autoFocus]) {
    if ([device lockForConfiguration:&error]) {
      [device setFocusMode:_autoFocus];
    } else {
      if (error) {
        EXLogInfo(@"%s: %@", __func__, error);
      }
    }
  }

  [device unlockForConfiguration];
}

- (void)updateFocusDepth
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (device == nil || device.focusMode != EXCameraAutoFocusOff) {
    return;
  }

  if (@available(iOS 10.0, *)) {
    if ([device isLockingFocusWithCustomLensPositionSupported]) {
      if (![device lockForConfiguration:&error]) {
        if (error) {
          EXLogInfo(@"%s: %@", __func__, error);
        }
        return;
      }

      __weak AVCaptureDevice *weakDevice = device;
      [device setFocusModeLockedWithLensPosition:_focusDepth completionHandler:^(CMTime syncTime) {
        __strong AVCaptureDevice *strongDevice = weakDevice;
        if (strongDevice) {
          [strongDevice unlockForConfiguration];
        }
      }];
      return;
    }
  }

  EXLogInfo(@"%s: Setting focusDepth isn't supported for this camera device", __func__);
  return;
}

- (void)updateZoom {
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (![device lockForConfiguration:&error]) {
    if (error) {
      EXLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  device.videoZoomFactor = (device.activeFormat.videoMaxZoomFactor - 1.0) * _zoom + 1.0;

  [device unlockForConfiguration];
}

- (void)updateWhiteBalance
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (![device lockForConfiguration:&error]) {
    if (error) {
      EXLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  if (_whiteBalance == EXCameraWhiteBalanceAuto) {
    [device setWhiteBalanceMode:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance];
    [device unlockForConfiguration];
  } else {
    AVCaptureWhiteBalanceTemperatureAndTintValues temperatureAndTint = {
      .temperature = [EXCameraUtils temperatureForWhiteBalance:_whiteBalance],
      .tint = 0,
    };
    AVCaptureWhiteBalanceGains rgbGains = [device deviceWhiteBalanceGainsForTemperatureAndTintValues:temperatureAndTint];
    if ([device lockForConfiguration:&error]) {
      __weak AVCaptureDevice *weakDevice = device;
      [device setWhiteBalanceModeLockedWithDeviceWhiteBalanceGains:rgbGains completionHandler:^(CMTime syncTime) {
        __strong AVCaptureDevice *strongDevice = weakDevice;
        if (strongDevice) {
          [strongDevice unlockForConfiguration];
        }
      }];
    } else {
      if (error) {
        EXLogInfo(@"%s: %@", __func__, error);
      }
    }
  }

  [device unlockForConfiguration];
}

- (void)updatePictureSize
{
  [self updateSessionPreset:_pictureSize];
}

- (void)setIsDetectingFaces:(BOOL)faceDetecting
{
  if (_faceDetectorManager) {
    [_faceDetectorManager setIsEnabled:faceDetecting];
  }
}

- (void)updateFaceDetectorSettings:(NSDictionary *)settings
{
  if (_faceDetectorManager) {
    [_faceDetectorManager updateSettings:settings];
  }
}

- (void)takePicture:(NSDictionary *)options resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject
{
  AVCaptureConnection *connection = [_stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];

  __weak EXCamera *weakSelf = self;
  [_stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    __strong EXCamera *strongSelf = weakSelf;
    if (!strongSelf) {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Camera view had been unmounted before image has been captured", nil);
      return;
    }

    if (error || !imageSampleBuffer) {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
      return;
    }

    if (!strongSelf.fileSystem) {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"No file system module", nil);
      return;
    }
    
    BOOL useFastMode = options[@"fastMode"] && [options[@"fastMode"] boolValue];
    if (useFastMode) {
      resolve(nil);
    }

    NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageSampleBuffer];
    UIImage *takenImage = [UIImage imageWithData:imageData];

    CGImageRef takenCGImage = takenImage.CGImage;

    CGSize previewSize;
    if (UIInterfaceOrientationIsPortrait([[UIApplication sharedApplication] statusBarOrientation])) {
      previewSize = CGSizeMake(strongSelf.previewLayer.frame.size.height, strongSelf.previewLayer.frame.size.width);
    } else {
      previewSize = CGSizeMake(strongSelf.previewLayer.frame.size.width, strongSelf.previewLayer.frame.size.height);
    }

    CGRect cropRect = CGRectMake(0, 0, CGImageGetWidth(takenCGImage), CGImageGetHeight(takenCGImage));
    CGRect croppedSize = AVMakeRectWithAspectRatioInsideRect(previewSize, cropRect);
    takenImage = [EXCameraUtils cropImage:takenImage toRect:croppedSize];

    float quality = [options[@"quality"] floatValue];
    NSData *takenImageData = UIImageJPEGRepresentation(takenImage, quality);

    NSString *path = [strongSelf.fileSystem generatePathInDirectory:[strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
    response[@"uri"] = [EXCameraUtils writeImage:takenImageData toPath:path];
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
      [EXCameraUtils updatePhotoMetadata:imageSampleBuffer withAdditionalData:@{ @"Orientation": @(imageRotation) } inResponse:response]; // TODO
    }
    
    if (useFastMode) {
      [strongSelf onPictureSaved:@{@"data": response, @"id": options[@"id"]}];
    } else {
      resolve(response);
    }
  }];
}

- (void)record:(NSDictionary *)options resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject
{
  if (_movieFileOutput == nil) {
    // At the time of writing AVCaptureMovieFileOutput and AVCaptureVideoDataOutput (> GMVDataOutput)
    // cannot coexist on the same AVSession (see: https://stackoverflow.com/a/4986032/1123156).
    // We stop face detection here and restart it in when AVCaptureMovieFileOutput finishes recording.
    if (_faceDetectorManager) {
      [_faceDetectorManager stopFaceDetection];
    }
    [self setupMovieFileCapture];
  }

  if (_movieFileOutput != nil && !_movieFileOutput.isRecording && _videoRecordedResolve == nil && _videoRecordedReject == nil) {
    if (options[@"maxDuration"]) {
      Float64 maxDuration = [options[@"maxDuration"] floatValue];
      _movieFileOutput.maxRecordedDuration = CMTimeMakeWithSeconds(maxDuration, 30);
    }

    if (options[@"maxFileSize"]) {
      _movieFileOutput.maxRecordedFileSize = [options[@"maxFileSize"] integerValue];
    }

    AVCaptureSessionPreset preset;
    if (options[@"quality"]) {
      EXCameraVideoResolution resolution = [options[@"quality"] integerValue];
      preset = [EXCameraUtils captureSessionPresetForVideoResolution:resolution];
    } else if ([_session.sessionPreset isEqual:AVCaptureSessionPresetPhoto]) {
      preset = AVCaptureSessionPresetHigh;
    }

    if (preset != nil) {
      [self updateSessionPreset:preset];
    }

    bool shouldBeMuted = options[@"mute"] && [options[@"mute"] boolValue];
    [self updateSessionAudioIsMuted:shouldBeMuted];

    AVCaptureConnection *connection = [_movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[EXCameraUtils videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];

    __weak EXCamera *weakSelf = self;
    dispatch_async(self.sessionQueue, ^{
      __strong EXCamera *strongSelf = weakSelf;
      if (!strongSelf) {
        reject(@"E_IMAGE_SAVE_FAILED", @"Camera view has been unmounted.", nil);
        return;
      }
      if (!strongSelf.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No file system module", nil);
        return;
      }
      NSString *directory = [strongSelf.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"];
      NSString *path = [strongSelf.fileSystem generatePathInDirectory:directory withExtension:@".mov"];
      NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:path];
      [strongSelf.movieFileOutput startRecordingToOutputFileURL:outputURL recordingDelegate:strongSelf];
      strongSelf.videoRecordedResolve = resolve;
      strongSelf.videoRecordedReject = reject;
    });
  }
}

- (void)stopRecording
{
  [_movieFileOutput stopRecording];
}

- (void)resumePreview
{
  [[_previewLayer connection] setEnabled:YES];
}

- (void)pausePreview
{
  [[_previewLayer connection] setEnabled:NO];
}

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  NSDictionary *cameraPermissions = [_permissionsManager getPermissionsForResource:@"camera"];
  if (![cameraPermissions[@"status"] isEqualToString:@"granted"]) {
    [self onMountingError:@{@"message": @"Camera permissions not granted - component could not be rendered."}];
    return;
  }
  __weak EXCamera *weakSelf = self;
  dispatch_async(_sessionQueue, ^{
    __strong EXCamera *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf.presetCamera == AVCaptureDevicePositionUnspecified) {
      return;
    }

    AVCaptureStillImageOutput *stillImageOutput = [[AVCaptureStillImageOutput alloc] init];
    if ([strongSelf.session canAddOutput:stillImageOutput]) {
      stillImageOutput.outputSettings = @{AVVideoCodecKey : AVVideoCodecJPEG};
      [strongSelf.session addOutput:stillImageOutput];
      [stillImageOutput setHighResolutionStillImageOutputEnabled:YES];
      strongSelf.stillImageOutput = stillImageOutput;
    }

    if (strongSelf.faceDetectorManager) {
      [strongSelf.faceDetectorManager maybeStartFaceDetectionOnSession:strongSelf.session withPreviewLayer:strongSelf.previewLayer];
    }
    [strongSelf setupOrDisableBarcodeScanner];

    [strongSelf setRuntimeErrorHandlingObserver:
     [[NSNotificationCenter defaultCenter] addObserverForName:AVCaptureSessionRuntimeErrorNotification object:strongSelf.session queue:nil usingBlock:^(NSNotification *note) {
      __strong EXCamera *innerStrongSelf = weakSelf;
      if (innerStrongSelf) {
        dispatch_async(innerStrongSelf.sessionQueue, ^{
          __strong EXCamera *innerInnerStrongSelf = weakSelf;
          if (innerInnerStrongSelf) {
            // Manually restarting the session since it must
            // have been stopped due to an error.
            [innerInnerStrongSelf.session startRunning];
            [innerInnerStrongSelf onReady:nil];
          }
        });
      }
    }]];

    [strongSelf.session startRunning];
    [strongSelf onReady:nil];
  });
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  __weak EXCamera *weakSelf = self;
  dispatch_async(_sessionQueue, ^{
    __strong EXCamera *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf.faceDetectorManager) {
      [strongSelf.faceDetectorManager stopFaceDetection];
    }
    [strongSelf.previewLayer removeFromSuperlayer];
    [strongSelf.session commitConfiguration];
    [strongSelf.session stopRunning];
    for (AVCaptureInput *input in strongSelf.session.inputs) {
      [strongSelf.session removeInput:input];
    }

    for (AVCaptureOutput *output in strongSelf.session.outputs) {
      [strongSelf.session removeOutput:output];
    }
  });
}

- (void)initializeCaptureSessionInput
{
  if (_videoCaptureDeviceInput.device.position == _presetCamera) {
    return;
  }

  __block UIInterfaceOrientation interfaceOrientation;
  [EXUtilities performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
  AVCaptureVideoOrientation orientation = [EXCameraUtils videoOrientationForInterfaceOrientation:interfaceOrientation];

  __weak EXCamera *weakSelf = self;
  dispatch_async(_sessionQueue, ^{
    __strong EXCamera *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    [strongSelf.session beginConfiguration];

    NSError *error = nil;
    AVCaptureDevice *captureDevice = [EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition:strongSelf.presetCamera];
    AVCaptureDeviceInput *captureDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];

    if (error || captureDeviceInput == nil) {
      NSString *errorMessage = @"Camera could not be started - ";
      if (error) {
        errorMessage = [errorMessage stringByAppendingString:[error description]];
      } else {
        errorMessage = [errorMessage stringByAppendingString:@"there's no captureDeviceInput available"];
      }
      [strongSelf onMountingError:@{@"message": errorMessage}];
      return;
    }

    [strongSelf.session removeInput:strongSelf.videoCaptureDeviceInput];
    if ([strongSelf.session canAddInput:captureDeviceInput]) {
      [strongSelf.session addInput:captureDeviceInput];

      strongSelf.videoCaptureDeviceInput = captureDeviceInput;
      [strongSelf updateFlashMode];
      [strongSelf updateZoom];
      [strongSelf updateFocusMode];
      [strongSelf updateFocusDepth];
      [strongSelf updateWhiteBalance];
      [strongSelf.previewLayer.connection setVideoOrientation:orientation];
      [strongSelf _updateMetadataObjectsToRecognize];
    }

    [strongSelf.session commitConfiguration];
  });
}

#pragma mark - internal

- (void)updateSessionPreset:(AVCaptureSessionPreset)preset
{
#if !(TARGET_IPHONE_SIMULATOR)
  if (preset) {
    __weak EXCamera *weakSelf = self;
    dispatch_async(_sessionQueue, ^{
      __strong EXCamera *strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.session beginConfiguration];
        if ([strongSelf.session canSetSessionPreset:preset]) {
          strongSelf.session.sessionPreset = preset;
        }
        [strongSelf.session commitConfiguration];
      }
    });
  }
#endif
}

- (void)updateSessionAudioIsMuted:(BOOL)isMuted
{
  __weak EXCamera *weakSelf = self;
  dispatch_async(_sessionQueue, ^{
    __strong EXCamera *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.session beginConfiguration];

      for (AVCaptureDeviceInput* input in [strongSelf.session inputs]) {
        if ([input.device hasMediaType:AVMediaTypeAudio]) {
          if (isMuted) {
            [strongSelf.session removeInput:input];
          }
          [strongSelf.session commitConfiguration];
          return;
        }
      }

      if (!isMuted) {
        NSError *error = nil;

        AVCaptureDevice *audioCaptureDevice = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeAudio];
        AVCaptureDeviceInput *audioDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:audioCaptureDevice error:&error];

        if (error || audioDeviceInput == nil) {
          EXLogInfo(@"%s: %@", __func__, error);
          return;
        }

        if ([strongSelf.session canAddInput:audioDeviceInput]) {
          [strongSelf.session addInput:audioDeviceInput];
        }
      }

      [strongSelf.session commitConfiguration];
    }
  });
}

- (void)onAppForegrounded
{
  if (![_session isRunning] && [self isSessionPaused]) {
    _paused = NO;
    __weak EXCamera *weakSelf = self;
    dispatch_async(_sessionQueue, ^{
      __strong EXCamera *strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.session startRunning];
      }
    });
  }
}

- (void)onAppBackgrounded
{
  if ([_session isRunning] && ![self isSessionPaused]) {
    _paused = YES;
    __weak EXCamera *weakSelf = self;
    dispatch_async(_sessionQueue, ^{
      __strong EXCamera *strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.session stopRunning];
      }
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
  __weak EXCamera *weakSelf = self;
  AVCaptureVideoOrientation videoOrientation = [EXCameraUtils videoOrientationForInterfaceOrientation:orientation];
  [EXUtilities performSynchronouslyOnMainThread:^{
    __strong EXCamera *strongSelf = weakSelf;
    if (strongSelf && strongSelf.previewLayer.connection.isVideoOrientationSupported) {
      [strongSelf.previewLayer.connection setVideoOrientation:videoOrientation];
    }
  }];
}

# pragma mark - AVCaptureMetadataOutput

- (void)setupOrDisableBarcodeScanner
{
  [self _setupOrDisableMetadataOutput];
  [self _updateMetadataObjectsToRecognize];
}

- (void)_setupOrDisableMetadataOutput
{
  if ([self isReadingBarCodes] && (_metadataOutput == nil || ![_session.outputs containsObject:_metadataOutput])) {
    AVCaptureMetadataOutput *metadataOutput = [[AVCaptureMetadataOutput alloc] init];
    if ([_session canAddOutput:metadataOutput]) {
      [metadataOutput setMetadataObjectsDelegate:self queue:_sessionQueue];
      [_session addOutput:metadataOutput];
      _metadataOutput = metadataOutput;
    }
  } else if (_metadataOutput != nil && ![self isReadingBarCodes]) {
    [_session removeOutput:_metadataOutput];
    _metadataOutput = nil;
  }
}

- (void)_updateMetadataObjectsToRecognize
{
  if (_metadataOutput == nil) {
    return;
  }

  NSArray<AVMetadataObjectType> *availableRequestedObjectTypes = [[NSArray alloc] init];
  NSArray<AVMetadataObjectType> *requestedObjectTypes = [NSArray arrayWithArray:_barCodeTypes];
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
      for (id barcodeType in _barCodeTypes) {
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

  if ([_session canAddOutput:movieFileOutput]) {
    [_session addOutput:movieFileOutput];
    _movieFileOutput = movieFileOutput;
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
  if (success && _videoRecordedResolve != nil) {
    _videoRecordedResolve(@{ @"uri": outputFileURL.absoluteString });
  } else if (_videoRecordedReject != nil) {
    _videoRecordedReject(@"E_RECORDING_FAILED", @"An error occurred while recording a video.", error);
  }
  _videoRecordedResolve = nil;
  _videoRecordedReject = nil;

  [self cleanupMovieFileCapture];
  // If face detection has been running prior to recording to file
  // we reenable it here (see comment in -record).
  if (_faceDetectorManager) {
    [_faceDetectorManager maybeStartFaceDetectionOnSession:_session withPreviewLayer:_previewLayer];
  }

  if (_session.sessionPreset != _pictureSize) {
    [self updateSessionPreset:_pictureSize];
  }
}

# pragma mark - Face detector

- (id)createFaceDetectorManager
{
  id <EXFaceDetectorManager> faceDetector = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXFaceDetectorManager)];
  if (faceDetector) {
    __weak EXCamera *weakSelf = self;
    [faceDetector setOnFacesDetected:^(NSArray<NSDictionary *> *faces) {
      __strong EXCamera *strongSelf = weakSelf;
      if (strongSelf) {
        if (strongSelf.onFacesDetected) {
          strongSelf.onFacesDetected(@{
                                       @"type": @"face",
                                       @"faces": faces
                                       });
        }
      }
    }];
    [faceDetector setSessionQueue:_sessionQueue];
  }
  return faceDetector;
}

@end

