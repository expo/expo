//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXFileSystemInterface.h>

@interface ABI47_0_0EXVideoThumbnailsModule : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI47_0_0EXFileSystemInterface> fileSystem;

@end
