#import "DevMenuREAAnimationsManager.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTDefines.h>
#import <React/RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface DevMenuREAUIManager : RCTUIManager
@property BOOL blockSetter;
- (void)setBridge:(RCTBridge *)bridge;
- (void)setUp:(DevMenuREAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();

@end

NS_ASSUME_NONNULL_END
