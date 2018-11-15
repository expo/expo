//
// Created by Oleksii Pavlovskyi on 2/2/17.
// Copyright (c) 2017 Airbnb. All rights reserved.
//

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@interface CALayer (Compat)

@property (nonatomic, assign) BOOL allowsEdgeAntialiasing;

@end

#endif
