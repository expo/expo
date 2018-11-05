// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBarCodeScanner/EXBarCodeScannerView.h>
#import <EXBarCodeScanner/EXBarCodeScanner.h>
#import <EXBarCodeScanner/EXBarCodeScannerUtils.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXCore/EXUtilities.h>

@interface EXBarCodeScannerView ()

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) EXBarCodeScanner *barCodeScanner;

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, copy) EXDirectEventBlock onCameraReady;
@property (nonatomic, copy) EXDirectEventBlock onMountError;
@property (nonatomic, copy) EXDirectEventBlock onBarCodeScanned;

@end

@implementation EXBarCodeScannerView

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _presetCamera = AVCaptureDevicePositionBack;
    _moduleRegistry = moduleRegistry;
    _session = [AVCaptureSession new];
    _sessionQueue = dispatch_queue_create("barCodeScannerQueue", DISPATCH_QUEUE_SERIAL);
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXAppLifecycleListener)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
    _barCodeScanner = [self createBarCodeScanner];
    
#if !(TARGET_IPHONE_SIMULATOR)
    _previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:_session];
    _previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    _previewLayer.needsDisplayOnBoundsChange = YES;
#endif
    _paused = NO;
    
    [_lifecycleManager registerAppLifecycleListener:self];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(orientationChanged:)
                                                 name:UIDeviceOrientationDidChangeNotification
                                               object:nil];
    
    [self changePreviewOrientation:[UIApplication sharedApplication].statusBarOrientation];
    [self initializeSession];
  }
  return self;
}

# pragma mark - events

- (void)onReady
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

# pragma mark - JS properties setters

- (void)setPresetCamera:(NSInteger)presetCamera
{
  if (_presetCamera == presetCamera) {
    return;
  }
  _presetCamera = presetCamera;
  EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    EX_ENSURE_STRONGIFY(self);
    [self initializeSession];
  });
}

- (void)setBarCodeTypes:(NSArray *)barCodeTypes
{
  _barCodeTypes = barCodeTypes;
  [_barCodeScanner setSettings:@{
                                 @"barCodeTypes": barCodeTypes,
                                 }];
}

# pragma mark - lifecycle

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
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIDeviceOrientationDidChangeNotification
                                                object:nil];
}

- (void)onAppForegrounded
{
  if (![_session isRunning] && [self isSessionPaused]) {
    _paused = NO;
    EX_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      EX_ENSURE_STRONGIFY(self);
      [self.session startRunning];
    });
  }
}

- (void)onAppBackgrounded
{
  if ([_session isRunning] && ![self isSessionPaused]) {
    _paused = YES;
    EX_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      EX_ENSURE_STRONGIFY(self);
      [self.session stopRunning];
    });
  }
}

# pragma mark - orientation

- (void)orientationChanged:(NSNotification *)notification
{
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  [self changePreviewOrientation:orientation];
}

- (void)changePreviewOrientation:(UIInterfaceOrientation)orientation
{
  EX_WEAKIFY(self);
  AVCaptureVideoOrientation videoOrientation = [EXBarCodeScannerUtils videoOrientationForInterfaceOrientation:orientation];
  [EXUtilities performSynchronouslyOnMainThread:^{
    EX_ENSURE_STRONGIFY(self);
    if (self.previewLayer.connection.isVideoOrientationSupported) {
      [self.previewLayer.connection setVideoOrientation:videoOrientation];
    }
  }];
}

# pragma mark - session

- (BOOL)ensurePermissionsGranted
{
  NSDictionary *cameraPermissions = [_permissionsManager getPermissionsForResource:@"camera"];
  if (![cameraPermissions[@"status"] isEqualToString:@"granted"]) {
    [self onMountingError:@{@"message": @"Camera permissions not granted - component could not be rendered."}];
    return FALSE;
  }
  return TRUE;
}

- (void)initializeSession
{
  if (_videoCaptureDeviceInput.device.position == _presetCamera) {
    return;
  }
  
  __block UIInterfaceOrientation interfaceOrientation;
  [EXUtilities performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
  AVCaptureVideoOrientation orientation = [EXBarCodeScannerUtils videoOrientationForInterfaceOrientation:interfaceOrientation];
  
  EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    EX_ENSURE_STRONGIFY(self);
    
    [self.session beginConfiguration];
    
    NSError *error = nil;
    AVCaptureDevice *captureDevice = [EXBarCodeScannerUtils deviceWithMediaType:AVMediaTypeVideo
                                                             preferringPosition:self.presetCamera];
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
      [self.previewLayer.connection setVideoOrientation:orientation];
    }
    
    [self.session commitConfiguration];
    if (!self.session.isRunning) {
      [self startSession];
    }
  });
}

- (void)startSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  if (![self ensurePermissionsGranted]) {
    return;
  };

  EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    EX_ENSURE_STRONGIFY(self);
    
    if (self.presetCamera == AVCaptureDevicePositionUnspecified) {
      return;
    }
    
    [self setRuntimeErrorHandlingObserver:
     [[NSNotificationCenter defaultCenter] addObserverForName:AVCaptureSessionRuntimeErrorNotification
                                                       object:self.session
                                                        queue:nil
                                                   usingBlock:^(NSNotification *note) {
      EX_ENSURE_STRONGIFY(self);
      dispatch_async(self.sessionQueue, ^{
        EX_ENSURE_STRONGIFY(self);
        // Manually restarting the session since it must have been stopped due to an error.
        [self.session startRunning];
        [self onReady];
      });
    }]];
    
    [self.barCodeScanner maybeStartBarCodeScanning];
    
    [self.session startRunning];
    [self onReady];
  });
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  EX_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    EX_ENSURE_STRONGIFY(self);
    
    [self.barCodeScanner stopBarCodeScanning];
    
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

# pragma mark - BarCode scanner

- (EXBarCodeScanner *)createBarCodeScanner
{
  EXBarCodeScanner *barCodeScanner = [EXBarCodeScanner new];
  [barCodeScanner setSession:_session];
  [barCodeScanner setSessionQueue:_sessionQueue];
  EX_WEAKIFY(self);
  [barCodeScanner setOnBarCodeScanned:^(NSDictionary *body) {
    EX_ENSURE_STRONGIFY(self);
    [self onBarCodeScanned:body];
  }];
  [barCodeScanner setIsEnabled:true];
  return barCodeScanner;
}

@end
