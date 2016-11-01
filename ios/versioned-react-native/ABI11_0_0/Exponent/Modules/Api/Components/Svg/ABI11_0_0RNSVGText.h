/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI11_0_0RNSVGPath.h"
#import "ABI11_0_0RNSVGTextFrame.h"

@interface ABI11_0_0RNSVGText : ABI11_0_0RNSVGPath

@property (nonatomic, assign) CTTextAlignment alignment;
@property (nonatomic, assign) ABI11_0_0RNSVGTextFrame textFrame;
@property (nonatomic, copy) NSArray<NSArray *> *path;

@end
