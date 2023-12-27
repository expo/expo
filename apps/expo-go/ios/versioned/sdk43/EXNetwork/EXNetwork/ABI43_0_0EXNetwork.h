//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

static NSString *const ABI43_0_0EXNetworkTypeUnknown = @"UNKNOWN";
static NSString *const ABI43_0_0EXNetworkTypeNone = @"NONE";
static NSString *const ABI43_0_0EXNetworkTypeWifi = @"WIFI";
static NSString *const ABI43_0_0EXNetworkTypeCellular = @"CELLULAR";


@interface ABI43_0_0EXNetwork : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer>
@end
