//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMFileSystemInterface/ABI40_0_0UMFileSystemInterface.h>

@interface ABI40_0_0EXVideoThumbnailsModule : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI40_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI40_0_0UMFileSystemInterface> fileSystem;

@end
