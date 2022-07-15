//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

static NSString *const ABI46_0_0EXNetworkTypeUnknown = @"UNKNOWN";
static NSString *const ABI46_0_0EXNetworkTypeNone = @"NONE";
static NSString *const ABI46_0_0EXNetworkTypeWifi = @"WIFI";
static NSString *const ABI46_0_0EXNetworkTypeCellular = @"CELLULAR";


@interface ABI46_0_0EXNetwork : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer>
@end
