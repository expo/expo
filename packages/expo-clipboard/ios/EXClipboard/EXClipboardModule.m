// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXClipboard/EXClipboardModule.h>

#import <UMCore/UMEventEmitterService.h>

static NSString * const onClipboardEventName = @"onClipboardChanged";

@interface EXClipboardModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;

@end

@implementation EXClipboardModule

UM_EXPORT_MODULE(ExpoClipboard);

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(getStringAsync,
                    getStringAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

UM_EXPORT_METHOD_AS(setString,
                    setStringWithContent:(NSString *)content
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

# pragma mark - UMEventEmitter

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
