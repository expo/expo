/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import "DevLauncherRNSVGRenderable.h"
#import "DevLauncherRNSVGVBMOS.h"
#import "DevLauncherRNSVGLength.h"

@interface DevLauncherRNSVGImage : DevLauncherRNSVGRenderable

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, assign) id src;
@property (nonatomic, strong) DevLauncherRNSVGLength* x;
@property (nonatomic, strong) DevLauncherRNSVGLength* y;
@property (nonatomic, strong) DevLauncherRNSVGLength* imagewidth;
@property (nonatomic, strong) DevLauncherRNSVGLength* imageheight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) DevLauncherRNSVGVBMOS meetOrSlice;

@end
