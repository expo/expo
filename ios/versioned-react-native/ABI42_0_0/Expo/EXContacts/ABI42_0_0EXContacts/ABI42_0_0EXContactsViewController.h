// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

@interface ABI42_0_0EXContactsViewController : CNContactViewController

- (void)setCloseButton:(NSString *)title;
- (void)closeController;

@end
