// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "ABI12_0_0RCTView.h"

@interface ABI12_0_0EXBlurView : ABI12_0_0RCTView

@property (nonatomic, copy) NSString *tint;
@property (nonatomic, copy) NSNumber *intensity;
@property (nonatomic, strong) UIBlurEffect *blurEffect;
@property (nonatomic, strong) UIVisualEffectView *visualEffectView;

@end
