#pragma once

#import <React/RCTBridgeModule.h>

#include "SkiaManager.h"

@interface RNSkiaModule : NSObject <RCTBridgeModule>

- (SkiaManager *)manager;

@end
