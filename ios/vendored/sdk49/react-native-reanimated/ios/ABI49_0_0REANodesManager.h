#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>
#endif

@class ABI49_0_0REAModule;

typedef void (^ABI49_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI49_0_0REANativeAnimationOp)(ABI49_0_0RCTUIManager *uiManager);
typedef void (^ABI49_0_0REAEventHandler)(NSString *eventName, id<ABI49_0_0RCTEvent> event);

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
typedef void (^ABI49_0_0REAPerformOperations)();
#endif

@interface ABI49_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI49_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI49_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (nonnull instancetype)initWithModule:(ABI49_0_0REAModule *)reanimatedModule
                                bridge:(ABI49_0_0RCTBridge *)bridge
                      surfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter;
#else
- (instancetype)initWithModule:(ABI49_0_0REAModule *)reanimatedModule uiManager:(ABI49_0_0RCTUIManager *)uiManager;
#endif
- (void)invalidate;
- (void)operationsBatchDidComplete;

- (void)postOnAnimation:(ABI49_0_0REAOnAnimationCallback)clb;
- (void)registerEventHandler:(ABI49_0_0REAEventHandler)eventHandler;
- (void)dispatchEvent:(id<ABI49_0_0RCTEvent>)event;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (void)setSurfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter;
- (void)registerPerformOperations:(ABI49_0_0REAPerformOperations)performOperations;
- (void)synchronouslyUpdateViewOnUIThread:(nonnull NSNumber *)viewTag props:(nonnull NSDictionary *)uiProps;
#else
- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet;
- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;
- (void)maybeFlushUpdateBuffer;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI49_0_0ReactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (NSString *)obtainProp:(nonnull NSNumber *)viewTag propName:(nonnull NSString *)propName;
#endif
- (void)maybeFlushUIUpdatesQueue;

@end
