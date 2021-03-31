// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXScreenCapture/ABI41_0_0EXScreenCaptureModule.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>

static NSString * const onScreenshotEventName = @"onScreenshot";

@interface ABI41_0_0EXScreenCaptureModule ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<ABI41_0_0UMEventEmitterService> eventEmitter;

@end

@implementation ABI41_0_0EXScreenCaptureModule {
  UIView *_blockView;
}

ABI41_0_0UM_EXPORT_MODULE(ExpoScreenCapture);

# pragma mark - ABI41_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMEventEmitterService)];
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

ABI41_0_0UM_EXPORT_METHOD_AS(preventScreenCapture,
                    preventScreenCaptureWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI41_0_0UMPromiseRejectBlock)reject)
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

ABI41_0_0UM_EXPORT_METHOD_AS(allowScreenCapture,
                    allowScreenCaptureWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
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

# pragma mark - ABI41_0_0UMEventEmitter

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
