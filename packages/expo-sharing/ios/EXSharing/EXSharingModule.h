//  Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

@interface EXSharingModule : EXExportedModule <EXModuleRegistryConsumer, UIDocumentInteractionControllerDelegate>
@end
