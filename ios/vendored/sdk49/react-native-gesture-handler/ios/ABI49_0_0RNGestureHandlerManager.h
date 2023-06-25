#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

#import "ABI49_0_0RNGestureHandler.h"

@class ABI49_0_0RCTUIManager;
@class ABI49_0_0RCTEventDispatcher;

@interface ABI49_0_0RNGestureHandlerManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull ABI49_0_0RCTUIManager *)uiManager
                          eventDispatcher:(nonnull ABI49_0_0RCTEventDispatcher *)eventDispatcher;

- (void)createGestureHandler:(nonnull NSString *)handlerName
                         tag:(nonnull NSNumber *)handlerTag
                      config:(nonnull NSDictionary *)config;

- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
              withActionType:(ABI49_0_0RNGestureHandlerActionType)actionType;

- (void)updateGestureHandler:(nonnull NSNumber *)handlerTag config:(nonnull NSDictionary *)config;

- (void)dropGestureHandler:(nonnull NSNumber *)handlerTag;

- (void)dropAllGestureHandlers;

- (void)handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder;

- (void)handleClearJSResponder;

- (nullable ABI49_0_0RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;

@end
