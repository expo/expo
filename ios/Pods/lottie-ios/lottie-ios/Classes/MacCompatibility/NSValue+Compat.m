//
// Created by Oleksii Pavlovskyi on 2/2/17.
// Copyright (c) 2017 Airbnb. All rights reserved.
//

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import "NSValue+Compat.h"

@implementation NSValue (Compat)

+ (NSValue *)valueWithCGRect:(CGRect)rect {
    return [self valueWithRect:rect];
}

+ (NSValue *)valueWithCGPoint:(CGPoint)point {
    return [self valueWithPoint:point];
}

- (CGRect)CGRectValue {
    return self.rectValue;
}

- (CGPoint)CGPointValue {
    return self.pointValue;
}

- (CGSize)CGSizeValue {
  return self.sizeValue;
}

@end

#endif
