// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

@interface EXContactsViewController : CNContactViewController

- (void)setCloseButton:(NSString *)title;
- (void)closeController;
- (void)handleViewDisappeared: (void (^)(void))handler;

@end
