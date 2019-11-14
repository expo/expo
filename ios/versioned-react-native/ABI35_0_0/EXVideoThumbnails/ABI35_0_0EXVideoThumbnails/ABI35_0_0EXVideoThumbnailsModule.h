//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>
#import <ABI35_0_0UMFileSystemInterface/ABI35_0_0UMFileSystemInterface.h>

@interface ABI35_0_0EXVideoThumbnailsModule : ABI35_0_0UMExportedModule <ABI35_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI35_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI35_0_0UMFileSystemInterface> fileSystem;

@end
