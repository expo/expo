#import <Foundation/Foundation.h>

#import "ABI30_0_0REANode.h"
#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>

@class ABI30_0_0REAModule;

typedef void (^ABI30_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI30_0_0REANativeAnimationOp)(ABI30_0_0RCTUIManager *uiManager);

@interface ABI30_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI30_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI30_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI30_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI30_0_0RCTUIManager *)uiManager;

- (ABI30_0_0REANode* _Nullable)findNodeByID:(nonnull ABI30_0_0REANodeID)nodeID;

- (void)invalidate;

//

- (void)postOnAnimation:(ABI30_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ReactABI30_0_0Tag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps;

// graph

- (void)createNode:(nonnull ABI30_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI30_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI30_0_0REANodeID)parentID
             childID:(nonnull ABI30_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI30_0_0REANodeID)parentID
                childID:(nonnull ABI30_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI30_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI30_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI30_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI30_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

// events

- (void)dispatchEvent:(id<ABI30_0_0RCTEvent>)event;

@end
