// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXClipboard/EXClipboardModule.h>

#import <ExpoModulesCore/EXEventEmitterService.h>

static NSString * const onClipboardEventName = @"onClipboardChanged";

@interface EXClipboardModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@end

@implementation EXClipboardModule

EX_EXPORT_MODULE(ExpoClipboard);

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

# pragma mark - Exported methods

EX_EXPORT_METHOD_AS(getStringAsync,
                    getStringAsyncWithResolver:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

EX_EXPORT_METHOD_AS(setString,
                    setStringWithContent:(NSString *)content
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

# pragma mark - EXEventEmitter

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
