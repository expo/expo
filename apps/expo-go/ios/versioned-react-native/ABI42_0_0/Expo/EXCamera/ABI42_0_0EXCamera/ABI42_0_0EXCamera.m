#import <AVFoundation/AVFoundation.h>

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXBarCodeScannerProviderInterface.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCamera.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraUtils.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraManager.h>
#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraPermissionRequester.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFaceDetectorManagerInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFaceDetectorManagerProviderInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>

@interface ABI42_0_0EXCamera ()

@property (nonatomic, weak) id<ABI42_0_0EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) id<ABI42_0_0EXFaceDetectorManagerInterface> faceDetectorManager;
@property (nonatomic, strong) id<ABI42_0_0EXBarCodeScannerInterface> barCodeScanner;
@property (nonatomic, weak) id<ABI42_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI42_0_0UMAppLifecycleService> lifecycleManager;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, strong) NSDictionary *photoCaptureOptions;
@property (nonatomic, strong) ABI42_0_0UMPromiseResolveBlock photoCapturedResolve;
@property (nonatomic, strong) ABI42_0_0UMPromiseRejectBlock photoCapturedReject;

@property (nonatomic, strong) ABI42_0_0UMPromiseResolveBlock videoRecordedResolve;
@property (nonatomic, strong) ABI42_0_0UMPromiseRejectBlock videoRecordedReject;

@property (nonatomic, copy) ABI42_0_0UMDirectEventBlock onCameraReady;
@property (nonatomic, copy) ABI42_0_0UMDirectEventBlock onMountError;
@property (nonatomic, copy) ABI42_0_0UMDirectEventBlock onPictureSaved;

@property (nonatomic, copy) ABI42_0_0UMDirectEventBlock onBarCodeScanned;
@property (nonatomic, copy) ABI42_0_0UMDirectEventBlock onFacesDetected;

@end

@implementation ABI42_0_0EXCamera

static NSDictionary *defaultFaceDetectorOptions = nil;

- (id)initWithModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _moduleRegistry = moduleRegistry;
    _session = [AVCaptureSession new];
    _sessionQueue = dispatch_queue_create("cameraQueue", DISPATCH_QUEUE_SERIAL);
    _faceDetectorManager = [self createFaceDetectorManager];
    _barCodeScanner = [self createBarCodeScanner];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMAppLifecycleService)];
    _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXFileSystemInterface)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXPermissionsInterface)];
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

- (void)dealloc
{
  // In very rare case ABI42_0_0EXCamera might be unmounted (and thus deallocated) after starting taking a photo,
  // but still before callbacks from AVCapturePhotoCaptureDelegate are fired (that means before results from taking a photo are handled).
  // This scenario leads to a state when AVCapturePhotoCaptureDelegate is `nil` and
  // neither self.photoCapturedResolve nor self.photoCapturedResolve is called.
  // To prevent hanging promise let's reject here.
  if (_photoCapturedReject) {
    _photoCapturedReject(@"E_IMAGE_CAPTURE_FAILED", @"Camera unmounted during taking photo process.", nil);
  }
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
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
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

  if (_flashMode == ABI42_0_0EXCameraFlashModeTorch) {
    if (![device hasTorch]) {
      return;
    }

    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
      }
      return;
    }

    if ([device hasTorch] && [device isTorchModeSupported:AVCaptureTorchModeOn]) {
      if ([device lockForConfiguration:&error]) {
        [device setTorchMode:AVCaptureTorchModeOn];
        [device unlockForConfiguration];
      } else {
        if (error) {
          ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
        }
      }
    }
  } else {
    if (![device hasFlash]) {
      return;
    }

    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
      }
      return;
    }

    if ([device hasFlash])
    {
      if ([device lockForConfiguration:&error]) {
        if ([device isTorchModeSupported:AVCaptureTorchModeOff]) {
          [device setTorchMode:AVCaptureTorchModeOff];
        }
        [device unlockForConfiguration];
      } else {
        if (error) {
          ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
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
      ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  if ([device isFocusModeSupported:_autoFocus]) {
    if ([device lockForConfiguration:&error]) {
      [device setFocusMode:_autoFocus];
    } else {
      if (error) {
        ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
      }
    }
  }

  [device unlockForConfiguration];
}

- (void)updateFocusDepth
{
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (device == nil || device.focusMode != ABI42_0_0EXCameraAutoFocusOff) {
    return;
  }

  if ([device isLockingFocusWithCustomLensPositionSupported]) {
    if (![device lockForConfiguration:&error]) {
      if (error) {
        ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
      }
      return;
    }

    ABI42_0_0UM_WEAKIFY(device);
    [device setFocusModeLockedWithLensPosition:_focusDepth completionHandler:^(CMTime syncTime) {
      ABI42_0_0UM_ENSURE_STRONGIFY(device);
      [device unlockForConfiguration];
    }];
    return;
  }

  ABI42_0_0UMLogInfo(@"%s: Setting focusDepth isn't supported for this camera device", __func__);
  return;
}

- (void)updateZoom {
  AVCaptureDevice *device = [_videoCaptureDeviceInput device];
  NSError *error = nil;

  if (![device lockForConfiguration:&error]) {
    if (error) {
      ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
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
      ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
    }
    return;
  }

  if (_whiteBalance == ABI42_0_0EXCameraWhiteBalanceAuto) {
    [device setWhiteBalanceMode:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance];
    [device unlockForConfiguration];
  } else {
    AVCaptureWhiteBalanceTemperatureAndTintValues temperatureAndTint = {
      .temperature = [ABI42_0_0EXCameraUtils temperatureForWhiteBalance:_whiteBalance],
      .tint = 0,
    };
    AVCaptureWhiteBalanceGains rgbGains = [device deviceWhiteBalanceGainsForTemperatureAndTintValues:temperatureAndTint];
    if ([device lockForConfiguration:&error]) {
      ABI42_0_0UM_WEAKIFY(device);
      [device setWhiteBalanceModeLockedWithDeviceWhiteBalanceGains:rgbGains completionHandler:^(CMTime syncTime) {
        ABI42_0_0UM_ENSURE_STRONGIFY(device);
        [device unlockForConfiguration];
      }];
    } else {
      if (error) {
        ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
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
  } else if (barCodeScanning) {
    ABI42_0_0UMLogError(@"BarCodeScanner module not found. Make sure `expo-barcode-scanner` is installed and linked correctly.");
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
  } else if (faceDetecting) {
    ABI42_0_0UMLogError(@"FaceDetector module not found. Make sure `expo-face-detector` is installed and linked correctly.");
  }
}

- (void)updateFaceDetectorSettings:(NSDictionary *)settings
{
  if (_faceDetectorManager) {
    [_faceDetectorManager updateSettings:settings];
  }
}

- (void)takePicture:(NSDictionary *)options resolve:(ABI42_0_0UMPromiseResolveBlock)resolve reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (_photoCapturedResolve) {
    reject(@"E_ANOTHER_CAPTURE", @"Another photo capture is already being processed. Await the first call.", nil);
    return;
  }
  if (!_photoOutput) {
    reject(@"E_IMAGE_CAPTURE_FAILED", @"Camera is not ready yet. Wait for 'onCameraReady' callback.", nil);
    return;
  }
  AVCaptureConnection *connection = [_photoOutput connectionWithMediaType:AVMediaTypeVideo];
  [connection setVideoOrientation:[ABI42_0_0EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];

  _photoCapturedReject = reject;
  _photoCapturedResolve = resolve;
  _photoCaptureOptions = options;

  AVCapturePhotoSettings *outputSettings = [AVCapturePhotoSettings photoSettingsWithFormat:@{AVVideoCodecKey : AVVideoCodecJPEG}];
  outputSettings.highResolutionPhotoEnabled = YES;
  AVCaptureFlashMode requestedFlashMode = AVCaptureFlashModeOff;
  switch (_flashMode) {
    case ABI42_0_0EXCameraFlashModeOff:
      requestedFlashMode = AVCaptureFlashModeOff;
      break;
    case ABI42_0_0EXCameraFlashModeAuto:
      requestedFlashMode = AVCaptureFlashModeAuto;
      break;
    case ABI42_0_0EXCameraFlashModeOn:
    case ABI42_0_0EXCameraFlashModeTorch:
      requestedFlashMode = AVCaptureFlashModeOn;
      break;
  }
  if ([[_photoOutput supportedFlashModes] containsObject:@(requestedFlashMode)]) {
    outputSettings.flashMode = requestedFlashMode;
  }
  [_photoOutput capturePhotoWithSettings:outputSettings delegate:self];
}

- (void)captureOutput:(AVCapturePhotoOutput *)output
didFinishProcessingPhotoSampleBuffer:(CMSampleBufferRef)photoSampleBuffer
previewPhotoSampleBuffer:(CMSampleBufferRef)previewPhotoSampleBuffer
     resolvedSettings:(AVCaptureResolvedPhotoSettings *)resolvedSettings
      bracketSettings:(AVCaptureBracketedStillImageSettings *)bracketSettings
                error:(NSError *)error
{
  NSDictionary *options = _photoCaptureOptions;
  ABI42_0_0UMPromiseRejectBlock reject = _photoCapturedReject;
  ABI42_0_0UMPromiseResolveBlock resolve = _photoCapturedResolve;
  _photoCapturedResolve = nil;
  _photoCapturedReject = nil;
  _photoCaptureOptions = nil;

  if (error || !photoSampleBuffer) {
    reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
    return;
  }

  if (!self.fileSystem) {
    reject(@"E_IMAGE_CAPTURE_FAILED", @"No file system module", nil);
    return;
  }

  NSData *imageData = [AVCapturePhotoOutput JPEGPhotoDataRepresentationForJPEGSampleBuffer:photoSampleBuffer previewPhotoSampleBuffer:previewPhotoSampleBuffer];
  
  CGImageSourceRef sourceCGIImageRef = CGImageSourceCreateWithData((CFDataRef) imageData, NULL);
  NSDictionary *sourceMetadata = (__bridge NSDictionary *) CGImageSourceCopyPropertiesAtIndex(sourceCGIImageRef, 0, NULL);
  [self handleCapturedImageData:imageData metadata:sourceMetadata options:options resolver:resolve reject:reject];
  CFRelease(sourceCGIImageRef);
}

- (void)captureOutput:(AVCapturePhotoOutput *)output didFinishProcessingPhoto:(AVCapturePhoto *)photo error:(NSError *)error API_AVAILABLE(ios(11.0))
{
  NSDictionary *options = _photoCaptureOptions;
  ABI42_0_0UMPromiseRejectBlock reject = _photoCapturedReject;
  ABI42_0_0UMPromiseResolveBlock resolve = _photoCapturedResolve;
  _photoCapturedResolve = nil;
  _photoCapturedReject = nil;
  _photoCaptureOptions = nil;

  if (error || !photo) {
    reject(@"E_IMAGE_CAPTURE_FAILED", @"Image could not be captured", error);
    return;
  }

  if (!self.fileSystem) {
    reject(@"E_IMAGE_CAPTURE_FAILED", @"No file system module", nil);
    return;
  }

  NSData *imageData = [photo fileDataRepresentation];
  [self handleCapturedImageData:imageData metadata:photo.metadata options:options resolver:resolve reject:reject];
}

- (void)handleCapturedImageData:(NSData *)imageData metadata:(NSDictionary *)metadata options:(NSDictionary *)options resolver:(ABI42_0_0UMPromiseResolveBlock)resolve reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  UIImage *takenImage = [UIImage imageWithData:imageData];
  BOOL useFastMode = [options[@"fastMode"] boolValue];
  if (useFastMode) {
    resolve(nil);
  }

  CGSize previewSize;
  if (UIInterfaceOrientationIsPortrait([[UIApplication sharedApplication] statusBarOrientation])) {
    previewSize = CGSizeMake(self.previewLayer.frame.size.height, self.previewLayer.frame.size.width);
  } else {
    previewSize = CGSizeMake(self.previewLayer.frame.size.width, self.previewLayer.frame.size.height);
  }
  
  CGImageRef takenCGImage = takenImage.CGImage;
  CGRect cropRect = CGRectMake(0, 0, CGImageGetWidth(takenCGImage), CGImageGetHeight(takenCGImage));
  CGRect croppedSize = AVMakeRectWithAspectRatioInsideRect(previewSize, cropRect);
  takenImage = [ABI42_0_0EXCameraUtils cropImage:takenImage toRect:croppedSize];

  NSString *path = [self.fileSystem generatePathInDirectory:[self.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Camera"] withExtension:@".jpg"];
  float width = takenImage.size.width;
  float height = takenImage.size.height;
  NSData *processedImageData = nil;
  float quality = [options[@"quality"] floatValue];

  NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
  if ([options[@"exif"] boolValue]) {
    NSMutableDictionary *updatedExif = [ABI42_0_0EXCameraUtils updateExifMetadata:metadata[(NSString *)kCGImagePropertyExifDictionary] withAdditionalData:@{ @"Orientation": @([ABI42_0_0EXCameraUtils exportImageOrientation:takenImage.imageOrientation]) }];
    updatedExif[(NSString *)kCGImagePropertyExifPixelYDimension] = @(width);
    updatedExif[(NSString *)kCGImagePropertyExifPixelXDimension] = @(height);
    response[@"exif"] = updatedExif;
    
    NSMutableDictionary *updatedMetadata = [metadata mutableCopy];
    updatedMetadata[(NSString *)kCGImagePropertyExifDictionary] = updatedExif;
    
    // UIImage does not contain metadata information. We need to add them to CGImage manually.
    processedImageData = [ABI42_0_0EXCameraUtils dataFromImage:takenImage withMetadata:updatedMetadata imageQuality:quality];
  } else {
    processedImageData = UIImageJPEGRepresentation(takenImage, quality);
  }
  
  if (!processedImageData) {
    return reject(@"E_IMAGE_SAVE_FAILED", @"Could not save the image.", nil);
  }
  
  response[@"uri"] = [ABI42_0_0EXCameraUtils writeImage:processedImageData toPath:path];
  response[@"width"] = @(width);
  response[@"height"] = @(height);

  if ([options[@"base64"] boolValue]) {
    response[@"base64"] = [processedImageData base64EncodedStringWithOptions:0];
  }

  if ([options[@"fastMode"] boolValue]) {
    [self onPictureSaved:@{@"data": response, @"id": options[@"id"]}];
  } else {
    resolve(response);
  }
}

- (void)record:(NSDictionary *)options resolve:(ABI42_0_0UMPromiseResolveBlock)resolve reject:(ABI42_0_0UMPromiseRejectBlock)reject
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


    bool shouldBeMuted = options[@"mute"] && [options[@"mute"] boolValue];
    [self updateSessionAudioIsMuted:shouldBeMuted];

    AVCaptureConnection *connection = [_movieFileOutput connectionWithMediaType:AVMediaTypeVideo];
    // TODO: Add support for videoStabilizationMode (right now it is not only read, never written to)
    if (connection.isVideoStabilizationSupported == NO) {
      ABI42_0_0UMLogWarn(@"%s: Video Stabilization is not supported on this device.", __func__);
    } else {
      [connection setPreferredVideoStabilizationMode:self.videoStabilizationMode];
    }
    [connection setVideoOrientation:[ABI42_0_0EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];
    
    [self setVideoOptions:options forConnection:connection onReject:reject];
    
    bool canBeMirrored = connection.isVideoMirroringSupported;
    bool shouldBeMirrored = options[@"mirror"] && [options[@"mirror"] boolValue];
    if (canBeMirrored && shouldBeMirrored) {
      [connection setVideoMirrored:shouldBeMirrored];
    }

    ABI42_0_0UM_WEAKIFY(self);
    dispatch_async(self.sessionQueue, ^{
      ABI42_0_0UM_STRONGIFY(self);
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

// Video options are set in an async block to prevent the possible race condition outlined here:
// https://github.com/ABI42_0_0React-native-camera/ABI42_0_0React-native-camera/pull/2694
- (void)setVideoOptions:(NSDictionary *)options forConnection:(AVCaptureConnection *)connection onReject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_STRONGIFY(self);
    
    if (options[@"maxDuration"]) {
      Float64 maxDuration = [options[@"maxDuration"] floatValue];
      self.movieFileOutput.maxRecordedDuration = CMTimeMakeWithSeconds(maxDuration, 30);
    }

    if (options[@"maxFileSize"]) {
      self.movieFileOutput.maxRecordedFileSize = [options[@"maxFileSize"] integerValue];
    }
    
    AVCaptureSessionPreset preset;
    if (options[@"quality"]) {
      ABI42_0_0EXCameraVideoResolution resolution = [options[@"quality"] integerValue];
      preset = [ABI42_0_0EXCameraUtils captureSessionPresetForVideoResolution:resolution];
    } else if ([self.session.sessionPreset isEqual:AVCaptureSessionPresetPhoto]) {
      preset = AVCaptureSessionPresetHigh;
    }

    if (preset != nil) {
      [self updateSessionPreset:preset];
    }
    
    if (options[@"codec"]) {
      AVVideoCodecType videoCodecType = [ABI42_0_0EXCameraUtils videoCodecForType: [options[@"codec"] integerValue]];

      if ([self.movieFileOutput.availableVideoCodecTypes containsObject:videoCodecType]) {
        [self.movieFileOutput setOutputSettings: @{AVVideoCodecKey: videoCodecType} forConnection: connection];
        self.videoCodecType = videoCodecType;
      } else {
        if ([videoCodecType isEqualToString: @"VIDEO_CODEC_UNKNOWN"]) {
          videoCodecType = options[@"codec"];
        }
        NSString *videoCodecErrorMessage = [NSString stringWithFormat: @"Video Codec '%@' is not supported on this device", videoCodecType];
        reject(@"E_RECORDING_FAILED", videoCodecErrorMessage, nil);

        [self cleanupMovieFileCapture];
        self.videoRecordedResolve = nil;
        self.videoRecordedReject = nil;
      }
    }
  });
}

- (void)maybeStartFaceDetection:(BOOL)mirrored {
  if (self.faceDetectorManager) {
    AVCaptureConnection *connection = [self.photoOutput connectionWithMediaType:AVMediaTypeVideo];
    [connection setVideoOrientation:[ABI42_0_0EXCameraUtils videoOrientationForDeviceOrientation:[[UIDevice currentDevice] orientation]]];
    [self.faceDetectorManager maybeStartFaceDetectionOnSession:self.session withPreviewLayer:self.previewLayer mirrored:mirrored];
  }
}

- (void)setPresetCamera:(NSInteger)presetCamera
{
  _presetCamera = presetCamera;
  [self.faceDetectorManager updateMirrored:_presetCamera!=1];
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
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunreachable-code"
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[ABI42_0_0EXCameraPermissionRequester class]]) {
    [self onMountingError:@{@"message": @"Camera permissions not granted - component could not be rendered."}];
    return;
  }
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);

    if (self.presetCamera == AVCaptureDevicePositionUnspecified) {
      return;
    }

    AVCapturePhotoOutput *photoOutput = [AVCapturePhotoOutput new];
    photoOutput.highResolutionCaptureEnabled = YES;
    photoOutput.livePhotoCaptureEnabled = NO;
    if ([self.session canAddOutput:photoOutput]) {
      [self.session addOutput:photoOutput];
      self.photoOutput = photoOutput;
    }

    [self setRuntimeErrorHandlingObserver:
     [[NSNotificationCenter defaultCenter] addObserverForName:AVCaptureSessionRuntimeErrorNotification object:self.session queue:nil usingBlock:^(NSNotification *note) {
      ABI42_0_0UM_ENSURE_STRONGIFY(self);
      dispatch_async(self.sessionQueue, ^{
        ABI42_0_0UM_ENSURE_STRONGIFY(self)
        // Manually restarting the session since it must
        // have been stopped due to an error.
        [self.session startRunning];
        [self ensureSessionConfiguration];
        [self onReady:nil];
      });
    }]];

    // when BarCodeScanner is enabled since the beginning of camera component lifecycle,
    // some race condition occurs in reconfiguration and barcodes aren't scanned at all
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 50 * NSEC_PER_USEC), self.sessionQueue, ^{
      ABI42_0_0UM_ENSURE_STRONGIFY(self);
      [self maybeStartFaceDetection:self.presetCamera!=1];
      if (self.barCodeScanner) {
        [self.barCodeScanner maybeStartBarCodeScanning];
      }

      [self.session startRunning];
      [self ensureSessionConfiguration];
      [self onReady:nil];
    });
  });
#pragma clang diagnostic pop
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);

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
  [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
  AVCaptureVideoOrientation orientation = [ABI42_0_0EXCameraUtils videoOrientationForInterfaceOrientation:interfaceOrientation];

  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);

    [self.session beginConfiguration];

    NSError *error = nil;
    AVCaptureDevice *captureDevice = [ABI42_0_0EXCameraUtils deviceWithMediaType:AVMediaTypeVideo preferringPosition:self.presetCamera];
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
      [self updateZoom];
      [self updateFocusMode];
      [self updateFocusDepth];
      [self updateWhiteBalance];
      [self.previewLayer.connection setVideoOrientation:orientation];
    }

    [self.session commitConfiguration];
  });
}

// Some configuration need to be applied on session after it's started
// - torchMode: https://stackoverflow.com/a/53666293/4337317
- (void)ensureSessionConfiguration
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    [self updateFlashMode];
  });
}

#pragma mark - internal

- (void)updateSessionPreset:(AVCaptureSessionPreset)preset
{
#if !(TARGET_IPHONE_SIMULATOR)
  if (preset) {
    ABI42_0_0UM_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI42_0_0UM_ENSURE_STRONGIFY(self);
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
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
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
        ABI42_0_0UMLogInfo(@"%s: %@", __func__, error);
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
    ABI42_0_0UM_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI42_0_0UM_ENSURE_STRONGIFY(self);
      [self.session startRunning];
      [self ensureSessionConfiguration];
    });
  }
}

- (void)onAppBackgrounded
{
  if ([_session isRunning] && ![self isSessionPaused]) {
    _paused = YES;
    ABI42_0_0UM_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI42_0_0UM_ENSURE_STRONGIFY(self);
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
  ABI42_0_0UM_WEAKIFY(self);
  AVCaptureVideoOrientation videoOrientation = [ABI42_0_0EXCameraUtils videoOrientationForInterfaceOrientation:orientation];
  [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
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
  _videoCodecType = nil;

  [self cleanupMovieFileCapture];
  // If face detection has been running prior to recording to file
  // we reenable it here (see comment in -record).
  [self maybeStartFaceDetection:false];

  if (_session.sessionPreset != _pictureSize) {
    [self updateSessionPreset:_pictureSize];
  }
}

# pragma mark - Face detector

- (id)createFaceDetectorManager
{
  id<ABI42_0_0EXFaceDetectorManagerProviderInterface> faceDetectorProvider = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXFaceDetectorManagerProviderInterface)];

  if (faceDetectorProvider) {
    id<ABI42_0_0EXFaceDetectorManagerInterface> faceDetector = [faceDetectorProvider createFaceDetectorManager];
    if (faceDetector) {
      ABI42_0_0UM_WEAKIFY(self);
      [faceDetector setOnFacesDetected:^(NSArray<NSDictionary *> *faces) {
        ABI42_0_0UM_ENSURE_STRONGIFY(self);
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
  id<ABI42_0_0EXBarCodeScannerProviderInterface> barCodeScannerProvider = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXBarCodeScannerProviderInterface)];
  if (barCodeScannerProvider) {
    id<ABI42_0_0EXBarCodeScannerInterface> barCodeScanner = [barCodeScannerProvider createBarCodeScanner];
    if (barCodeScanner) {
      ABI42_0_0UM_WEAKIFY(self);
      [barCodeScanner setSession:_session];
      [barCodeScanner setSessionQueue:_sessionQueue];
      [barCodeScanner setOnBarCodeScanned:^(NSDictionary *body) {
        ABI42_0_0UM_ENSURE_STRONGIFY(self);
        [self onBarCodeScanned:body];
      }];
    }
    return barCodeScanner;
  }
  return nil;
}

@end
