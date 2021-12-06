// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXClipboard/ABI44_0_0EXClipboardModule.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitterService.h>

static NSString * const onClipboardEventName = @"onClipboardChanged";

@interface ABI44_0_0EXClipboardModule ()

@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<ABI44_0_0EXEventEmitterService> eventEmitter;

@end

@implementation ABI44_0_0EXClipboardModule

ABI44_0_0EX_EXPORT_MODULE(ExpoClipboard);

# pragma mark - ABI44_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXEventEmitterService)];
}

# pragma mark - Exported methods

ABI44_0_0EX_EXPORT_METHOD_AS(getStringAsync,
                    getStringAsyncWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

ABI44_0_0EX_EXPORT_METHOD_AS(setString,
                    setStringWithContent:(NSString *)content
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

# pragma mark - ABI44_0_0EXEventEmitter

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
