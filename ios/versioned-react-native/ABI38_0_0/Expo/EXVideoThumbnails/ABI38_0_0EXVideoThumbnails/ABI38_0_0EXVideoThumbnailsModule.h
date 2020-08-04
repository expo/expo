//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0UMFileSystemInterface/ABI38_0_0UMFileSystemInterface.h>

@interface ABI38_0_0EXVideoThumbnailsModule : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI38_0_0UMFileSystemInterface> fileSystem;

@end
