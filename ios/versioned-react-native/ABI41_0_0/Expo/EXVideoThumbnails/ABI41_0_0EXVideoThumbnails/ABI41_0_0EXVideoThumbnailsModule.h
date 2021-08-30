//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFileSystemInterface.h>

@interface ABI41_0_0EXVideoThumbnailsModule : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI41_0_0UMFileSystemInterface> fileSystem;

@end
