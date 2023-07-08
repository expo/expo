#pragma once

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

#include "ABI49_0_0SkiaManager.h"

@interface ABI49_0_0RNSkiaModule : NSObject <ABI49_0_0RCTBridgeModule>

- (ABI49_0_0SkiaManager *)manager;

@end
