//
//  GoogleMobileAdsDefines.h
//  Google Mobile Ads SDK
//
//  Copyright (c) 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#if defined(__cplusplus)
#define GAD_EXTERN extern "C" __attribute__((visibility("default")))
#else
#define GAD_EXTERN extern __attribute__((visibility("default")))
#endif  // defined(__cplusplus)

#if defined(__has_feature) && defined(__has_attribute)
#if __has_feature(attribute_GAD_DEPRECATED_with_message)
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s) __attribute__((deprecated(s)))
#elif __has_attribute(deprecated)
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s) __attribute__((deprecated))
#else
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s)
#endif  // __has_feature(attribute_GAD_DEPRECATED_with_message)
#if __has_attribute(deprecated)
#define GAD_DEPRECATED_ATTRIBUTE __attribute__((deprecated))
#else
#define GAD_DEPRECATED_ATTRIBUTE
#endif  // __has_attribute(deprecated)
#else
#define GAD_DEPRECATED_ATTRIBUTE
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s)
#endif  // defined(__has_feature) && defined(__has_attribute)

#ifndef IBInspectable
#define IBInspectable
#endif

#if __has_feature(nullability)  // Available starting in Xcode 6.3.
#define GAD_NULLABLE_TYPE __nullable
#define GAD_NONNULL_TYPE __nonnull
#define GAD_NULLABLE nullable
#define GAD_ASSUME_NONNULL_BEGIN NS_ASSUME_NONNULL_BEGIN
#define GAD_ASSUME_NONNULL_END NS_ASSUME_NONNULL_END
#else
#define GAD_NULLABLE_TYPE
#define GAD_NONNULL_TYPE
#define GAD_NULLABLE
#define GAD_ASSUME_NONNULL_BEGIN
#define GAD_ASSUME_NONNULL_END
#endif  // __has_feature(nullability)

#if __has_attribute(objc_boxable)  // Available starting in Xcode 7.3.
#define GAD_BOXABLE __attribute__((objc_boxable))
#else
#define GAD_BOXABLE
#endif  // __has_attribute(objc_boxable)

#if defined(NS_STRING_ENUM)  // Available starting in Xcode 8.0.
#define GAD_STRING_ENUM NS_STRING_ENUM
#else
#define GAD_STRING_ENUM
#endif
