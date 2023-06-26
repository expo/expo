#import <ABI49_0_0RNReanimated/ABI49_0_0REAAnimationsManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0REAUIManager : ABI49_0_0RCTUIManager
@property BOOL ABI49_0_0blockSetter;
- (void)setBridge:(ABI49_0_0RCTBridge *)bridge;
- (void)setUp:(ABI49_0_0REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<ABI49_0_0RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
