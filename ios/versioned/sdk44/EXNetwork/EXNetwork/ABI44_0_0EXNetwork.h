//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

static NSString *const ABI44_0_0EXNetworkTypeUnknown = @"UNKNOWN";
static NSString *const ABI44_0_0EXNetworkTypeNone = @"NONE";
static NSString *const ABI44_0_0EXNetworkTypeWifi = @"WIFI";
static NSString *const ABI44_0_0EXNetworkTypeCellular = @"CELLULAR";


@interface ABI44_0_0EXNetwork : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>
@end
