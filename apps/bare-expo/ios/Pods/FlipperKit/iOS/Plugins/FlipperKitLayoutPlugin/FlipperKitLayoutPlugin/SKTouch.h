/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "SKDescriptorMapper.h"

typedef void (^SKTouchFinishDelegate)(id<NSObject> currentNode);
typedef void (^SKProcessFinishDelegate)(NSDictionary* tree);

@interface SKTouch : NSObject

- (instancetype)initWithTouchPoint:(CGPoint)touchPoint
                      withRootNode:(id<NSObject>)node
              withDescriptorMapper:(SKDescriptorMapper*)mapper
                   finishWithBlock:(SKTouchFinishDelegate)d;

- (void)continueWithChildIndex:(NSUInteger)childIndex
                    withOffset:(CGPoint)offset;

- (void)finish;

- (void)retrieveSelectTree:(SKProcessFinishDelegate)callback;

- (BOOL)containedIn:(CGRect)bounds;

@end
