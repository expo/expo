/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "RCTConvert+DevLauncherRNSVG.h"
#import <React/RCTConvert.h>
#import "DevLauncherRNSVGCGFCRule.h"
#import "DevLauncherRNSVGVBMOS.h"
#import "DevLauncherRNSVGUnits.h"
#import "DevLauncherRNSVGLength.h"
#import "DevLauncherRNSVGPathParser.h"

@class DevLauncherRNSVGBrush;

@interface RCTConvert (DevLauncherRNSVG)

+ (DevLauncherRNSVGLength*)DevLauncherRNSVGLength:(id)json;
+ (NSArray<DevLauncherRNSVGLength *>*)DevLauncherRNSVGLengthArray:(id)json;
+ (DevLauncherRNSVGCGFCRule)DevLauncherRNSVGCGFCRule:(id)json;
+ (DevLauncherRNSVGVBMOS)DevLauncherRNSVGVBMOS:(id)json;
+ (DevLauncherRNSVGUnits)DevLauncherRNSVGUnits:(id)json;
+ (DevLauncherRNSVGBrush *)DevLauncherRNSVGBrush:(id)json;
+ (DevLauncherRNSVGPathParser *)DevLauncherRNSVGCGPath:(NSString *)d;
+ (CGRect)DevLauncherRNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)DevLauncherRNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)DevLauncherRNSVGCGGradient:(id)json;

@end
