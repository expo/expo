//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFileSystemInterface.h>

@interface ABI34_0_0EXVideoThumbnailsModule : ABI34_0_0UMExportedModule <ABI34_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI34_0_0UMFileSystemInterface> fileSystem;

@end
