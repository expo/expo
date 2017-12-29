/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "RNSVGContainer.h"
#import "RNSVGCGFCRule.h"
#import "RNSVGSvgView.h"
#import "RNSVGPath.h"

@interface RNSVGGroup : RNSVGPath <RNSVGContainer>

- (void)renderPathTo:(CGContextRef)context;
- (void)renderGroupTo:(CGContextRef)context;

@end
