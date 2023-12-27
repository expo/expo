//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>

@interface ABI42_0_0EXVideoThumbnailsModule : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI42_0_0EXFileSystemInterface> fileSystem;

@end
