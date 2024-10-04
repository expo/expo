/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>
#import <Foundation/Foundation.h>
#import "ABI49_0_0RNSVGLength.h"
#import "ABI49_0_0RNSVGText.h"

@interface ABI49_0_0RNSVGTextPath : ABI49_0_0RNSVGText

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) NSString *side;
@property (nonatomic, strong) NSString *method;
@property (nonatomic, strong) NSString *midLine;
@property (nonatomic, strong) NSString *spacing;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *startOffset;

@end
