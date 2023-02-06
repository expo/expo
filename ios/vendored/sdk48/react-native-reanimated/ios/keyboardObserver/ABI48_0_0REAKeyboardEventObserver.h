#ifndef ABI48_0_0REAKeyboardEventManager_h
#define ABI48_0_0REAKeyboardEventManager_h

#import <ABI48_0_0RNReanimated/ABI48_0_0REAEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>

typedef void (^KeyboardEventListenerBlock)(int keyboardState, int height);

@interface ABI48_0_0REAKeyboardEventObserver : NSObject

- (instancetype)init;
- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener;
- (void)unsubscribeFromKeyboardEvents:(int)listenerId;

@end

#endif /* ABI48_0_0REAKeyboardEventManager_h */
