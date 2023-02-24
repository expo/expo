#import <Foundation/Foundation.h>

#define ABI47_0_0REA_LOG_ERROR_IF_NIL(value, errorMsg) \
  ({                                          \
    if (value == nil)                         \
      ABI47_0_0RCTLogError(errorMsg);                  \
  })
