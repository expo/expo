//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
typedef NS_ENUM(NSInteger, ABI43_0_0EXCellularGeneration) {
  ABI43_0_0EXCellularGenerationUnknown = 0,
  ABI43_0_0EXCellularGeneration2G,
  ABI43_0_0EXCellularGeneration3G,
  ABI43_0_0EXCellularGeneration4G,
  ABI43_0_0EXCellularGeneration5G,
};

@interface ABI43_0_0EXCellularModule : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer>

@end

NS_ASSUME_NONNULL_END
