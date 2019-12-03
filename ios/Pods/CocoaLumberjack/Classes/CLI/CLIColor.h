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

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

/**
 * This class represents an NSColor replacement for CLI projects that don't link with AppKit
 **/
@interface CLIColor : NSObject

/**
 *  Convenience method for creating a `CLIColor` instance from RGBA params
 *
 *  @param red   red channel, between 0 and 1
 *  @param green green channel, between 0 and 1
 *  @param blue  blue channel, between 0 and 1
 *  @param alpha alpha channel, between 0 and 1
 */
+ (CLIColor *)colorWithCalibratedRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha;

/**
 *  Get the RGBA components from a `CLIColor`
 *
 *  @param red   red channel, between 0 and 1
 *  @param green green channel, between 0 and 1
 *  @param blue  blue channel, between 0 and 1
 *  @param alpha alpha channel, between 0 and 1
 */
- (void)getRed:(CGFloat *)red green:(CGFloat *)green blue:(CGFloat *)blue alpha:(CGFloat *)alpha NS_SWIFT_NAME(get(red:green:blue:alpha:));

@end

#endif
