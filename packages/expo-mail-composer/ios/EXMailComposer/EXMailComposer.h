// Copyright 2017-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

#import <MessageUI/MessageUI.h>

@interface EXMailComposer : UMExportedModule <UMModuleRegistryConsumer, MFMailComposeViewControllerDelegate>
@end
