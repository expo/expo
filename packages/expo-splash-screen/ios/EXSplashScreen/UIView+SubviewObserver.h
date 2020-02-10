// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol UIViewSubviewObserver <NSObject>

- (void)didAddSubview:(UIView *)subview;
- (void)willRemoveSubview:(UIView *)subview;

@end

@interface UIView (SubviewObserver)

@property (strong, nonatomic) id<UIViewSubviewObserver> subviewObserver;

@end

NS_ASSUME_NONNULL_END
