// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#define LAST_SUPPORTED_SDK 33

#define EX_REMOVE_ONCE_SDK_IS_PHASED_OUT(sdk) _Static_assert(sdk >= LAST_SUPPORTED_SDK, "SDK dropped, remove this code");
