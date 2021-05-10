// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXScreenCapture/EXScreenCaptureModule.h>

#import <UMCore/UMEventEmitterService.h>

static NSString * const onScreenshotEventName = @"onScreenshot";

@interface EXScreenCaptureModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;

@end

@implementation EXScreenCaptureModule {
  UIView *_blockView;
}

UM_EXPORT_MODULE(ExpoScreenCapture);

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
}

- (instancetype)init {
  if (self = [super init]) {
    CGFloat boundLength = MAX([[UIScreen mainScreen] bounds].size.width, [[UIScreen mainScreen] bounds].size.height);
    _blockView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, boundLength, boundLength)];
    _blockView.backgroundColor = UIColor.blackColor;
  }
  return self;
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(preventScreenCapture,
                    preventScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *) ) {
    // If already recording, block it
    dispatch_async(dispatch_get_main_queue(), ^{
      [self preventScreenRecording];
    });

    // Avoid setting duplicate observers
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];
          
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(preventScreenRecording) name:UIScreenCapturedDidChangeNotification object:nil];
  }
  
  resolve([NSNull null]);
}

UM_EXPORT_METHOD_AS(allowScreenCapture,
                    allowScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *)) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];
  }

  resolve([NSNull null]);
}

- (void)preventScreenRecording {
  if (@available(iOS 11.0, *)) {
    BOOL isCaptured = [[UIScreen mainScreen] isCaptured];

    if (isCaptured) {
      [UIApplication.sharedApplication.keyWindow.subviews.firstObject addSubview:_blockView];
    } else {
      [_blockView removeFromSuperview];
    }
  }
}

# pragma mark - UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[onScreenshotEventName];
}

- (void)startObserving
{
  [self setIsBeingObserved:YES];
}

- (void)stopObserving
{
  [self setIsBeingObserved:NO];
}

- (void)setIsBeingObserved:(BOOL)isBeingObserved
{
  _isBeingObserved = isBeingObserved;
  BOOL shouldListen = _isBeingObserved;
  if (shouldListen && !_isListening) {
    // Avoid setting duplicate observers
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationUserDidTakeScreenshotNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(listenForScreenCapture) name:UIApplicationUserDidTakeScreenshotNotification object:nil];
    _isListening = YES;
  } else if (!shouldListen && _isListening) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationUserDidTakeScreenshotNotification object:nil];
    _isListening = NO;
  }
}

- (void)listenForScreenCapture
{
  [_eventEmitter sendEventWithName:onScreenshotEventName body:nil];
}

@end
