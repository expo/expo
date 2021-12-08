#import <ABI44_0_0React/ABI44_0_0RCTBridge+Private.h>
#import <ABI44_0_0React/ABI44_0_0RCTDefines.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import "ABI44_0_0REAAnimationsManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0REAUIManager : ABI44_0_0RCTUIManager
@property BOOL ABI44_0_0blockSetter;
- (void)setBridge:(ABI44_0_0RCTBridge *)bridge;
- (void)setUp:(ABI44_0_0REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<ABI44_0_0RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
