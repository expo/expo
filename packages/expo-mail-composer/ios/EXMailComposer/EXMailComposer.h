// Copyright 2017-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

#import <MessageUI/MessageUI.h>

@interface EXMailComposer : EXExportedModule <EXModuleRegistryConsumer, MFMailComposeViewControllerDelegate>
@end
