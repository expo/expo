#ifndef ABI49_0_0REAKeyboardEventManager_h
#define ABI49_0_0REAKeyboardEventManager_h

#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>

typedef void (^KeyboardEventListenerBlock)(int keyboardState, int height);

@interface ABI49_0_0REAKeyboardEventObserver : NSObject

- (instancetype)init;
- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener;
- (void)unsubscribeFromKeyboardEvents:(int)listenerId;

@end

#endif /* ABI49_0_0REAKeyboardEventManager_h */
