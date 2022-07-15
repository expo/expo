// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXScreenCapture/ABI46_0_0EXScreenCaptureModule.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitterService.h>

static NSString * const onScreenshotEventName = @"onScreenshot";

@interface ABI46_0_0EXScreenCaptureModule ()

@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<ABI46_0_0EXEventEmitterService> eventEmitter;

@end

@implementation ABI46_0_0EXScreenCaptureModule {
  UIView *_blockView;
}

ABI46_0_0EX_EXPORT_MODULE(ExpoScreenCapture);

# pragma mark - ABI46_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXEventEmitterService)];
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

ABI46_0_0EX_EXPORT_METHOD_AS(preventScreenCapture,
                    preventScreenCaptureWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  // If already recording, block it
  dispatch_async(dispatch_get_main_queue(), ^{
    [self preventScreenRecording];
  });

  // Avoid setting duplicate observers
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];
          
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(preventScreenRecording) name:UIScreenCapturedDidChangeNotification object:nil];
  
  resolve([NSNull null]);
}

ABI46_0_0EX_EXPORT_METHOD_AS(allowScreenCapture,
                    allowScreenCaptureWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];

  resolve([NSNull null]);
}

- (void)preventScreenRecording {
  BOOL isCaptured = [[UIScreen mainScreen] isCaptured];

  if (isCaptured) {
    [UIApplication.sharedApplication.keyWindow.subviews.firstObject addSubview:_blockView];
  } else {
    [_blockView removeFromSuperview];
  }
}

# pragma mark - ABI46_0_0EXEventEmitter

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
