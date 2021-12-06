//  Copyright © 2018 650 Industries. All rights reserved.
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXFileSystemInterface.h>

@interface ABI44_0_0EXVideoThumbnailsModule : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI44_0_0EXFileSystemInterface> fileSystem;

@end
