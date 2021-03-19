#import <Foundation/Foundation.h>

#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>

@class ABI41_0_0RCTUIManager;
@class ABI41_0_0RCTEventDispatcher;

@interface ABI41_0_0RNGestureHandlerManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull ABI41_0_0RCTUIManager *)uiManager
                          eventDispatcher:(nonnull ABI41_0_0RCTEventDispatcher *)eventDispatcher;

- (void)createGestureHandler:(nonnull NSString *)handlerName
                         tag:(nonnull NSNumber *)handlerTag
                      config:(nonnull NSDictionary *)config;

- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag;

- (void)updateGestureHandler:(nonnull NSNumber *)handlerTag config:(nonnull NSDictionary *)config;

- (void)dropGestureHandler:(nonnull NSNumber *)handlerTag;

- (void)handleSetJSResponder:(nonnull NSNumber *)viewTag
        blockNativeResponder:(nonnull NSNumber *)blockNativeResponder;

- (void)handleClearJSResponder;

@end
