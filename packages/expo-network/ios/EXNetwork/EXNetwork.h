//  Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

static NSString *const EXNetworkTypeUnknown = @"UNKNOWN";
static NSString *const EXNetworkTypeNone = @"NONE";
static NSString *const EXNetworkTypeWifi = @"WIFI";
static NSString *const EXNetworkTypeCellular = @"CELLULAR";


@interface EXNetwork : EXExportedModule <EXModuleRegistryConsumer>
@end
