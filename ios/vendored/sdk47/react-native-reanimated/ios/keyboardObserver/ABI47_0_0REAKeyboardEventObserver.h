#ifndef ABI47_0_0REAKeyboardEventManager_h
#define ABI47_0_0REAKeyboardEventManager_h

#import <ABI47_0_0RNReanimated/ABI47_0_0REAEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>

typedef void (^KeyboardEventListenerBlock)(int keyboardState, int height);

@interface ABI47_0_0REAKeyboardEventObserver : NSObject

- (instancetype)init;
- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener;
- (void)unsubscribeFromKeyboardEvents:(int)listenerId;

@end

#endif /* ABI47_0_0REAKeyboardEventManager_h */
