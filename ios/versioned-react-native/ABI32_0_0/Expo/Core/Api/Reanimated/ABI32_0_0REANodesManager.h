#import <Foundation/Foundation.h>

#import "ABI32_0_0REANode.h"
#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>

@class ABI32_0_0REAModule;

typedef void (^ABI32_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI32_0_0REANativeAnimationOp)(ABI32_0_0RCTUIManager *uiManager);

@interface ABI32_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI32_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI32_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI32_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI32_0_0RCTUIManager *)uiManager;

- (ABI32_0_0REANode* _Nullable)findNodeByID:(nonnull ABI32_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI32_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ReactABI32_0_0Tag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps;
- (void)getValue:(ABI32_0_0REANodeID)nodeID
        callback:(ABI32_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI32_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI32_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI32_0_0REANodeID)parentID
             childID:(nonnull ABI32_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI32_0_0REANodeID)parentID
                childID:(nonnull ABI32_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI32_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI32_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI32_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI32_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

// events

- (void)dispatchEvent:(id<ABI32_0_0RCTEvent>)event;

@end
