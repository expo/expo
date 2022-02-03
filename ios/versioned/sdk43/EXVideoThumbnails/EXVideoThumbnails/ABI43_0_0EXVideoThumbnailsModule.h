//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXFileSystemInterface.h>

@interface ABI43_0_0EXVideoThumbnailsModule : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI43_0_0EXFileSystemInterface> fileSystem;

@end
