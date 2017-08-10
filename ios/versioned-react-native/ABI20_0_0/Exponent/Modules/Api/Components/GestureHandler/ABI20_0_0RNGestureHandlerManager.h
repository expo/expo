#import <Foundation/Foundation.h>

#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>

@interface ABI20_0_0RNGestureHandlerManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull ABI20_0_0RCTUIManager *)uiManager
                          eventDispatcher:(nonnull ABI20_0_0RCTEventDispatcher *)eventDispatcher;

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
