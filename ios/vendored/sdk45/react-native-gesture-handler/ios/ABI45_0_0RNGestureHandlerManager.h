#import <Foundation/Foundation.h>

#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>

#import "ABI45_0_0RNGestureHandler.h"

@class ABI45_0_0RCTUIManager;
@class ABI45_0_0RCTEventDispatcher;

@interface ABI45_0_0RNGestureHandlerManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull ABI45_0_0RCTUIManager *)uiManager
                          eventDispatcher:(nonnull ABI45_0_0RCTEventDispatcher *)eventDispatcher;

- (void)createGestureHandler:(nonnull NSString *)handlerName
                         tag:(nonnull NSNumber *)handlerTag
                      config:(nonnull NSDictionary *)config;

- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag;

- (void)attachGestureHandlerForDeviceEvents:(nonnull NSNumber *)handlerTag
                              toViewWithTag:(nonnull NSNumber *)viewTag;

- (void)updateGestureHandler:(nonnull NSNumber *)handlerTag config:(nonnull NSDictionary *)config;

- (void)dropGestureHandler:(nonnull NSNumber *)handlerTag;

- (void)handleSetJSResponder:(nonnull NSNumber *)viewTag
        blockNativeResponder:(nonnull NSNumber *)blockNativeResponder;

- (void)handleClearJSResponder;

- (nullable ABI45_0_0RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;

@end
