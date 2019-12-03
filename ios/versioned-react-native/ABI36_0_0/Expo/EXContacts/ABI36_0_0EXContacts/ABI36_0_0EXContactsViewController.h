// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

@interface ABI36_0_0EXContactsViewController : CNContactViewController

- (void)setCloseButton:(NSString *)title;
- (void)closeController;

@end
