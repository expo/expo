#import <Foundation/Foundation.h>

#define ABI43_0_0REA_LOG_ERROR_IF_NIL(value, errorMsg) ({\
  if (value == nil) ABI43_0_0RCTLogError(errorMsg);\
})
