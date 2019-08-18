//
//  CLSAttributes.h
//  Crashlytics
//
//  Copyright (c) 2015 Crashlytics, Inc. All rights reserved.
//

#pragma once

#define CLS_DEPRECATED(x)  __attribute__ ((deprecated(x)))

#if !__has_feature(nullability)
    #define nonnull
    #define nullable
    #define _Nullable
    #define _Nonnull
#endif

#ifndef NS_ASSUME_NONNULL_BEGIN
    #define NS_ASSUME_NONNULL_BEGIN
#endif

#ifndef NS_ASSUME_NONNULL_END
    #define NS_ASSUME_NONNULL_END
#endif

#if __has_feature(objc_generics)
    #define CLS_GENERIC_NSARRAY(type) NSArray<type>
    #define CLS_GENERIC_NSDICTIONARY(key_type,object_key) NSDictionary<key_type, object_key>
#else
    #define CLS_GENERIC_NSARRAY(type) NSArray
    #define CLS_GENERIC_NSDICTIONARY(key_type,object_key) NSDictionary
#endif
