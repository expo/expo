/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGPath.h"

@implementation ABI28_0_0RNSVGPath
{
    CGPathRef _path;
}

- (void)setD:(ABI28_0_0RNSVGPathParser *)d
{
    if (d == _d) {
        return;
    }

    [self invalidate];
    _d = d;
    CGPathRelease(_path);
    _path = CGPathRetain([d getPath]);
}

- (CGPathRef)getPath:(CGContextRef)context
{
    return _path;
}

- (void)dealloc
{
    CGPathRelease(_path);
}

@end
