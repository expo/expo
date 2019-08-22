// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#define LAST_SUPPORTED_SDK 33

#define EX_SDK_32 32
#define EX_SDK_33 33
#define EX_SDK_34 34

/*
 * only certain compilers support __attribute__((unavailable))
 */
#if defined(__GNUC__) && ((__GNUC__ >= 4) || ((__GNUC__ == 3) && (__GNUC_MINOR__ >= 1)))
#define EX_UNAVAILABLE_MSG_ATTRIBUTE(s) __attribute__((unavailable(s)))
#else
#define EX_UNAVAILABLE_MSG_ATTRIBUTE(s) DEPRECATED_MSG_ATTRIBUTE(s)
#endif

#if EX_SDK_32 < LAST_SUPPORTED_SDK
#define EX_IS_DEPRECATED_32 EX_UNAVAILABLE_MSG_ATTRIBUTE("SDK 32 is not longer supported.")
#else
#define EX_IS_DEPRECATED_32
#endif

#if EX_SDK_33 < LAST_SUPPORTED_SDK
#define EX_IS_DEPRECATED_33 EX_UNAVAILABLE_MSG_ATTRIBUTE("SDK 33 is not longer supported.")
#else
#define EX_IS_DEPRECATED_33
#endif

#if EX_SDK_34 < LAST_SUPPORTED_SDK
#define EX_IS_DEPRECATED_34 EX_UNAVAILABLE_MSG_ATTRIBUTE("SDK 34 is not longer supported.")
#else
#define EX_IS_DEPRECATED_34
#endif


#define EX_REMOVE_ONCE_SDK_IS_PHASED_OUT(sdk) EX_IS_DEPRECATED_##sdk
