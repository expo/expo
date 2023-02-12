#pragma once

#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>

#include "ABI47_0_0SkiaManager.h"

@interface ABI47_0_0RNSkiaModule : NSObject <ABI47_0_0RCTBridgeModule>

- (ABI47_0_0SkiaManager *)manager;

@end
