#ifndef FIR_SWIFT_NAME

#import <Foundation/Foundation.h>

// NS_SWIFT_NAME can only translate factory methods before the iOS 9.3 SDK.
// Wrap it in our own macro if it's a non-compatible SDK.
#ifdef __IPHONE_9_3
#define FIR_SWIFT_NAME(X) NS_SWIFT_NAME(X)
#else
#define FIR_SWIFT_NAME(X)  // Intentionally blank.
#endif  // #ifdef __IPHONE_9_3

#endif  // FIR_SWIFT_NAME
