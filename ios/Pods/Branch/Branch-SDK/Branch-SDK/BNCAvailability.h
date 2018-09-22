//
//  BNCAvailability.h
//  Branch-SDK
//
//  Created by Edward on 10/26/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_10_0
#warning Warning: Compiling with pre-iOS 10 / Xcode 7 support.

typedef NSString * UIActivityType;
typedef NSString * UIApplicationOpenURLOptionsKey;

#endif

#ifndef NS_STRING_ENUM
#define NS_STRING_ENUM
#endif
