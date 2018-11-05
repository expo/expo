#import <Foundation/Foundation.h>

#import "ABI28_0_0REANode.h"
#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI28_0_0REAModule;

typedef void (^ABI28_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);

@interface ABI28_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI28_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI28_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI28_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI28_0_0RCTUIManager *)uiManager;

- (ABI28_0_0REANode* _Nullable)findNodeByID:(nonnull ABI28_0_0REANodeID)nodeID;

- (void)invalidate;

//

- (void)postOnAnimation:(ABI28_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;

// graph

- (void)createNode:(nonnull ABI28_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI28_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI28_0_0REANodeID)parentID
             childID:(nonnull ABI28_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI28_0_0REANodeID)parentID
                childID:(nonnull ABI28_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI28_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI28_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI28_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI28_0_0REANodeID)eventNodeID;

// configuration

- (void)configureNativeProps:(nonnull NSSet<NSString *> *)nativeProps;

// events

- (void)dispatchEvent:(id<ABI28_0_0RCTEvent>)event;

@end

NS_ASSUME_NONNULL_END
