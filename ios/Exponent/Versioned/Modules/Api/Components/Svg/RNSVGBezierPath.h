/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import <UIKit/UIKit.h>

@interface RNSVGBezierPath : NSObject

- (instancetype)initWithBezierCurves:(NSArray *)bezierCurves;
- (CGAffineTransform)transformAtDistance:(CGFloat)distance;

@end
