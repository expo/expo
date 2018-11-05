/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <CoreText/CoreText.h>
#import "RNSVGText.h"

@interface RNSVGTextPath : RNSVGText

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) NSString *side;
@property (nonatomic, strong) NSString *method;
@property (nonatomic, strong) NSString *midLine;
@property (nonatomic, strong) NSString *spacing;
@property (nonatomic, strong) NSString *startOffset;

- (void)getPathLength:(CGFloat*)length lineCount:(NSUInteger*)lineCount lengths:(NSArray* __strong *)lengths lines:(NSArray* __strong *)lines isClosed:(BOOL*)isClosed;


@end
