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
#import <EXFaceDetectorInterface/EXFaceDetectorManager.h>

static const NSString *modeKeyPath = @"mode";
static const NSString *detectLandmarksKeyPath = @"detectLandmarks";
static const NSString *runClassificationsKeyPath = @"runClassifications";

@interface EXFaceDetectorManager() <GMVDataOutputDelegate>

@property (assign, nonatomic) long previousFacesCount;
@property (nonatomic, strong) GMVDataOutput *dataOutput;
@property (nonatomic, weak) AVCaptureSession *session;
@property (nonatomic, weak) dispatch_queue_t sessionQueue;
@property (nonatomic, assign, getter=isConnected) BOOL connected;
@property (nonatomic, copy, nullable) void (^onFacesDetected)(NSArray<NSDictionary *> *);
@property (nonatomic, weak) AVCaptureVideoPreviewLayer *previewLayer;
@property (nonatomic, assign, getter=isDetectingFaces) BOOL faceDetecting;
@property (nonatomic, strong) NSMutableDictionary<NSString *, id> *faceDetectorOptions;

@end

@implementation EXFaceDetectorManager

static NSDictionary *defaultFaceDetectorOptions = nil;

- (instancetype)init
{
  if (self = [super init]) {
    _previousFacesCount = -1;
    _faceDetectorOptions = [[NSMutableDictionary alloc] initWithDictionary:[[self class] _getDefaultFaceDetectorOptions]];
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
  
  if ([self isDetectingFaces] != newFaceDetecting) {
    _faceDetecting = newFaceDetecting;
    __weak EXFaceDetectorManager *weakSelf = self;
    [self _runBlockIfQueueIsPresent:^{
      __strong EXFaceDetectorManager *strongSelf = weakSelf;
      if (strongSelf) {
        if ([strongSelf isDetectingFaces]) {
          if (strongSelf.dataOutput) {
            [strongSelf _setConnectionsEnabled:true];
          } else {
            [strongSelf tryEnablingFaceDetection];
          }
        } else {
          [strongSelf _setConnectionsEnabled:false];
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

# pragma mark - Public API

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer
{
  _session = session;
  _previewLayer = previewLayer;
  [self tryEnablingFaceDetection];
}

- (void)tryEnablingFaceDetection
{
  if (!_session) {
    return;
  }
  
  [_session beginConfiguration];
  
  if ([self isDetectingFaces]) {
    @try {
      GMVDetector *faceDetector = [GMVDetector detectorOfType:GMVDetectorTypeFace options:_faceDetectorOptions];
      GMVDataOutput *dataOutput = [[GMVMultiDataOutput alloc] initWithDetector:faceDetector];
      [dataOutput setDataDelegate:self];
      
      if ([_session canAddOutput:dataOutput]) {
        [_session addOutput:dataOutput];
        _dataOutput = dataOutput;
        _connected = true;
      }
      
      _previousFacesCount = -1;
      [self _notifyOfFaces:nil];
    } @catch (NSException *exception) {
      EXLogWarn(@"%@", [exception description]);
    }
  }
  
  [_session commitConfiguration];
}

- (void)stopFaceDetection
{
  if (!_session) {
    return;
  }
  
  [_session beginConfiguration];
  
  if ([_session.outputs containsObject:_dataOutput]) {
    [_session removeOutput:_dataOutput];
    [_dataOutput cleanup];
    _dataOutput = nil;
    _connected = false;
  }
  
  [_session commitConfiguration];
  
  if ([self isDetectingFaces]) {
    _previousFacesCount = -1;
    [self _notifyOfFaces:nil];
  }
}

# pragma mark Private API

- (void)_setConnectionsEnabled:(BOOL)enabled
{
  if (!_dataOutput) {
    return;
  }
  for (AVCaptureConnection *connection in _dataOutput.connections) {
    connection.enabled = enabled;
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

#pragma mark - GMVDataOutputDelegate

- (void)dataOutput:(GMVDataOutput *)dataOutput didFinishedDetection:(NSArray<__kindof GMVFeature *> *)results
{
  // Calling dataOutput:didFinishedDetection with dataOutput that in videoSettings has no information about
  // width or height started happen after refactor: moving face detection logic from EXCameraManager to EXFaceDetectorManager.
  // I suppose no information is provided because data output is already disconnected from the input and it has no
  // information about the source. Let's reset the information then.
  if (!_connected) {
    [self _notifyOfFaces:nil];
    return;
  }
  
  AVCaptureVideoOrientation interfaceVideoOrientation = _previewLayer.connection.videoOrientation;
  CGAffineTransform transform = [EXFaceDetectorUtils transformFromDeviceOutput:dataOutput toInterfaceVideoOrientation:interfaceVideoOrientation];
  
  EXFaceEncoder *faceEncoder = [[EXFaceEncoder alloc] initWithTransform:transform];
  
  NSMutableArray<NSDictionary *> *encodedFaces = [NSMutableArray arrayWithCapacity:[results count]];
  
  [results enumerateObjectsUsingBlock:^(GMVFeature * _Nonnull feature, NSUInteger _idx, BOOL * _Nonnull _stop) {
    if([feature isKindOfClass:[GMVFaceFeature class]]) {
      GMVFaceFeature *face = (GMVFaceFeature *)feature;
      [encodedFaces addObject:[faceEncoder encode:face]];
    }
  }];
  
  [self _notifyOfFaces:encodedFaces];
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
                                 GMVDetectorFaceTrackingEnabled : @(YES),
                                 GMVDetectorFaceMode : @(GMVDetectorFaceFastMode),
                                 GMVDetectorFaceLandmarkType : @(GMVDetectorFaceLandmarkNone),
                                 GMVDetectorFaceClassificationType : @(GMVDetectorFaceClassificationNone),
                                 GMVDetectorFaceMinSize : @(0.15)
                                 };
}

@end
