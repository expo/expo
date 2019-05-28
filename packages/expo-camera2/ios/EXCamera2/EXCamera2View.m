// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCamera2/EXCamera2View.h>
#import <AVFoundation/AVFoundation.h>
#import <UMCore/UMDefines.h>

#define DISPATCH_ON_SESSION_QUEUE_WITH_SELF(block) \
  UM_WEAKIFY(self); \
  dispatch_async(self.sessionQueue, ^{ \
    UM_ENSURE_STRONGIFY(self); \
    block \
  })
#define DISPATCH_ON_MAIN_QUEUE_WITH_SELF(block) \
  UM_WEAKIFY(self); \
  dispatch_async(dispatch_get_main_queue(), ^{ \
    UM_ENSURE_STRONGIFY(self); \
    block \
  })

static void* SessionRunningContext = &SessionRunningContext;
static void* SystemPressureContext = &SystemPressureContext;

@interface EXCamera2View ()

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, strong) AVCaptureDeviceDiscoverySession *deviceDiscoverySession;
@property (nonatomic, strong) AVCaptureDeviceInput *videoDeviceInput;

@property (nonatomic) UnimodulesCameraState state;
@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, copy) UMDirectEventBlock onCameraReady;
@property (nonatomic, copy) UMDirectEventBlock onMountError;

@end

@implementation EXCamera2View

- (instancetype)init
{
  if ((self = [super init])) {
    _sessionQueue = dispatch_queue_create("ExpoCameraQueue", DISPATCH_QUEUE_SERIAL);
    _session = [AVCaptureSession new];

    NSMutableArray<AVCaptureDeviceType> *deviceTypes = [[NSMutableArray alloc] initWithArray:@[AVCaptureDeviceTypeBuiltInWideAngleCamera]];
    if (@available(iOS 10.2, *)) {
      [deviceTypes addObject:AVCaptureDeviceTypeBuiltInDualCamera];
    }
    if (@available(iOS 11.1, *)) {
      [deviceTypes addObject:AVCaptureDeviceTypeBuiltInTrueDepthCamera];
    }
    _deviceDiscoverySession = [AVCaptureDeviceDiscoverySession discoverySessionWithDeviceTypes:deviceTypes
                                                                                     mediaType:AVMediaTypeVideo
                                                                                      position:AVCaptureDevicePositionUnspecified];

    switch ([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo]) {
      case AVAuthorizationStatusAuthorized:
        _state = UnimodulesCameraStateInitialized;
        break;

      default:
        _state = UnimodulesCameraStateNoCameraAccess;
        break;
    }

    [self addObservers];
    [self configurePreview];
    [self configureSession];
    [self startSession];

    _paused = NO;
  }
  return self;
}

# pragma mark - View & Preview

- (void)layoutSubviews
{
  [super layoutSubviews];
  _previewLayer.frame = self.bounds;
}

- (void)removeFromSuperview
{
  [self removeObservers];
  [self cleanUpPreview];
  [self stopSession];
  [super removeFromSuperview];
}

- (void)configurePreview
{
# if TARGET_IPHONE_SIMULATOR
  // TODO: (bbarthec) handle SIMULATOR
# else
  _previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:_session];
  _previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
  _previewLayer.needsDisplayOnBoundsChange = YES;
  [self.layer insertSublayer:_previewLayer atIndex:0];
# endif
}

- (void)cleanUpPreview
{
  [_previewLayer removeFromSuperlayer];
}

# pragma mark - lifecycle

- (void)adjustPreviewOrientation
{
  DISPATCH_ON_MAIN_QUEUE_WITH_SELF({
    UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
    AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
    if (statusBarOrientation != UIInterfaceOrientationUnknown) {
      initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
    }
    if (self.previewLayer.connection.isVideoOrientationSupported) {
      self.previewLayer.connection.videoOrientation = initialVideoOrientation;
    }
  });
}

- (void)configureSession
{
  if (self.state != UnimodulesCameraStateInitialized) {
    return;
  }
  DISPATCH_ON_SESSION_QUEUE_WITH_SELF({
    [self.session beginConfiguration];

    /*
      We do not create an AVCaptureMovieFileOutput when setting up the session because
      Live Photo is not supported when AVCaptureMovieFileOutput is added to the session.
      */
    self.session.sessionPreset = AVCaptureSessionPresetPhoto;

    AVCaptureDevice* videoDevice;
    if (@available(iOS 10.2, *)) {
      // Choose the back dual camera if available, otherwise default to a wide angle camera.
      videoDevice = [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInDualCamera
                                                       mediaType:AVMediaTypeVideo
                                                        position:AVCaptureDevicePositionBack];
    }
    if (!videoDevice) {
      // If a rear dual camera is not available, default to the rear wide angle camera.
      videoDevice = [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInWideAngleCamera
                                                       mediaType:AVMediaTypeVideo
                                                        position:AVCaptureDevicePositionBack];
    }
    if (!videoDevice) {
      // In the event that the rear wide angle camera isn't available, default to the front wide angle camera.
      videoDevice = [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInWideAngleCamera
                                                       mediaType:AVMediaTypeVideo
                                                        position:AVCaptureDevicePositionFront];
    }

    NSError *error;
    AVCaptureDeviceInput *videoDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:videoDevice
                                                                                   error:&error];
    if (!videoDeviceInput) {
      NSLog(@"Could not create video device input: %@", error);
      self.state = UnimodulesCameraStateConfigurationFailed;
      [self.session commitConfiguration];
      return;
    }

    if ([self.session canAddInput:videoDeviceInput]) {
      [self.session addInput:videoDeviceInput];
      self.videoDeviceInput = videoDeviceInput;
      [self adjustPreviewOrientation];
    } else {
      NSLog(@"Could not add video device input to the session");
      self.state = UnimodulesCameraStateConfigurationFailed;
      [self.session commitConfiguration];
      return;
    }

    [self.session commitConfiguration];
  });
}

- (void)startSession
{
  DISPATCH_ON_SESSION_QUEUE_WITH_SELF({
    [self.session startRunning];
    self.state = UnimodulesCameraStateRunning;
  });
}

- (void)stopSession
{
  DISPATCH_ON_SESSION_QUEUE_WITH_SELF({
    [self.session commitConfiguration];
    [self.session stopRunning];
  });
}


# pragma mark - KVO and notifications

- (void)addObservers
{
  /*
    Observe system possible high load.
    */
  [self.session addObserver:self
                 forKeyPath:@"running"
                    options:NSKeyValueObservingOptionNew
                    context:SessionRunningContext];
  [self addObserver:self
         forKeyPath:@"videoDeviceInput.device.systemPressureState"
            options:NSKeyValueObservingOptionNew
            context:SystemPressureContext];

  /*
    Observe orienatation changes.
    */
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(orientationChanged:)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:nil];

  /*
    Pay attension to capture session specific notifications.
    */
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(subjectAreaDidChange:)
                                               name:AVCaptureDeviceSubjectAreaDidChangeNotification
                                             object:self.videoDeviceInput.device];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sessionRuntimeError:)
                                               name:AVCaptureSessionRuntimeErrorNotification
                                             object:self.session];

  /*
    A session can only run when the app is full screen. It will be interrupted
    in a multi-app layout, introduced in iOS 9, see also the documentation of
    AVCaptureSessionInterruptionReason. Add observers to handle these session
    interruptions and show a preview is paused message. See the documentation
    of AVCaptureSessionWasInterruptedNotification for other interruption reasons.
    */
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sessionWasInterrupted:)
                                               name:AVCaptureSessionWasInterruptedNotification
                                             object:self.session];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sessionInterruptionEnded:)
                                               name:AVCaptureSessionInterruptionEndedNotification
                                             object:self.session];
}

- (void)removeObservers
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [self.session removeObserver:self
                      forKeyPath:@"running"
                         context:SessionRunningContext];
    [self removeObserver:self
              forKeyPath:@"videoDeviceInput.device.systemPressureState"
                 context:SystemPressureContext];
}

- (void)observeValueForKeyPath:(NSString*)keyPath
                      ofObject:(id)object
                        change:(NSDictionary*)change
                       context:(void*)context
{
  if (context == SessionRunningContext) {
//        BOOL isSessionRunning = [change[NSKeyValueChangeNewKey] boolValue];
//        TODO: (bbarthec) handle SessionRunningContext KVO
  } else if (context == SystemPressureContext) {
//        TODO: (bbarthec) handle SystemPressureContext KVO
//        AVCaptureSystemPressureState* systemPressureState = change[NSKeyValueChangeNewKey];
//        [self setRecommendedFrameRateRangeForPressureState:systemPressureState];
  } else {
      [super observeValueForKeyPath:keyPath
                           ofObject:object
                             change:change
                            context:context];
    }
}

- (void)orientationChanged:(NSNotification *)notifination
{
  [self adjustPreviewOrientation];
}

- (void)subjectAreaDidChange:(NSNotification*)notification
{
//    TODO: (bbarthec) to be implemented

//    CGPoint devicePoint = CGPointMake(0.5, 0.5);
//    [self focusWithMode:AVCaptureFocusModeContinuousAutoFocus
//         exposeWithMode:AVCaptureExposureModeContinuousAutoExposure
//          atDevicePoint:devicePoint monitorSubjectAreaChange:NO];
}

- (void)sessionRuntimeError:(NSNotification*)notification
{
  NSError* error = notification.userInfo[AVCaptureSessionErrorKey];
  NSLog(@"Capture session runtime error: %@", error);

//    TODO: (bbarthec) to be implemented

//    // If media services were reset, and the last start succeeded, restart the session.
//    if (error.code == AVErrorMediaServicesWereReset) {
//        dispatch_async(self.sessionQueue, ^{
//            if (self.isSessionRunning) {
//                [self.session startRunning];
//                self.sessionRunning = self.session.isRunning;
//            }
//        });
//    }
}

- (void)setRecommendedFrameRateRangeForPressureState:(AVCaptureSystemPressureState*)systemPressureState API_AVAILABLE(ios(11.1))
{
//    TODO: (bbarthec) to be implemented

//    /*
//     The frame rates used here are for demonstrative purposes only for this app.
//     Your frame rate throttling may be different depending on your app's camera configuration.
//     */
//    AVCaptureSystemPressureLevel pressureLevel = [systemPressureState level];
//    if (pressureLevel == AVCaptureSystemPressureLevelSerious || pressureLevel == AVCaptureSystemPressureLevelCritical) {
//        if (![self.movieFileOutput isRecording] && [self.videoDeviceInput.device lockForConfiguration:nil]) {
//            NSLog(@"WARNING: Reached elevated system pressure level: %@. Throttling frame rate.", pressureLevel);
//            self.videoDeviceInput.device.activeVideoMinFrameDuration = CMTimeMake(1, 20);
//            self.videoDeviceInput.device.activeVideoMaxFrameDuration = CMTimeMake(1, 15);
//            [self.videoDeviceInput.device unlockForConfiguration];
//        }
//    }
//    else if (pressureLevel == AVCaptureSystemPressureLevelShutdown) {
//        NSLog(@"Session stopped running due to shutdown system pressure level.");
//    }
}

- (void)sessionWasInterrupted:(NSNotification*)notification
{
//    TODO: (bbarthec) to be implemented

//    /*
//     In some scenarios we want to enable the user to resume the session running.
//     For example, if music playback is initiated via control center while
//     using AVCam, then the user can let AVCam resume
//     the session running, which will stop music playback. Note that stopping
//     music playback in control center will not automatically resume the session
//     running. Also note that it is not always possible to resume, see -[resumeInterruptedSession:].
//     */
//    BOOL showResumeButton = NO;
//
//    AVCaptureSessionInterruptionReason reason = [notification.userInfo[AVCaptureSessionInterruptionReasonKey] integerValue];
//    NSLog(@"Capture session was interrupted with reason %ld", (long)reason);
//
//    if (reason == AVCaptureSessionInterruptionReasonAudioDeviceInUseByAnotherClient ||
//        reason == AVCaptureSessionInterruptionReasonVideoDeviceInUseByAnotherClient) {
//        showResumeButton = YES;
//    }
//    else if (reason == AVCaptureSessionInterruptionReasonVideoDeviceNotAvailableWithMultipleForegroundApps) {
//        // Fade-in a label to inform the user that the camera is unavailable.
//        self.cameraUnavailableLabel.alpha = 0.0;
//        self.cameraUnavailableLabel.hidden = NO;
//        [UIView animateWithDuration:0.25 animations:^{
//            self.cameraUnavailableLabel.alpha = 1.0;
//        }];
//    }
//    else if (reason == AVCaptureSessionInterruptionReasonVideoDeviceNotAvailableDueToSystemPressure) {
//        NSLog(@"Session stopped running due to shutdown system pressure level.");
//    }
//
//    if (showResumeButton) {
//        // Fade-in a button to enable the user to try to resume the session running.
//        self.resumeButton.alpha = 0.0;
//        self.resumeButton.hidden = NO;
//        [UIView animateWithDuration:0.25 animations:^{
//            self.resumeButton.alpha = 1.0;
//        }];
//    }
}

- (void)sessionInterruptionEnded:(NSNotification*)notification
{
//    TODO: (bbarthec) to be implemented

//    NSLog(@"Capture session interruption ended");
//
//    if (!self.resumeButton.hidden) {
//        [UIView animateWithDuration:0.25 animations:^{
//            self.resumeButton.alpha = 0.0;
//        } completion:^(BOOL finished) {
//            self.resumeButton.hidden = YES;
//        }];
//    }
//    if (!self.cameraUnavailableLabel.hidden) {
//        [UIView animateWithDuration:0.25 animations:^{
//            self.cameraUnavailableLabel.alpha = 0.0;
//        } completion:^(BOOL finished) {
//            self.cameraUnavailableLabel.hidden = YES;
//        }];
//    }
}

# pragma Mark - UMAppLifecycleListener

- (void)onAppForegrounded
{
  if ([_session isRunning] || ![self isSessionPaused]) {
    return;
  }

  _paused = NO;
  DISPATCH_ON_SESSION_QUEUE_WITH_SELF({
    [self.session startRunning];
  });
}

- (void)onAppBackgrounded
{
  if (![_session isRunning] || [self isSessionPaused]) {
    return;
  }

  _paused = YES;
  DISPATCH_ON_SESSION_QUEUE_WITH_SELF({
    [self.session stopRunning];
  });
}

# pragma mark - Camera Properties

- (void)setAutofocus:(NSInteger)autofocus
{
//    TODO: (bbarthec) handle property
//    _autofocus = autofocus;
}

- (void)setFacing:(NSInteger)facing
{
//    TODO: (bbarthec) handle property
//    _facing = facing;
}

- (void)setFlashMode:(NSInteger)flashMode
{
//    TODO: (bbarthec) handle property
//    _flashMode = flashMode;
}

- (void)setFocusDepth:(CGFloat)focusDepth
{
//    TODO: (bbarthec) handle property
//    _focusDepth = focusDepth;
}

- (void)setWhiteBalance:(NSInteger)whiteBalance
{
//    TODO: (bbarthec) handle property
//    _whiteBalance = whiteBalance;
}

- (void)setZoom:(CGFloat)zoom
{
//    TODO: (bbarthec) handle property
//    _zoom = zoom;
}

# pragma mark - Camera Actions

- (void)pausePreviewWithCompletion:(void (^_Nullable)(id _Nullable))onSuccess
                          andError:(void (^_Nullable)(NSString * _Nonnull, NSError * _Nullable))onError
{

}

- (void)resumePreviewWithCompletion:(void (^_Nullable)(id _Nullable))onSuccess
                           andError:(void (^_Nullable)(NSString * _Nonnull, NSError * _Nullable))onError
{

}

@end
