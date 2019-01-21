// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

#import <MessageUI/MessageUI.h>

@interface EXMailComposer : EXExportedModule <EXModuleRegistryConsumer, MFMailComposeViewControllerDelegate>
@end
