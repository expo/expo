#pragma once

#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>

#include "ABI46_0_0SkiaManager.h"

@interface ABI46_0_0RNSkiaModule : NSObject <ABI46_0_0RCTBridgeModule>

- (ABI46_0_0SkiaManager *)manager;

@end
