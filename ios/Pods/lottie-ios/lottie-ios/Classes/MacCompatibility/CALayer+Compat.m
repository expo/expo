//
// Created by Oleksii Pavlovskyi on 2/2/17.
// Copyright (c) 2017 Airbnb. All rights reserved.
//

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import "CALayer+Compat.h"

@implementation CALayer (Compat)

- (BOOL)allowsEdgeAntialiasing { return NO; }
- (void)setAllowsEdgeAntialiasing:(BOOL)allowsEdgeAntialiasing { }

@end

#endif
