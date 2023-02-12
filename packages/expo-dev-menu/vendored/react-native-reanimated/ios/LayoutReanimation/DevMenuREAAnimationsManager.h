#import <Foundation/Foundation.h>
#import "DevMenuREASnapshot.h"
#import <React/RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ViewState) {
  Inactive,
  Appearing,
  Disappearing,
  Layout,
  ToRemove,
};

@interface DevMenuREAAnimationsManager : NSObject

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager;
- (void)setRemovingConfigBlock:(void (^)(NSNumber *tag))block;
- (void)setAnimationStartingBlock:
    (void (^)(NSNumber *tag, NSString *type, NSDictionary *target, NSNumber *depth))startAnimation;
- (void)notifyAboutProgress:(NSDictionary *)newStyle tag:(NSNumber *)tag;
- (void)notifyAboutEnd:(NSNumber *)tag cancelled:(BOOL)cancelled;
- (void)invalidate;
- (void)onViewRemoval:(UIView *)view before:(DevMenuREASnapshot *)before;
- (void)onViewCreate:(UIView *)view after:(DevMenuREASnapshot *)after;
- (void)onViewUpdate:(UIView *)view before:(DevMenuREASnapshot *)before after:(DevMenuREASnapshot *)after;
- (void)setToBeRemovedRegistry:(NSMutableDictionary<NSNumber *, NSMutableSet<id<RCTComponent>> *> *)toBeRemovedRegister;
- (void)removeLeftovers;

@end

NS_ASSUME_NONNULL_END
