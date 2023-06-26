/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGUIKit.h"

#import "ABI49_0_0RNSVGVBMOS.h"

@interface ABI49_0_0RNSVGViewBox : NSObject

+ (CGAffineTransform)getTransform:(CGRect)vbRect
                            eRect:(CGRect)eRect
                            align:(NSString *)align
                      meetOrSlice:(ABI49_0_0RNSVGVBMOS)meetOrSlice;

@end
