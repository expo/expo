/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGUIKit.h"

@interface ABI42_0_0RNSVGPathParser : NSObject

- (instancetype) initWithPathString:(NSString *)d;
- (CGPathRef)getPath;

@end
