#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI29_0_0REANodesManager;

typedef NSNumber* ABI29_0_0REANodeID;

@protocol ABI29_0_0REAFinalNode

- (void)update;

@end

@interface ABI29_0_0REAUpdateContext : NSObject
@end

@interface ABI29_0_0REANode : NSObject

+ (void)runPropUpdates:(nonnull ABI29_0_0REAUpdateContext *)context;

- (instancetype)initWithID:(ABI29_0_0REANodeID)nodeID
                    config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, nullable) ABI29_0_0REANodesManager *nodesManager;
@property (nonatomic, nullable) ABI29_0_0REAUpdateContext *updateContext;
@property (nonatomic, readonly, nonnull) ABI29_0_0REANodeID nodeID;

- (_Nullable id)evaluate;
- (_Nullable id)value;
- (void)markUpdated;

- (void)addChild:(ABI29_0_0REANode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(ABI29_0_0REANode *)child NS_REQUIRES_SUPER;

- (void)dangerouslyRescheduleEvaluate;
- (void)forceUpdateMemoizedValue:(id)value;

@end

NS_ASSUME_NONNULL_END
