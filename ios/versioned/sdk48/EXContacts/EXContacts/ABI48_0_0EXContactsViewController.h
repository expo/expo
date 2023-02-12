// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

@interface ABI48_0_0EXContactsViewController : CNContactViewController

- (void)setCloseButton:(NSString *)title;
- (void)closeController;
- (void)handleViewDisappeared: (void (^)(void))handler;

@end
