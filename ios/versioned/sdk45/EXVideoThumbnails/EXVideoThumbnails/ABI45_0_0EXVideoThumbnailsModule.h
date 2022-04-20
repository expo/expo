//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXFileSystemInterface.h>

@interface ABI45_0_0EXVideoThumbnailsModule : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) ABI45_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI45_0_0EXFileSystemInterface> fileSystem;

@end
