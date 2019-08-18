//
//  LOTPlatformCompat.h
//  Lottie
//
//  Created by Oleksii Pavlovskyi on 2/2/17.
//  Copyright (c) 2017 Airbnb. All rights reserved.
//

#ifndef LOTPlatformCompat_h
#define LOTPlatformCompat_h

#include <TargetConditionals.h>

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR

#import <UIKit/UIKit.h>

#else

#import <AppKit/AppKit.h>
#import "UIColor.h"
#import "CALayer+Compat.h"
#import "NSValue+Compat.h"
#import "UIBezierPath.h"

NS_INLINE NSString *NSStringFromCGRect(CGRect rect) {
    return NSStringFromRect(rect);
}

NS_INLINE NSString *NSStringFromCGPoint(CGPoint point) {
    return NSStringFromPoint(point);
}

typedef NSEdgeInsets UIEdgeInsets;

#endif
#endif
