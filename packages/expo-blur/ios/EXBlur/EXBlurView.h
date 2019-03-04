// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@interface EXBlurView : UIView

@property (nonatomic, copy) NSString *tint;
@property (nonatomic, copy) NSNumber *intensity;
@property (nonatomic, strong) UIBlurEffect *blurEffect;
@property (nonatomic, strong) UIVisualEffectView *visualEffectView;

- (void)didSetProps:(NSArray<NSString *> *)changedProps;

@end
