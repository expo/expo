#import <Foundation/Foundation.h>
#import <RNReanimated/REANode.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUIManager.h>

@class REAModule;

typedef void (^REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^REANativeAnimationOp)(RCTUIManager *uiManager);
typedef void (^REAEventHandler)(NSString *eventName, id<RCTEvent> event);

@interface REANodesManager : NSObject

@property (nonatomic, weak, nullable) RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(REAModule *)reanimatedModule uiManager:(nonnull RCTUIManager *)uiManager;

- (REANode *_Nullable)findNodeByID:(nonnull REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)registerEventHandler:(REAEventHandler)eventHandler;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (void)getValue:(REANodeID)nodeID callback:(RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull REANodeID)tag config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull REANodeID)tag;

- (void)connectNodes:(nonnull REANodeID)parentID childID:(nonnull REANodeID)childID;

- (void)disconnectNodes:(nonnull REANodeID)parentID childID:(nonnull REANodeID)childID;

- (void)connectNodeToView:(nonnull REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull REANodeID)nodeID viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull REANodeID)eventNodeID;

// configuration

- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet;

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;

- (NSString *)obtainProp:(nonnull NSNumber *)viewTag propName:(nonnull NSString *)propName;

// events

- (void)dispatchEvent:(id<RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

- (void)maybeFlushUpdateBuffer;

@end
