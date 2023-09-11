#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REASnapshot.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ViewState) {
  Inactive,
  Appearing,
  Disappearing,
  Layout,
  ToRemove,
};

@interface ABI48_0_0REAAnimationsManager : NSObject

- (instancetype)initWithUIManager:(ABI48_0_0RCTUIManager *)uiManager;
- (void)setRemovingConfigBlock:(void (^)(NSNumber *tag))block;
- (void)setAnimationStartingBlock:
    (void (^)(NSNumber *tag, NSString *type, NSDictionary *target, NSNumber *depth))startAnimation;
- (void)notifyAboutProgress:(NSDictionary *)newStyle tag:(NSNumber *)tag;
- (void)notifyAboutEnd:(NSNumber *)tag cancelled:(BOOL)cancelled;
- (void)invalidate;
- (void)onViewRemoval:(UIView *)view before:(ABI48_0_0REASnapshot *)before;
- (void)onViewCreate:(UIView *)view after:(ABI48_0_0REASnapshot *)after;
- (void)onViewUpdate:(UIView *)view before:(ABI48_0_0REASnapshot *)before after:(ABI48_0_0REASnapshot *)after;
- (void)setToBeRemovedRegistry:(NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI48_0_0RCTComponent>> *> *)toBeRemovedRegister;
- (void)removeLeftovers;

@end

NS_ASSUME_NONNULL_END
