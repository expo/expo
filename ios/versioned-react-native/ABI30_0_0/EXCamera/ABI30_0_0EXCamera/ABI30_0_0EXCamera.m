#import <AVFoundation/AVFoundation.h>

#import <ABI30_0_0EXBarCodeScannerInterface/ABI30_0_0EXBarCodeScannerProviderInterface.h>
#import <ABI30_0_0EXCamera/ABI30_0_0EXCamera.h>
#import <ABI30_0_0EXCamera/ABI30_0_0EXCameraUtils.h>
#import <ABI30_0_0EXCamera/ABI30_0_0EXCameraManager.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleService.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUtilities.h>
#import <ABI30_0_0EXFaceDetectorInterface/ABI30_0_0EXFaceDetectorManagerProvider.h>
#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemInterface.h>
#import <ABI30_0_0EXPermissionsInterface/ABI30_0_0EXPermissionsInterface.h>

@interface ABI30_0_0EXCamera ()

@property (nonatomic, weak) id<ABI30_0_0EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) id<ABI30_0_0EXFaceDetectorManager> faceDetectorManager;
@property (nonatomic, strong) id<ABI30_0_0EXBarCodeScannerInterface> barCodeScanner;
@property (nonatomic, weak) id<ABI30_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI30_0_0EXAppLifecycleService> lifecycleManager;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, strong) ABI30_0_0EXPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) ABI30_0_0EXPromiseRejectBlock videoRecordedReject;

@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onCameraReady;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onMountError;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onPictureSaved;

@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onBarCodeScanned;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onFacesDetected;

@end

@implementation ABI30_0_0EXCamera

static NSDictionary *defaultFaceDetectorOptions = nil;

- (id)initWithModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _moduleRegistry = moduleRegistry;
    _session = [AVCaptureSession new];
    _sessionQueue = dispatch_queue_create("cameraQueue", DISPATCH_QUEUE_SERIAL);
    _faceDetectorManager = [self createFaceDetectorManager];
    _barCodeScanner = [self createBarCodeScanner];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXAppLifecycleService)];
    _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFileSystemInterface)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXPermissionsInterface)];
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

- (void)onBarCodeScanned:(NSDictionary *)event
{
  if (_onBarCodeScanned) {
    _onBarCodeScanned(event);
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
  ABI30_0_0EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
    [self initializeCaptureSessionInput];
    if (!self.session.isRunning) {
      [self startSession];
    }
  });
}

- (void)updateFlashMode
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (_flashMode == ABI30_0_0EXCameraFlashModeTorch) {
    if (![device hasTorch]) {
      return;
    }

    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
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
          ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
        }
      }
    }
  } else {
    if (![device hasFlash]) {
      return;
    }

    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
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
          ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
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
      ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  if ([device isFocusModeSupported:_autoFocus]) {
    if ([device lockForConfiguration:&error]) {
      [device setFocusMode:_autoFocus];
    } else {
      if (error) {
        ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
      }
    }
  }

  [device unlockForConfiguration];
}

- (void)updateFocusDepth
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (device == nil || device.focusMode != ABI30_0_0EXCameraAutoFocusOff) {
    return;
  }

  if (@available(iOS 10.0, *)) {
    if ([device isLockingFocusWithCustomLensPositionSupported]) {
      if (![device lockForConfiguration:&error]) {
        if (error) {
          ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
        }
        return;
      }

      ABI30_0_0EX_WEAKIFY(device);
      [device setFocusModeLockedWithLensPosition:_focusDepth completionHandler:^(CMTime syncTime) {
        ABI30_0_0EX_ENSURE_STRONGIFY(device);
        [device unlockForConfiguration];
      }];
      return;
    }
  }

  ABI30_0_0EXLogInfo(@"%s: Setting focusDepth isn't supported for this camera device", __func__);
  return;
}

- (void)updateZoom {
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
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
      ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  if (_whiteBalance == ABI30_0_0EXCameraWhiteBalanceAuto) {
    [device setWhiteBalanceMode:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance];
    [device unlockForConfiguration];
  } else {
    AVCaptureWhiteBalanceTemperatureAndTintValues temperatureAndTint = {
      .temperature = [ABI30_0_0EXCameraUtils temperatureForWhiteBalance:_whiteBalance],
      .tint = 0,
    };
    AVCaptureWhiteBalanceGains rgbGains = [device deviceWhiteBalanceGainsForTemperatureAndTintValues:temperatureAndTint];
    if ([device lockForConfiguration:&error]) {
      ABI30_0_0EX_WEAKIFY(device);
      [device setWhiteBalanceModeLockedWithDeviceWhiteBalanceGains:rgbGains completionHandler:^(CMTime syncTime) {
        ABI30_0_0EX_ENSURE_STRONGIFY(device);
        [device unlockForConfiguration];
      }];
    } else {
      if (error) {
        ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
      }
    }
  }

  [device unlockForConfiguration];
}

- (void)updatePictureSize
{
  [self updateSessionPreset:_pictureSize];
}

- (void)setIsScanningBarCodes:(BOOL)barCodeScanning
{
  if (_barCodeScanner) {
    [_barCodeScanner setIsEnabled:barCodeScanning];
  }
}

- (void)setBarCodeScannerSettings:(NSDictionary *)settings
{
  if (_barCodeScanner) {
    [_barCodeScanner setSettings:settings];
  }
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

- (void)takePicture:(NSDictionary *)options resolve:(ABI30_0_0EXPromiseResolveBlock)resolve reject:(ABI30_0_0EXPromiseRejectBlock)reject
{
  AVCaptureConnection *connection = [_stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[ABI30_0_0EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];

  ABI30_0_0EX_WEAKIFY(self);
  [_stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler: ^(CMSampleBufferRef imageSampleBuffer, NSError *error) {
    ABI30_0_0EX_STRONGIFY(self);
    if (!self) {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Camera view had been unmounted before image has been captured", nil);
      return;
    }

    if (error || !imageSampleBuffer) {
      reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
      return;
    }

    if (!self.fileSystem) {
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
      previewSize = CGSizeMake(self.previewLayer.frame.size.height, self.previewLayer.frame.size.width);
    } else {
      previewSize = CGSizeMake(self.previewLayer.frame.size.width, self.previewLayer.frame.size.height);
    }

    CGRect cropRect = CGRectMake(0, 0, CGImageGetWidth(takenCGImage), CGImageGetHeight(takenCGImage));
    CGRect croppedSize = AVMakeRectWithAspectRatioInsideRect(previewSize, cropRect);
    takenImage = [ABI30_0_0EXCameraUtils cropImage:takenImage toRect:croppedSize];

    float quality = [options[@"quality"] floatValue];
    NSData *takenImageData = UIImageJPEGRepresentation(takenImage, quality);

    NSString *path = [self.fileSystem generatePathInDirectory:[self.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];

    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
    response[@"uri"] = [ABI30_0_0EXCameraUtils writeImage:takenImageData toPath:path];
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
      [ABI30_0_0EXCameraUtils updatePhotoMetadata:imageSampleBuffer withAdditionalData:@{ @"Orientation": @(imageRotation) } inResponse:response]; // TODO
    }
    
    if (useFastMode) {
      [self onPictureSaved:@{@"data": response, @"id": options[@"id"]}];
    } else {
      resolve(response);
    }
  }];
}

- (void)record:(NSDictionary *)options resolve:(ABI30_0_0EXPromiseResolveBlock)resolve reject:(ABI30_0_0EXPromiseRejectBlock)reject
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
      ABI30_0_0EXCameraVideoResolution resolution = [options[@"quality"] integerValue];
      preset = [ABI30_0_0EXCameraUtils captureSessionPresetForVideoResolution:resolution];
    } else if ([_session.sessionPreset isEqual:AVCaptureSessionPresetPhoto]) {
      preset = AVCaptureSessionPresetHigh;
    }

    if (preset != nil) {
      [self updateSessionPreset:preset];
    }

    bool shouldBeMuted = options[@"mute"] && [options[@"mute"] boolValue];
    [self updateSessionAudioIsMuted:shouldBeMuted];

    AVCaptureConnection *connection = [_movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[ABI30_0_0EXCameraUtils videoOrientationForInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]];

    ABI30_0_0EX_WEAKIFY(self);
    dispatch_async(self.sessionQueue, ^{
      ABI30_0_0EX_STRONGIFY(self);
      if (!self) {
        reject(@"E_IMAGE_SAVE_FAILED", @"Camera view has been unmounted.", nil);
        return;
      }
      if (!self.fileSystem) {
        reject(@"E_IMAGE_SAVE_FAILED", @"No file system module", nil);
        return;
      }
      NSString *directory = [self.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"];
      NSString *path = [self.fileSystem generatePathInDirectory:directory withExtension:@".mov"];
      NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:path];
      [self.movieFileOutput startRecordingToOutputFileURL:outputURL recordingDelegate:self];
      self.videoRecordedResolve = resolve;
      self.videoRecordedReject = reject;
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
  ABI30_0_0EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);

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

    [self setRuntimeErrorHandlingObserver:
     [[NSNotificationCenter defaultCenter] addObserverForName:AVCaptureSessionRuntimeErrorNotification object:self.session queue:nil usingBlock:^(NSNotification *note) {
      ABI30_0_0EX_ENSURE_STRONGIFY(self);
      dispatch_async(self.sessionQueue, ^{
        ABI30_0_0EX_ENSURE_STRONGIFY(self)
          // Manually restarting the session since it must
          // have been stopped due to an error.
          [self.session startRunning];
          [self onReady:nil];
      });
    }]];
    
    if (self.faceDetectorManager) {
      [self.faceDetectorManager maybeStartFaceDetectionOnSession:self.session withPreviewLayer:self.previewLayer];
    }
    if (self.barCodeScanner) {
      [self.barCodeScanner maybeStartBarCodeScanning];
    }

    [self.session startRunning];
    [self onReady:nil];
  });
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  ABI30_0_0EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);

    if (self.faceDetectorManager) {
      [self.faceDetectorManager stopFaceDetection];
    }
    if (self.barCodeScanner) {
      [self.barCodeScanner stopBarCodeScanning];
    }
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
  if (_videoCaptureDeviceInput.device.position == _presetCamera) {
    return;
  }

  __block UIInterfaceOrientation interfaceOrientation;
  [ABI30_0_0EXUtilities performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
  AVCaptureVideoOrientation orientation = [ABI30_0_0EXCameraUtils videoOrientationForInterfaceOrientation:interfaceOrientation];

  ABI30_0_0EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);

    [self.session beginConfiguration];

    NSError *error = nil;
    AVCaptureDevice *captureDevice = [ABI30_0_0EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition:self.presetCamera];
    AVCaptureDeviceInput *captureDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:captureDevice error:&error];

    if (error || captureDeviceInput == nil) {
      NSString *errorMessage = @"Camera could not be started - ";
      if (error) {
        errorMessage = [errorMessage stringByAppendingString:[error description]];
      } else {
        errorMessage = [errorMessage stringByAppendingString:@"there's no captureDeviceInput available"];
      }
      [self onMountingError:@{@"message": errorMessage}];
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
    }

    [self.session commitConfiguration];
  });
}

#pragma mark - internal

- (void)updateSessionPreset:(AVCaptureSessionPreset)preset
{
#if !(TARGET_IPHONE_SIMULATOR)
  if (preset) {
    ABI30_0_0EX_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI30_0_0EX_ENSURE_STRONGIFY(self);
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
  ABI30_0_0EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
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
        ABI30_0_0EXLogInfo(@"%s: %@", __func__, error);
        return;
      }

      if ([self.session canAddInput:audioDeviceInput]) {
        [self.session addInput:audioDeviceInput];
      }
    }

    [self.session commitConfiguration];
  });
}

- (void)onAppForegrounded
{
  if (![_session isRunning] && [self isSessionPaused]) {
    _paused = NO;
    ABI30_0_0EX_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI30_0_0EX_ENSURE_STRONGIFY(self);
      [self.session startRunning];
    });
  }
}

- (void)onAppBackgrounded
{
  if ([_session isRunning] && ![self isSessionPaused]) {
    _paused = YES;
    ABI30_0_0EX_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI30_0_0EX_ENSURE_STRONGIFY(self);
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
  ABI30_0_0EX_WEAKIFY(self);
  AVCaptureVideoOrientation videoOrientation = [ABI30_0_0EXCameraUtils videoOrientationForInterfaceOrientation:orientation];
  [ABI30_0_0EXUtilities performSynchronouslyOnMainThread:^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
    if (self.previewLayer.connection.isVideoOrientationSupported) {
      [self.previewLayer.connection setVideoOrientation:videoOrientation];
    }
  }];
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
  id <ABI30_0_0EXFaceDetectorManagerProvider> faceDetectorProvider = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFaceDetectorManagerProvider)];

  if (faceDetectorProvider) {
    id <ABI30_0_0EXFaceDetectorManager> faceDetector = [faceDetectorProvider createFaceDetectorManager];
    if (faceDetector) {
      ABI30_0_0EX_WEAKIFY(self);
      [faceDetector setOnFacesDetected:^(NSArray<NSDictionary *> *faces) {
        ABI30_0_0EX_ENSURE_STRONGIFY(self);
        if (self.onFacesDetected) {
          self.onFacesDetected(@{
                                 @"type": @"face",
                                 @"faces": faces
                                 });
        }
      }];
      [faceDetector setSessionQueue:_sessionQueue];
    }
    return faceDetector;
  }
  return nil;
}

# pragma mark - BarCode scanner

- (id)createBarCodeScanner
{
  id<ABI30_0_0EXBarCodeScannerProviderInterface> barCodeScannerProvider = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXBarCodeScannerProviderInterface)];
  if (barCodeScannerProvider) {
    id<ABI30_0_0EXBarCodeScannerInterface> barCodeScanner = [barCodeScannerProvider createBarCodeScanner];
    if (barCodeScanner) {
      ABI30_0_0EX_WEAKIFY(self);
      [barCodeScanner setSession:_session];
      [barCodeScanner setSessionQueue:_sessionQueue];
      [barCodeScanner setOnBarCodeScanned:^(NSDictionary *body) {
        ABI30_0_0EX_ENSURE_STRONGIFY(self);
        [self onBarCodeScanned:body];
      }];
    }
    return barCodeScanner;
  }
  return nil;
}

@end

