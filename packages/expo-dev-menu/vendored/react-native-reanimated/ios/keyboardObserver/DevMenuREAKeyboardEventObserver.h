#ifndef DevMenuREAKeyboardEventManager_h
#define DevMenuREAKeyboardEventManager_h

#import "DevMenuREAEventDispatcher.h"
#import <React/RCTEventDispatcher.h>

typedef void (^KeyboardEventListenerBlock)(int keyboardState, int height);

@interface DevMenuREAKeyboardEventObserver : NSObject

- (instancetype)init;
- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener;
- (void)unsubscribeFromKeyboardEvents:(int)listenerId;

@end

#endif /* DevMenuREAKeyboardEventManager_h */
