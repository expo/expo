#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class ABI43_0_0REANodesManager;

typedef NSNumber* ABI43_0_0REANodeID;

@protocol ABI43_0_0REAFinalNode

- (void)update;

@end

@interface ABI43_0_0REAUpdateContext : NSObject
@property (nonatomic) NSString* callID;
@end

@interface ABI43_0_0REANode : NSObject

+ (void)runPropUpdates:(nonnull ABI43_0_0REAUpdateContext *)context;

- (instancetype)initWithID:(ABI43_0_0REANodeID)nodeID
                    config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, nullable) ABI43_0_0REANodesManager *nodesManager;
@property (nonatomic, nullable) ABI43_0_0REAUpdateContext *updateContext;
@property (nonatomic, readonly, nonnull) ABI43_0_0REANodeID nodeID;

- (_Nullable id)evaluate;
- (_Nullable id)value;
- (void)markUpdated;

- (void)addChild:(ABI43_0_0REANode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(ABI43_0_0REANode *)child NS_REQUIRES_SUPER;

- (void)dangerouslyRescheduleEvaluate;
- (void)forceUpdateMemoizedValue:(id)value;

- (void)onDrop;

@end
