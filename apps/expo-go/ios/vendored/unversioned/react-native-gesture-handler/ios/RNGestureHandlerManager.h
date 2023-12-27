#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

#import "RNGestureHandler.h"

@class RCTUIManager;
@class RCTEventDispatcher;

@interface RNGestureHandlerManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull RCTUIManager *)uiManager
                          eventDispatcher:(nonnull RCTEventDispatcher *)eventDispatcher;

- (void)createGestureHandler:(nonnull NSString *)handlerName
                         tag:(nonnull NSNumber *)handlerTag
                      config:(nonnull NSDictionary *)config;

- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
              withActionType:(RNGestureHandlerActionType)actionType;

- (void)updateGestureHandler:(nonnull NSNumber *)handlerTag config:(nonnull NSDictionary *)config;

- (void)dropGestureHandler:(nonnull NSNumber *)handlerTag;

- (void)dropAllGestureHandlers;

- (void)handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder;

- (void)handleClearJSResponder;

- (nullable RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;

@end
