#pragma once

#ifdef RCT_NEW_ARCH_ENABLED
#import <rnskia/rnskia.h>
#else
#import <React/RCTBridgeModule.h>
#endif

#include "SkiaManager.h"

@interface RNSkiaModule : NSObject
#ifdef RCT_NEW_ARCH_ENABLED
                          <NativeSkiaModuleSpec>
#else
                          <RCTBridgeModule>
#endif

- (SkiaManager *)manager;

@end
