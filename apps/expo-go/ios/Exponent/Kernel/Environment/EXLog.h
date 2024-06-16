// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTLog.h>

extern RCTLogFunction EXDefaultRCTLogFunction;

// EXFrame will use this when the manifest indicates we should enable developer debugging
// Kernel will use this when (DEBUG == 1)
extern RCTLogFunction EXDeveloperRCTLogFunction;

extern RCTLogFunction EXGetKernelRCTLogFunction(void);
