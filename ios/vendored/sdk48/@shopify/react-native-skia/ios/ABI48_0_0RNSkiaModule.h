#pragma once

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>

#include "ABI48_0_0SkiaManager.h"

@interface ABI48_0_0RNSkiaModule : NSObject <ABI48_0_0RCTBridgeModule>

- (ABI48_0_0SkiaManager *)manager;

@end
