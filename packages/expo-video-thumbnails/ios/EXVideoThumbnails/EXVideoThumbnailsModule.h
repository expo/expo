//  Copyright © 2018 650 Industries. All rights reserved.
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

@interface EXVideoThumbnailsModule : EXExportedModule <EXModuleRegistryConsumer>

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;

@end
