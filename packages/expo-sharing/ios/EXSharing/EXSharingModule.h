//  Copyright © 2018 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

@interface EXSharingModule : EXExportedModule <EXModuleRegistryConsumer, UIDocumentInteractionControllerDelegate>
@end
