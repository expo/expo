//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
typedef NS_ENUM(NSInteger, ABI38_0_0EXCellularGeneration) {
  ABI38_0_0EXCellularGenerationUnknown = 0,
  ABI38_0_0EXCellularGeneration2G,
  ABI38_0_0EXCellularGeneration3G,
  ABI38_0_0EXCellularGeneration4G,
};

@interface ABI38_0_0EXCellularModule : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer>

@end

NS_ASSUME_NONNULL_END
