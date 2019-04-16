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
#import <UMFaceDetectorInterface/UMFaceDetectorManager.h>
#import "Firebase.h"

static const NSString *modeKeyPath = @"mode";
static const NSString *detectLandmarksKeyPath = @"detectLandmarks";
static const NSString *runClassificationsKeyPath = @"runClassifications";

@interface EXFaceDetectorManager() <AVCaptureVideoDataOutputSampleBufferDelegate>

@property (assign, nonatomic) long previousFacesCount;
@property (nonatomic, weak) AVCaptureSession *session;
@property BOOL mirroredImageSession;
@property (nonatomic, weak) dispatch_queue_t sessionQueue;
@property (nonatomic, copy, nullable) void (^onFacesDetected)(NSArray<NSDictionary *> *);
@property (nonatomic, weak) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, assign, getter=isDetectingFaceEnabled) BOOL faceDetectionEnabled;
@property (nonatomic, assign, getter=isFaceDetecionRunning) BOOL faceDetectionRunning;
@property (nonatomic, strong) NSMutableDictionary<NSString *, id> *faceDetectorOptions;
@property (readwrite) BOOL firebaseInitialized;
@property (readwrite) NSInteger lastFrameCapturedTimeMilis;
@property (nonatomic, copy) NSDate *startDetect;

@end

@implementation EXFaceDetectorManager

static NSDictionary *defaultFaceDetectorOptions = nil;

- (instancetype)init
{
  if (self = [super init]) {
    _lastFrameCapturedTimeMilis = 0;
    _previousFacesCount = -1;
    _faceDetectorOptions = [[NSMutableDictionary alloc] initWithDictionary:[[self class] _getDefaultFaceDetectorOptions]];
    _firebaseInitialized = NO;
    _startDetect = [NSDate new];
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
  [self _updateOptionSettingForKey:GMVDetectorFaceMode withJSONValue:settings[modeKeyPath]];
  [self _updateOptionSettingForKey:GMVDetectorFaceLandmarkType withJSONValue:settings[detectLandmarksKeyPath]];
  [self _updateOptionSettingForKey:GMVDetectorFaceClassificationType withJSONValue:settings[runClassificationsKeyPath]];
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
      [self _notifyOfFaces:nil];
      
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
    [self _notifyOfFaces:nil];
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

- (void)_notifyOfFaces:(NSArray<NSDictionary *> *)faces
{
  NSArray<NSDictionary *> *reportableFaces = faces == nil ? @[] : faces;
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

- (void)_updateOptionSettingForKey:(NSString *)key withJSONValue:(NSNumber *)value
{
  long requestedValue = [value longValue];
  long currentValue = [self _getLongOptionValueForKey:key];
  
  if (requestedValue != currentValue) {
    [_faceDetectorOptions setValue:@(requestedValue) forKey:key];
    [self _runBlockIfQueueIsPresent:^{
      [self _resetFaceDetector];
    }];
  }
}

- (void)_runBlockIfQueueIsPresent:(void (^)(void))block
{
  if (_sessionQueue) {
    dispatch_async(_sessionQueue, block);
  }
}

- (FIRVisionFaceDetectorOptions*) mapOptions:(NSDictionary*)options {
  FIRVisionFaceDetectorOptions* result = [FIRVisionFaceDetectorOptions new];
  if([options objectForKey:@"performanceMode"]) {
    result.performanceMode = (FIRVisionFaceDetectorPerformanceMode) options[@"performanceMode"];
  }
  if([options objectForKey:@"landmarkMode"]) {
    result.landmarkMode = (FIRVisionFaceDetectorLandmarkMode) options[@"landmarkMode"];
  }
  if([options objectForKey:@"classificationMode"]) {
    result.classificationMode = (FIRVisionFaceDetectorClassificationMode) options[@"classificationMode"];
  }
  return result;
}

- (void)captureOutput:(AVCaptureVideoDataOutput *)output didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection {
  UIImage* image = [EXFaceDetectorUtils convertBufferToUIImage:sampleBuffer previewSize:_previewLayer.bounds.size mirrored:self.mirroredImageSession];
  float scaleX = _previewLayer.bounds.size.width / image.size.width;
  float scaleY = _previewLayer.bounds.size.height / image.size.height;
  
  NSDate* currentTime = [NSDate new];
  NSTimeInterval timePassed = [currentTime timeIntervalSinceDate:self.startDetect];
  CGAffineTransform transform = CGAffineTransformScale(CGAffineTransformIdentity, scaleX, scaleY);
  if(timePassed > 0.5) {
    _startDetect = currentTime;
    [[[EXFaceDetector alloc] initWithOptions:_faceDetectorOptions] detectFromImage:image facesTransform:transform completionListener:^(NSArray<NSDictionary *> * _Nonnull faces, NSError * _Nonnull error) {
      if(error != nil) {
        [self _notifyOfFaces:nil];
      } else {
        [self _notifyOfFaces:faces];
      }
    }];
  }
}

# pragma mark - Default options

+ (NSDictionary *)_getDefaultFaceDetectorOptions
{
  if (defaultFaceDetectorOptions == nil) {
    [self _initDefaultFaceDetectorOptions];
  }
  
  return defaultFaceDetectorOptions;
}

+ (void)_initDefaultFaceDetectorOptions
{
  defaultFaceDetectorOptions = @{
                                 @"performanceMode" : @(FIRVisionFaceDetectorPerformanceModeFast),
                                 @"landmarkMode" : @(FIRVisionFaceDetectorLandmarkModeNone),
                                 @"classificationMode" : @(FIRVisionFaceDetectorClassificationModeNone)
                                 };
}

@end
