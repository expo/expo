#import <Foundation/Foundation.h>

#import "ABI38_0_0REANode.h"
#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>

@class ABI38_0_0REAModule;

typedef void (^ABI38_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI38_0_0REANativeAnimationOp)(ABI38_0_0RCTUIManager *uiManager);

@interface ABI38_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI38_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI38_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI38_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI38_0_0RCTUIManager *)uiManager;

- (ABI38_0_0REANode* _Nullable)findNodeByID:(nonnull ABI38_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI38_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI38_0_0ReactTag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps;
- (void)getValue:(ABI38_0_0REANodeID)nodeID
        callback:(ABI38_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI38_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI38_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI38_0_0REANodeID)parentID
             childID:(nonnull ABI38_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI38_0_0REANodeID)parentID
                childID:(nonnull ABI38_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI38_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI38_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI38_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI38_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

// events

- (void)dispatchEvent:(id<ABI38_0_0RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

@end
