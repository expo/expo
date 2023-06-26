#import <Foundation/Foundation.h>

#define ABI49_0_0REA_LOG_ERROR_IF_NIL(value, errorMsg) \
  ({                                          \
    if (value == nil)                         \
      ABI49_0_0RCTLogError(errorMsg);                  \
  })
