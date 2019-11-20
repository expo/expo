// Software License Agreement (BSD License)
//
// Copyright (c) 2010-2019, Deusty, LLC
// All rights reserved.
//
// Redistribution and use of this software in source and binary forms,
// with or without modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
//
// * Neither the name of Deusty nor the names of its contributors may be used
//   to endorse or promote products derived from this software without specific
//   prior written permission of Deusty, LLC.

#if TARGET_OS_OSX

#import "CLIColor.h"

@interface CLIColor () {
    CGFloat _red, _green, _blue, _alpha;
}

@end


@implementation CLIColor

+ (CLIColor *)colorWithCalibratedRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha {
    CLIColor *color = [CLIColor new];

    color->_red     = red;
    color->_green   = green;
    color->_blue    = blue;
    color->_alpha   = alpha;
    return color;
}

- (void)getRed:(CGFloat *)red green:(CGFloat *)green blue:(CGFloat *)blue alpha:(CGFloat *)alpha {
    if (red) {
        *red    = _red;
    }

    if (green) {
        *green  = _green;
    }

    if (blue) {
        *blue   = _blue;
    }

    if (alpha) {
        *alpha  = _alpha;
    }
}

@end

#endif
