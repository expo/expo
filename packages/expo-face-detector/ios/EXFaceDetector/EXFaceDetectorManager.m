//
//  EXFaceDetectorManager.m
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.

#import <EXFaceDetector/EXFaceEncoder.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <EXFaceDetector/EXFaceDetectorModule.h>
#import <EXFaceDetector/EXFaceDetectorManager.h>
#import <EXFaceDetector/EXFaceDetector.h>
#import <EXFaceDetector/CSBufferOrientationCalculator.h>
#import <UMFaceDetectorInterface/UMFaceDetectorManager.h>
#import "Firebase.h"

static const NSString *kMinDetectionIntervalMillis = @"minDetectionIntervalMillis";

@interface EXFaceDetectorManager() <AVCaptureVideoDataOutputSampleBufferDelegate>

@property (assign, nonatomic) long previousFacesCount;
@property (nonatomic, weak) AVCaptureSession *session;
@property BOOL mirroredImageSession;
@property UIInterfaceOrientation interfaceOrientation;
@property (nonatomic, weak) dispatch_queue_t sessionQueue;
@property (nonatomic, copy, nullable) void (^onFacesDetected)(NSArray<NSDictionary *> *);
@property (nonatomic, weak) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, assign, getter=isDetectingFaceEnabled) BOOL faceDetectionEnabled;
@property (nonatomic, assign, getter=isFaceDetecionRunning) BOOL faceDetectionRunning;
@property (nonatomic, strong) FIRVisionFaceDetectorOptions* faceDetectorOptions;
@property (readwrite) BOOL firebaseInitialized;
@property (readwrite) NSInteger lastFrameCapturedTimeMilis;
@property (nonatomic, copy) NSDate *startDetect;
@property (atomic) BOOL faceDetectionProcessing;
@property NSInteger timeIntervalMillis;
@property EXFaceEncoder* encoder;

@end

@implementation EXFaceDetectorManager

- (instancetype)init
{
  return [self initWithOptions:[EXFaceDetectorUtils defaultFaceDetectorOptions]];
}

- (instancetype)initWithOptions:(NSDictionary*)options
{
  if (self = [super init]) {
    _faceDetectionProcessing = NO;
    _lastFrameCapturedTimeMilis = 0;
    _previousFacesCount = -1;
    _faceDetectorOptions = [EXFaceDetectorUtils mapOptions:options];
    _firebaseInitialized = NO;
    _timeIntervalMillis = 0;
    _startDetect = [NSDate new];
    _interfaceOrientation = UIInterfaceOrientationUnknown;
  }
  return self;
}

# pragma mark Properties setters

- (void)setSession:(AVCaptureSession *)session
{
  _session = session;
}

# pragma mark - JS properties setters

- (void)setIsEnabled:(BOOL)newFaceDetecting
{
  // If the data output is already initialized, we toggle its connections instead of adding/removing the output from camera session.
  // It allows us to smoothly toggle face detection without interrupting preview and reconfiguring camera session.
  
  if ([self isDetectingFaceEnabled] != newFaceDetecting) {
    _faceDetectionEnabled = newFaceDetecting;
    __weak EXFaceDetectorManager *weakSelf = self;
    [self _runBlockIfQueueIsPresent:^{
      __strong EXFaceDetectorManager *strongSelf = weakSelf;
      if (strongSelf) {
        if ([strongSelf isDetectingFaceEnabled]) {
          if (![strongSelf isFaceDetecionRunning]) {
            [strongSelf tryEnablingFaceDetection];
          }
        }
      }
    }];
  }
}

- (void)updateSettings:(NSDictionary *)settings
{
  FIRVisionFaceDetectorOptions* newOptions = [EXFaceDetectorUtils newOptions:self.faceDetectorOptions withValues:settings];
  if(![EXFaceDetectorUtils areOptionsEqual:newOptions to:self.faceDetectorOptions])
  {
    self.faceDetectorOptions = newOptions;
    [self _resetFaceDetector];
  }
  if([settings objectForKey:kMinDetectionIntervalMillis])
  {
    self.timeIntervalMillis = [settings[kMinDetectionIntervalMillis] longValue];
  }
}

- (void)updateMirrored:(BOOL)mirrored
{
  self.mirroredImageSession = mirrored;
}

# pragma mark - Public API

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer
{
  [self maybeStartFaceDetectionOnSession:session withPreviewLayer:previewLayer mirrored:NO];
}

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer mirrored:(BOOL)mirrored
{
  _session = session;
  _mirroredImageSession = mirrored;
  _previewLayer = previewLayer;
  
  [self tryEnablingFaceDetection];
}

- (void)tryEnablingFaceDetection
{
  if (!_session) {
    return;
  }
  [self initializeFirebase];
  [_session beginConfiguration];
  
  if ([self isDetectingFaceEnabled]) {
    @try {
      AVCaptureVideoDataOutput* output = [[AVCaptureVideoDataOutput alloc] init];
      output.alwaysDiscardsLateVideoFrames = YES;
      [output setSampleBufferDelegate:self queue:_sessionQueue];
      
      [self setFaceDetectionRunning:YES];
      [self _notifyOfFaces:nil withEncoder:nil];
      
      if([_session canAddOutput:output]) {
        [_session addOutput:output];
      } else {
        UMLogError(@"Unable to add output to camera session! Face detection aborted!");
      }
    } @catch (NSException *exception) {
      UMLogWarn(@"%@", [exception description]);
    }
  }
  
  [_session commitConfiguration];
}

- (void)stopFaceDetection
{
  [self setFaceDetectionRunning:NO];
  if (!_session) {
    return;
  }
  
  [_session beginConfiguration];
  
  [_session commitConfiguration];
  
  if ([self isDetectingFaceEnabled]) {
    _previousFacesCount = -1;
    [self _notifyOfFaces:nil withEncoder:nil];
  }
}

# pragma mark Private API

- (void)initializeFirebase {
  if(!_firebaseInitialized) {
    _firebaseInitialized = YES;
  }
}

- (void)_resetFaceDetector
{
  [self stopFaceDetection];
  [self tryEnablingFaceDetection];
}

- (void)_notifyOfFaces:(NSArray<FIRVisionFace *> *)faces withEncoder:(EXFaceEncoder*)encoder
{
  NSArray<FIRVisionFace *> *nonEmptyFaces = faces == nil ? @[] : faces;
  NSMutableArray<NSDictionary*>* reportableFaces = [NSMutableArray new];
  
  for(FIRVisionFace* face in nonEmptyFaces)
  {
    [reportableFaces addObject:[encoder encode:face]];
  }
  
  // Send event when there are faces that have been detected ([faces count] > 0)
  // or if the listener may think that there are still faces in the video (_prevCount > 0)
  // or if we really want the event to be sent, eg. to reset listener info (_prevCount == -1).
  if ([reportableFaces count] > 0 || _previousFacesCount != 0) {
    if (_onFacesDetected) {
      _onFacesDetected(reportableFaces);
    }
    // Maybe if the delegate is not present anymore we should disable encoding,
    // however this should never happen.
    
    _previousFacesCount = [reportableFaces count];
  }
}

# pragma mark - Utilities

- (long)_getLongOptionValueForKey:(NSString *)key
{
  return [(NSNumber *)[_faceDetectorOptions valueForKey:key] longValue];
}

- (void)_runBlockIfQueueIsPresent:(void (^)(void))block
{
  if (_sessionQueue) {
    dispatch_async(_sessionQueue, block);
  }
}

- (void)captureOutput:(AVCaptureVideoDataOutput *)output didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection {
  
  dispatch_async(dispatch_get_main_queue(), ^{
    self.interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
  });
  
  NSDate* currentTime = [NSDate new];
  double timePassedMillis = [currentTime timeIntervalSinceDate:self.startDetect] * 1000;
  if(timePassedMillis > self.timeIntervalMillis) {
    
    if(self.faceDetectionProcessing)
    {
      return;
    }
    
    self.startDetect = currentTime;
    // This flag is used to drop frames when previous were not processed on time.
    self.faceDetectionProcessing = YES;
    
    float outputHeight = [(NSNumber *)output.videoSettings[@"Height"] floatValue];
    float outputWidth = [(NSNumber *)output.videoSettings[@"Width"] floatValue];
    if(UIInterfaceOrientationIsPortrait(_interfaceOrientation)) { // We need to inverse width and height in portrait
      outputHeight = [(NSNumber *)output.videoSettings[@"Width"] floatValue];
      outputWidth = [(NSNumber *)output.videoSettings[@"Height"] floatValue];
    }
    float previewWidth =_previewLayer.bounds.size.width;
    float previewHeight = _previewLayer.bounds.size.height;
    
    angleTransformer angleTransform = ^(float angle) { return -angle; };
    
    CGAffineTransform transformation = [CSBufferOrientationCalculator pointTransformForInterfaceOrientation:_interfaceOrientation
                                                                                             forBufferWidth:outputWidth andBufferHeight:outputHeight
                                                                                              andVideoWidth:previewWidth andVideoHeight:previewHeight andMirrored:_mirroredImageSession];
    
    FIRVisionImageMetadata* metadata = [EXFaceDetectorManager metadataForInterfaceOrientation:_interfaceOrientation andMirrored:_mirroredImageSession];
    
    _startDetect = currentTime;
    [[[EXFaceDetector alloc] initWithOptions:_faceDetectorOptions] detectFromBuffer:sampleBuffer metadata:metadata completionListener:^(NSArray<FIRVisionFace *> * _Nonnull faces, NSError * _Nonnull error) {
      if(error != nil) {
        [self _notifyOfFaces:nil withEncoder:nil];
      } else {
        [self _notifyOfFaces:faces withEncoder:[[EXFaceEncoder alloc] initWithTransform:transformation withRotationTransform:angleTransform]];
      }
      self.faceDetectionProcessing = NO;
    }];
  }
}

+(FIRVisionImageMetadata*)metadataForInterfaceOrientation:(UIInterfaceOrientation)orientation andMirrored:(BOOL)mirrored
{
  FIRVisionDetectorImageOrientation imageOrientation;
  switch (orientation) {
    case UIInterfaceOrientationPortrait:
      if (mirrored) {
        imageOrientation = FIRVisionDetectorImageOrientationLeftTop;
      } else {
        imageOrientation = FIRVisionDetectorImageOrientationRightTop;
      }
      break;
    case UIInterfaceOrientationLandscapeRight:
      if (mirrored) {
        imageOrientation = FIRVisionDetectorImageOrientationBottomLeft;
      } else {
        imageOrientation = FIRVisionDetectorImageOrientationTopLeft;
      }
      break;
    case UIInterfaceOrientationPortraitUpsideDown:
      if (mirrored) {
        imageOrientation = FIRVisionDetectorImageOrientationRightBottom;
      } else {
        imageOrientation = FIRVisionDetectorImageOrientationLeftBottom;
      }
      break;
    case UIInterfaceOrientationLandscapeLeft:
      if (mirrored) {
        imageOrientation = FIRVisionDetectorImageOrientationTopRight;
      } else {
        imageOrientation = FIRVisionDetectorImageOrientationBottomRight;
      }
      break;
    default:
      imageOrientation = FIRVisionDetectorImageOrientationRightTop;
      break;
  }
  
  FIRVisionImageMetadata* metadata = [[FIRVisionImageMetadata alloc] init];
  metadata.orientation = imageOrientation;
  return metadata;
}

@end
