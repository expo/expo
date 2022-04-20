//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

static NSString *const ABI45_0_0EXNetworkTypeUnknown = @"UNKNOWN";
static NSString *const ABI45_0_0EXNetworkTypeNone = @"NONE";
static NSString *const ABI45_0_0EXNetworkTypeWifi = @"WIFI";
static NSString *const ABI45_0_0EXNetworkTypeCellular = @"CELLULAR";


@interface ABI45_0_0EXNetwork : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer>
@end
