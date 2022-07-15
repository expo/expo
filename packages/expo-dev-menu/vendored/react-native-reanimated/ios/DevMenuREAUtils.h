#import <Foundation/Foundation.h>

#define DevMenuREA_LOG_ERROR_IF_NIL(value, errorMsg) \
  ({                                          \
    if (value == nil)                         \
      RCTLogError(errorMsg);                  \
  })
