#import <React/RCTBridgeModule.h>
#import <React/RCTUIManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfacePresenterStub.h>
#endif

#import <RNReanimated/READisplayLink.h>

@class REAModule;

typedef void (^REAOnAnimationCallback)(READisplayLink *displayLink);
typedef void (^REANativeAnimationOp)(RCTUIManager *uiManager);
typedef void (^REAEventHandler)(id<RCTEvent> event);
typedef void (^CADisplayLinkOperation)(READisplayLink *displayLink);

#ifdef RCT_NEW_ARCH_ENABLED
typedef void (^REAPerformOperations)();
#endif

@interface REANodesManager : NSObject

@property (nonatomic, weak, nullable) RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

#ifdef RCT_NEW_ARCH_ENABLED
- (nonnull instancetype)initWithModule:(REAModule *)reanimatedModule
                                bridge:(RCTBridge *)bridge
                      surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;
#else
- (instancetype)initWithModule:(REAModule *)reanimatedModule uiManager:(RCTUIManager *)uiManager;
#endif
- (void)invalidate;
- (void)operationsBatchDidComplete;

- (void)postOnAnimation:(REAOnAnimationCallback)clb;
- (void)registerEventHandler:(REAEventHandler)eventHandler;
- (void)dispatchEvent:(id<RCTEvent>)event;

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;
- (void)registerPerformOperations:(REAPerformOperations)performOperations;
- (void)synchronouslyUpdateViewOnUIThread:(nonnull NSNumber *)viewTag props:(nonnull NSDictionary *)uiProps;
#else
- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet;
- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;
- (void)maybeFlushUpdateBuffer;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (NSString *)obtainProp:(nonnull NSNumber *)viewTag propName:(nonnull NSString *)propName;
#endif
- (void)maybeFlushUIUpdatesQueue;

@end
