/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AIRWeakTimerReference.h"

@implementation AIRWeakTimerReference
{
    __weak NSObject *_target;
    SEL _selector;
}


- (instancetype)initWithTarget:(id)target andSelector:(SEL)selector {
        self = [super init];
        if (self) {
            _target = target;
            _selector = selector;
        }
        return self;
}


- (void)timerDidFire:(NSTimer *)timer
{
    if(_target)
    {
        [_target performSelector:_selector withObject:timer];
    }
    else
    {
        [timer invalidate];
    }
}


@end
