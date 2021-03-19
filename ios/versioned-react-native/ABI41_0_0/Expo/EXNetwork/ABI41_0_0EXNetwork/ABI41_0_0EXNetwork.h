//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

static NSString *const ABI41_0_0EXNetworkTypeUnknown = @"UNKNOWN";
static NSString *const ABI41_0_0EXNetworkTypeNone = @"NONE";
static NSString *const ABI41_0_0EXNetworkTypeWifi = @"WIFI";
static NSString *const ABI41_0_0EXNetworkTypeCellular = @"CELLULAR";


@interface ABI41_0_0EXNetwork : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer>
@end
