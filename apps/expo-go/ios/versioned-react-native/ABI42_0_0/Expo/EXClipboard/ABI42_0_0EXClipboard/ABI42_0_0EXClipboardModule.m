// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXClipboard/ABI42_0_0EXClipboardModule.h>

#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitterService.h>

static NSString * const onClipboardEventName = @"onClipboardChanged";

@interface ABI42_0_0EXClipboardModule ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<ABI42_0_0UMEventEmitterService> eventEmitter;

@end

@implementation ABI42_0_0EXClipboardModule

ABI42_0_0UM_EXPORT_MODULE(ExpoClipboard);

# pragma mark - ABI42_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMEventEmitterService)];
}

# pragma mark - Exported methods

ABI42_0_0UM_EXPORT_METHOD_AS(getStringAsync,
                    getStringAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

ABI42_0_0UM_EXPORT_METHOD_AS(setString,
                    setStringWithContent:(NSString *)content
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

# pragma mark - ABI42_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[onClipboardEventName];
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
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIPasteboardChangedNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(listenToClipboard) name:UIPasteboardChangedNotification object:nil];
    _isListening = YES;
  } else if (!shouldListen && _isListening) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIPasteboardChangedNotification object:nil];
    _isListening = NO;
  }
}

- (void)listenToClipboard
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  [_eventEmitter sendEventWithName:onClipboardEventName body:@{ @"content" : clipboard.string ?: @"" }];
}

@end
