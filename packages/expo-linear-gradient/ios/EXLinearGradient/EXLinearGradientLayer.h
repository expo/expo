// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

@interface EXLinearGradientLayer : CALayer

@property (nullable, nonatomic, copy) NSArray<UIColor *> *colors;
@property (nullable, nonatomic, copy) NSArray<NSNumber *> *locations;
@property (nonatomic) CGPoint startPoint;
@property (nonatomic) CGPoint endPoint;

@end
