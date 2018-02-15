/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RNSVGRenderable.h"
#import "RNSVGVBMOS.h"

@interface RNSVGImage : RNSVGRenderable

@property (nonatomic, assign) id src;
@property (nonatomic, strong) NSString* x;
@property (nonatomic, strong) NSString* y;
@property (nonatomic, strong) NSString* width;
@property (nonatomic, strong) NSString* height;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) RNSVGVBMOS meetOrSlice;

@end
