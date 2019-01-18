//
//  EXMailComposer.h
//  Exponent
//
//  Created by Alicja Warchał on 20.12.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

#import <MessageUI/MessageUI.h>

@interface EXMailComposer : EXExportedModule <EXModuleRegistryConsumer, MFMailComposeViewControllerDelegate>
@end
