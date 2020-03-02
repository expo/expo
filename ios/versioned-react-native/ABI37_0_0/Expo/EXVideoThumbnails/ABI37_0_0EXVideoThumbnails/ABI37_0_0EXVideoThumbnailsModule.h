//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMFileSystemInterface/ABI37_0_0UMFileSystemInterface.h>

@interface ABI37_0_0EXVideoThumbnailsModule : ABI37_0_0UMExportedModule <ABI37_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI37_0_0UMFileSystemInterface> fileSystem;

@end
