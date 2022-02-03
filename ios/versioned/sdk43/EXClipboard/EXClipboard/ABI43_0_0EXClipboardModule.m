// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXClipboard/ABI43_0_0EXClipboardModule.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>

static NSString * const onClipboardEventName = @"onClipboardChanged";

@interface ABI43_0_0EXClipboardModule ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<ABI43_0_0EXEventEmitterService> eventEmitter;

@end

@implementation ABI43_0_0EXClipboardModule

ABI43_0_0EX_EXPORT_MODULE(ExpoClipboard);

# pragma mark - ABI43_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)];
}

# pragma mark - Exported methods

ABI43_0_0EX_EXPORT_METHOD_AS(getStringAsync,
                    getStringAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

ABI43_0_0EX_EXPORT_METHOD_AS(setString,
                    setStringWithContent:(NSString *)content
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

# pragma mark - ABI43_0_0EXEventEmitter

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
