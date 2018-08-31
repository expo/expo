// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

@interface ABI30_0_0EXContactsViewController : CNContactViewController

- (void)setCloseButton:(NSString *)title;
- (void)closeController;

@end
