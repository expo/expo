//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <ABI36_0_0UMFileSystemInterface/ABI36_0_0UMFileSystemInterface.h>

@interface ABI36_0_0EXVideoThumbnailsModule : ABI36_0_0UMExportedModule <ABI36_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI36_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI36_0_0UMFileSystemInterface> fileSystem;

@end
