//
//  LOTAnimationView
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//
#import <QuartzCore/QuartzCore.h>
#import <Foundation/Foundation.h>

@interface LOTRadialGradientLayer : CALayer

@property CGPoint startPoint;
@property CGPoint endPoint;

@property (nonatomic, copy) NSArray *colors;
@property (nonatomic, copy) NSArray<NSNumber *> *locations;
@property (nonatomic, assign) BOOL isRadial;

@end
