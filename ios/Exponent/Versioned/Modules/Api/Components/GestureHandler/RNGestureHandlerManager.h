#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTUIManager.h>

@interface RNGestureHandlerManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull RCTUIManager *)uiManager
                          eventDispatcher:(nonnull RCTEventDispatcher *)eventDispatcher;

- (void)createGestureHandler:(nonnull NSNumber *)viewTag
                    withName:(nonnull NSString *)handlerName
                         tag:(nonnull NSNumber *)handlerTag
                      config:(nonnull NSDictionary *)config;

- (void)updateGestureHandler:(nonnull NSNumber *)viewTag
                         tag:(nonnull NSNumber *)handlerTag
                      config:(nonnull NSDictionary *)config;

- (void)dropGestureHandlersForView:(nonnull NSNumber *)viewTag;

- (void)handleSetJSResponder:(nonnull NSNumber *)viewTag
        blockNativeResponder:(nonnull NSNumber *)blockNativeResponder;

- (void)handleClearJSResponder;

@end
