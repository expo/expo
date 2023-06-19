#ifndef REAKeyboardEventManager_h
#define REAKeyboardEventManager_h

#import <React/RCTEventDispatcher.h>

typedef void (^KeyboardEventListenerBlock)(int keyboardState, int height);

@interface REAKeyboardEventObserver : NSObject

- (instancetype)init;
- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener;
- (void)unsubscribeFromKeyboardEvents:(int)listenerId;

@end

#endif /* REAKeyboardEventManager_h */
