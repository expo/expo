#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REANode.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>

@class ABI48_0_0REAModule;

typedef void (^ABI48_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI48_0_0REANativeAnimationOp)(ABI48_0_0RCTUIManager *uiManager);
typedef void (^ABI48_0_0REAEventHandler)(NSString *eventName, id<ABI48_0_0RCTEvent> event);

@interface ABI48_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI48_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI48_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI48_0_0REAModule *)reanimatedModule uiManager:(nonnull ABI48_0_0RCTUIManager *)uiManager;

- (ABI48_0_0REANode *_Nullable)findNodeByID:(nonnull ABI48_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI48_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)registerEventHandler:(ABI48_0_0REAEventHandler)eventHandler;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI48_0_0ReactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (void)getValue:(ABI48_0_0REANodeID)nodeID callback:(ABI48_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI48_0_0REANodeID)tag config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI48_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI48_0_0REANodeID)parentID childID:(nonnull ABI48_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI48_0_0REANodeID)parentID childID:(nonnull ABI48_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI48_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI48_0_0REANodeID)nodeID viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI48_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI48_0_0REANodeID)eventNodeID;

// configuration

- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet;

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;

- (NSString *)obtainProp:(nonnull NSNumber *)viewTag propName:(nonnull NSString *)propName;

// events

- (void)dispatchEvent:(id<ABI48_0_0RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

- (void)maybeFlushUpdateBuffer;

@end
