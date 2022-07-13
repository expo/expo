#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class DevMenuREANodesManager;

typedef NSObject<NSCopying> *DevMenuREANodeID;

@protocol DevMenuREAFinalNode

- (void)update;

@end

@interface DevMenuREAUpdateContext : NSObject
@property (nonatomic) NSString *callID;
@end

@interface DevMenuREANode : NSObject

+ (void)runPropUpdates:(nonnull DevMenuREAUpdateContext *)context;

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, nullable) DevMenuREANodesManager *nodesManager;
@property (nonatomic, nullable) DevMenuREAUpdateContext *updateContext;
@property (nonatomic, readonly, nonnull) DevMenuREANodeID nodeID;

- (_Nullable id)evaluate;
- (_Nullable id)value;
- (void)markUpdated;

- (void)addChild:(DevMenuREANode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(DevMenuREANode *)child NS_REQUIRES_SUPER;

- (void)dangerouslyRescheduleEvaluate;
- (void)forceUpdateMemoizedValue:(id)value;

- (void)onDrop;

@end
