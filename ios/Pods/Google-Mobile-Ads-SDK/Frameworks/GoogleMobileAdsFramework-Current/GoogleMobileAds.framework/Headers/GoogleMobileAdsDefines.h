//
//  GoogleMobileAdsDefines.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

#if defined(__cplusplus)
#define GAD_EXTERN extern "C" __attribute__((visibility("default")))
#else
#define GAD_EXTERN extern __attribute__((visibility("default")))
#endif  // defined(__cplusplus)

#if !defined(__has_feature)
#error "Use latest Xcode version."
#endif  // !defined(__has_feature)

#if !defined(__has_attribute)
#error "Use latest Xcode version."
#endif  // !defined(__has_attribute)

#if __has_feature(attribute_deprecated_with_message)
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s) __attribute__((deprecated(s)))
#elif __has_attribute(deprecated)
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s) __attribute__((deprecated))
#else
#define GAD_DEPRECATED_MSG_ATTRIBUTE(s)
#endif  // __has_feature(attribute_deprecated_with_message)

#if __has_attribute(deprecated)
#define GAD_DEPRECATED_ATTRIBUTE __attribute__((deprecated))
#else
#define GAD_DEPRECATED_ATTRIBUTE
#endif  // __has_attribute(deprecated)

#if __has_feature(nullability)  // Available starting in Xcode 6.3.
#define GAD_NULLABLE_TYPE __nullable
#define GAD_NONNULL_TYPE __nonnull
#define GAD_NULLABLE nullable
#else
#error "Use latest Xcode version."
#endif  // __has_feature(nullability)

#if __has_attribute(objc_boxable)  // Available starting in Xcode 7.3.
#define GAD_BOXABLE __attribute__((objc_boxable))
#else
#error "Use latest Xcode version."
#endif  // __has_attribute(objc_boxable)

#if defined(NS_STRING_ENUM)  // Available starting in Xcode 8.0.
#define GAD_STRING_ENUM NS_STRING_ENUM
#else
#error "Use latest Xcode version."
#endif

// Pre-Xcode 11 versions must replace UIWindowScene with NSObject.
#if __IPHONE_OS_VERSION_MAX_ALLOWED < 130000
#ifndef UIWindowScene
#define UIWindowScene NSObject
#endif
#endif
