// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTLog.h"

RCTLogFunction EXDefaultRCTLogFunction;

// EXFrame will use this when the manifest indicates we should enable developer debugging
// Kernel will use this when (DEBUG == 1)
RCTLogFunction EXDeveloperRCTLogFunction;

RCTLogFunction EXGetKernelRCTLogFunction(void);
