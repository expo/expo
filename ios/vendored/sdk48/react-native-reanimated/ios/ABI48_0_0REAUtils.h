#import <Foundation/Foundation.h>

#define ABI48_0_0REA_LOG_ERROR_IF_NIL(value, errorMsg) \
  ({                                          \
    if (value == nil)                         \
      ABI48_0_0RCTLogError(errorMsg);                  \
  })
