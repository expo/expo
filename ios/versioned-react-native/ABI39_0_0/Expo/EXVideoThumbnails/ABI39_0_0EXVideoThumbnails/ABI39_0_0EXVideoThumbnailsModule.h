//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0UMFileSystemInterface/ABI39_0_0UMFileSystemInterface.h>

@interface ABI39_0_0EXVideoThumbnailsModule : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI39_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI39_0_0UMFileSystemInterface> fileSystem;

@end
