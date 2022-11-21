#import <ABI47_0_0RNReanimated/ABI47_0_0REAAnimationsManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0REAUIManager : ABI47_0_0RCTUIManager
@property BOOL ABI47_0_0blockSetter;
- (void)setBridge:(ABI47_0_0RCTBridge *)bridge;
- (void)setUp:(ABI47_0_0REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<ABI47_0_0RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
