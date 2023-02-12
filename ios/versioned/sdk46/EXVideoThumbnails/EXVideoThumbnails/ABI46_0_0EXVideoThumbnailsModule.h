//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFileSystemInterface.h>

@interface ABI46_0_0EXVideoThumbnailsModule : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI46_0_0EXFileSystemInterface> fileSystem;

@end
