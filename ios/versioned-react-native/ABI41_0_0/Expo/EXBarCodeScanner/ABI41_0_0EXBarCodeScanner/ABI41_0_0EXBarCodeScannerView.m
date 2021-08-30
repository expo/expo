// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScannerView.h>
#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScanner.h>
#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScannerUtils.h>
#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeCameraRequester.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

@interface ABI41_0_0EXBarCodeScannerView ()

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;
@property (nonatomic, strong) AVCaptureDeviceInput *videoCaptureDeviceInput;
@property (nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property (nonatomic, strong) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, strong) id runtimeErrorHandlingObserver;
@property (nonatomic, strong) ABI41_0_0EXBarCodeScanner *barCodeScanner;

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI41_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI41_0_0UMAppLifecycleService> lifecycleManager;

@property (nonatomic, assign, getter=isSessionPaused) BOOL paused;

@property (nonatomic, copy) ABI41_0_0UMDirectEventBlock onCameraReady;
@property (nonatomic, copy) ABI41_0_0UMDirectEventBlock onMountError;
@property (nonatomic, copy) ABI41_0_0UMDirectEventBlock onBarCodeScanned;

@end

@implementation ABI41_0_0EXBarCodeScannerView

- (instancetype)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _presetCamera = AVCaptureDevicePositionBack;
    _moduleRegistry = moduleRegistry;
    _session = [AVCaptureSession new];
    _sessionQueue = dispatch_queue_create("barCodeScannerQueue", DISPATCH_QUEUE_SERIAL);
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMAppLifecycleListener)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMPermissionsInterface)];
    _barCodeScanner = [self createBarCodeScanner];
    
#if !(TARGET_IPHONE_SIMULATOR)
    _previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:_session];
    _previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    _previewLayer.needsDisplayOnBoundsChange = YES;
    [_barCodeScanner setPreviewLayer:_previewLayer];
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
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
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
    ABI41_0_0UM_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI41_0_0UM_ENSURE_STRONGIFY(self);
      [self.session startRunning];
    });
  }
}

- (void)onAppBackgrounded
{
  if ([_session isRunning] && ![self isSessionPaused]) {
    _paused = YES;
    ABI41_0_0UM_WEAKIFY(self);
    dispatch_async(_sessionQueue, ^{
      ABI41_0_0UM_ENSURE_STRONGIFY(self);
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
  ABI41_0_0UM_WEAKIFY(self);
  AVCaptureVideoOrientation videoOrientation = [ABI41_0_0EXBarCodeScannerUtils videoOrientationForInterfaceOrientation:orientation];
  [ABI41_0_0UMUtilities performSynchronouslyOnMainThread:^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    if (self.previewLayer.connection.isVideoOrientationSupported) {
      [self.previewLayer.connection setVideoOrientation:videoOrientation];
    }
  }];
}

# pragma mark - session

- (BOOL)ensurePermissionsGranted
{
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[ABI41_0_0EXBareCodeCameraRequester class]]) {
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
  [ABI41_0_0UMUtilities performSynchronouslyOnMainThread:^{
    interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  }];
  AVCaptureVideoOrientation orientation = [ABI41_0_0EXBarCodeScannerUtils videoOrientationForInterfaceOrientation:interfaceOrientation];
  
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    
    [self.session beginConfiguration];
    
    NSError *error = nil;
    AVCaptureDevice *captureDevice = [ABI41_0_0EXBarCodeScannerUtils deviceWithMediaType:AVMediaTypeVideo
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
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunreachable-code"
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  if (![self ensurePermissionsGranted]) {
    return;
  };

  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    
    if (self.presetCamera == AVCaptureDevicePositionUnspecified) {
      return;
    }
    
    [self setRuntimeErrorHandlingObserver:
     [[NSNotificationCenter defaultCenter] addObserverForName:AVCaptureSessionRuntimeErrorNotification
                                                       object:self.session
                                                        queue:nil
                                                   usingBlock:^(NSNotification *note) {
      ABI41_0_0UM_ENSURE_STRONGIFY(self);
      dispatch_async(self.sessionQueue, ^{
        ABI41_0_0UM_ENSURE_STRONGIFY(self);
        // Manually restarting the session since it must have been stopped due to an error.
        [self.session startRunning];
        [self onReady];
      });
    }]];
    
    [self.barCodeScanner maybeStartBarCodeScanning];
    
    [self.session startRunning];
    [self onReady];
  });
#pragma clang diagnostic pop
}

- (void)stopSession
{
#if TARGET_IPHONE_SIMULATOR
  return;
#endif
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(_sessionQueue, ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    
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

- (ABI41_0_0EXBarCodeScanner *)createBarCodeScanner
{
  ABI41_0_0EXBarCodeScanner *barCodeScanner = [ABI41_0_0EXBarCodeScanner new];
  [barCodeScanner setSession:_session];
  [barCodeScanner setSessionQueue:_sessionQueue];
  ABI41_0_0UM_WEAKIFY(self);
  [barCodeScanner setOnBarCodeScanned:^(NSDictionary *body) {
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    [self onBarCodeScanned:body];
  }];
  [barCodeScanner setIsEnabled:true];
  return barCodeScanner;
}

@end
