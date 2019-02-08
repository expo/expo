//
// Created by Oleksii Pavlovskyi on 2/2/17.
// Copyright (c) 2017 Airbnb. All rights reserved.
//

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import <Foundation/Foundation.h>

@interface NSValue (Compat)

+ (NSValue *)valueWithCGRect:(CGRect)rect;
+ (NSValue *)valueWithCGPoint:(CGPoint)point;

@property (nonatomic, readonly) CGRect CGRectValue;
@property(nonatomic, readonly) CGPoint CGPointValue;
@property (nonatomic, readonly) CGSize CGSizeValue;

@end

#endif
