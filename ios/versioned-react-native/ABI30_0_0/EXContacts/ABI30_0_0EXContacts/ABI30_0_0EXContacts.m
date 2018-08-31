// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXContacts/ABI30_0_0EXContacts.h>
#import <ABI30_0_0EXContacts/ABI30_0_0EXContactsViewController.h>
#import <ABI30_0_0EXContacts/ABI30_0_0EXContacts+Serialization.h>

#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemInterface.h>
#import <ABI30_0_0EXPermissionsInterface/ABI30_0_0EXPermissionsInterface.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUtilitiesInterface.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUtilities.h>

#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

static NSString *const ABI30_0_0EXContactsOptionContainerId = @"containerId";
static NSString *const ABI30_0_0EXContactsOptionGroupId = @"groupId";
static NSString *const ABI30_0_0EXContactsOptionGroupName = @"groupName";
static NSString *const ABI30_0_0EXContactsOptionContactId = @"contactId";
static NSString *const ABI30_0_0EXContactsOptionHasNextPage = @"hasNextPage";
static NSString *const ABI30_0_0EXContactsOptionHasPreviousPage = @"hasPreviousPage";
static NSString *const ABI30_0_0EXContactsOptionPageOffset = @"pageOffset";
static NSString *const ABI30_0_0EXContactsOptionPageSize = @"pageSize";
static NSString *const ABI30_0_0EXContactsOptionSort = @"sort";
static NSString *const ABI30_0_0EXContactsOptionRawContacts = @"rawContacts";
static NSString *const ABI30_0_0EXContactsOptionTotal = @"total";

static NSString *const ABI30_0_0EXContactsOptionData = @"data";

static NSString *const ABI30_0_0EXContactsContactTypePerson = @"person";
static NSString *const ABI30_0_0EXContactsContactTypeCompany = @"company";

static NSString *const ABI30_0_0EXContactsKeyId = @"id";
static NSString *const ABI30_0_0EXContactsKeyContactType = @"contactType";
static NSString *const ABI30_0_0EXContactsKeyAddresses = @"addresses";
static NSString *const ABI30_0_0EXContactsKeyPhoneNumbers = @"phoneNumbers";
static NSString *const ABI30_0_0EXContactsKeyEmails = @"emails";
static NSString *const ABI30_0_0EXContactsKeyFirstName = @"firstName";
static NSString *const ABI30_0_0EXContactsKeyMiddleName = @"middleName";
static NSString *const ABI30_0_0EXContactsKeyLastName = @"lastName";
static NSString *const ABI30_0_0EXContactsKeyNamePrefix = @"namePrefix";
static NSString *const ABI30_0_0EXContactsKeyNameSuffix = @"nameSuffix";
static NSString *const ABI30_0_0EXContactsKeyNickname = @"nickname";
static NSString *const ABI30_0_0EXContactsKeyPhoneticFirstName = @"phoneticFirstName";
static NSString *const ABI30_0_0EXContactsKeyPhoneticMiddleName = @"phoneticMiddleName";
static NSString *const ABI30_0_0EXContactsKeyPhoneticLastName = @"phoneticLastName";
static NSString *const ABI30_0_0EXContactsKeyMaidenName = @"maidenName";
static NSString *const ABI30_0_0EXContactsKeyBirthday = @"birthday";
static NSString *const ABI30_0_0EXContactsKeyNonGregorianBirthday = @"nonGregorianBirthday";
static NSString *const ABI30_0_0EXContactsKeyImageAvailable = @"imageAvailable";
static NSString *const ABI30_0_0EXContactsKeyRawImage = @"rawImage";
static NSString *const ABI30_0_0EXContactsKeyImage = @"image";
static NSString *const ABI30_0_0EXContactsKeyNote = @"note";
static NSString *const ABI30_0_0EXContactsKeyCompany = @"company";
static NSString *const ABI30_0_0EXContactsKeyJobTitle = @"jobTitle";
static NSString *const ABI30_0_0EXContactsKeyDepartment = @"department";
static NSString *const ABI30_0_0EXContactsKeySocialProfiles = @"socialProfiles";
static NSString *const ABI30_0_0EXContactsKeyInstantMessageAddresses = @"instantMessageAddresses";
static NSString *const ABI30_0_0EXContactsKeyUrlAddresses = @"urlAddresses";
static NSString *const ABI30_0_0EXContactsKeyDates = @"dates";
static NSString *const ABI30_0_0EXContactsKeyRelationships = @"relationships";
static NSString *const ABI30_0_0EXContactsKeyName = @"name";
static NSString *const ABI30_0_0EXContactsKeyEditor = @"editor";
static NSString *const ABI30_0_0EXContactsKeyRawImageBase64 = @"rawImageBase64";
static NSString *const ABI30_0_0EXContactsKeyImageBase64 = @"imageBase64";

@import Contacts;

@interface ABI30_0_0EXContacts () <CNContactViewControllerDelegate>

@property (nonatomic, strong) CNContactStore *contactStore;
@property (nonatomic, strong) UIViewController *presentingViewController;
@property (nonatomic, weak) id<ABI30_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI30_0_0EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<ABI30_0_0EXUtilitiesInterface> utilities;

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI30_0_0EXContacts

ABI30_0_0EX_EXPORT_MODULE(ExpoContacts);

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFileSystemInterface)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXPermissionsInterface)];
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXUtilitiesInterface)];
}

ABI30_0_0EX_EXPORT_METHOD_AS(getDefaultContainerIdentifierAsync,
                    getDefaultContainerIdentifierAsync:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    
    resolve([contactStore defaultContainerIdentifier]);
}

ABI30_0_0EX_EXPORT_METHOD_AS(writeContactToFileAsync,
                    writeContactToFileAsync:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:options[@"fields"]];
    NSDictionary *payload = [self _fetchContactData:options
                                       contactStore:contactStore
                                        keysToFetch:keysToFetch
                             ];
    
    if (payload[@"error"]) {
        [ABI30_0_0EXContacts rejectWithError:@"Error while fetching contacts" error:payload[@"error"] rejecter:reject];
        return;
    } else {
        
        NSArray<CNContact *> *contacts = payload[@"data"];
        
        NSString *fileName = [[NSUUID UUID] UUIDString];
        
        if (contacts.count == 1) {
            NSString *name = [CNContactFormatter stringFromContact:contacts[0] style:CNContactFormatterStyleFullName];
            if (name) {
                fileName = [[name componentsSeparatedByString:@" "] componentsJoinedByString:@"_"];
            }
        }
            
        if (!self.fileSystem) {
            reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
            return;
        }
        NSString *extension = @"vcf";
        NSString *directory = [self.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Contacts"];
        [self.fileSystem ensureDirExistsWithPath:directory];
        fileName = [fileName stringByAppendingPathExtension:extension];
        NSString *newPath = [directory stringByAppendingPathComponent:fileName];
        NSError *error;
        NSData *data = [CNContactVCardSerialization dataWithContacts:contacts error:&error];
        if (error) {
            [ABI30_0_0EXContacts rejectWithError:@"Failed to cache contacts" error:error rejecter:reject];
            return;
        }
        
        [data writeToFile:newPath atomically:YES];
        
        NSURL *fileURL = [NSURL fileURLWithPath:newPath];
        NSString *filePath = [fileURL absoluteString];
        
        resolve(filePath);
    }
}

ABI30_0_0EX_EXPORT_METHOD_AS(dismissFormAsync,
                    dismissFormAsync:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  [ABI30_0_0EXUtilities performSynchronouslyOnMainThread:^{
    if (self.presentingViewController != nil) {
      [self.presentingViewController dismissViewControllerAnimated:true completion:^{
        self.presentingViewController = nil;
        resolve(@YES);
      }];
    } else {
      resolve(@NO);
    }
  }];
}

ABI30_0_0EX_EXPORT_METHOD_AS(presentFormAsync,
                    presentFormAsync:(NSString *)identifier
                    data:(NSDictionary *)data
                    options:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
  
  [ABI30_0_0EXUtilities performSynchronouslyOnMainThread:^{
    
        ABI30_0_0EXContactsViewController *controller;
        CNMutableContact *contact;
        
        if (identifier) {
            // Must be full contact from device
            contact = [[self _contactWithId:identifier contactStore:contactStore rejecter:reject] mutableCopy];
            if (!contact) return;
            controller = [ABI30_0_0EXContactsViewController viewControllerForContact:contact];
        } else {
            contact = [[CNMutableContact alloc] init];
            [self _mutateContact:contact withData:data resolver:resolve rejecter:reject];
            BOOL isNew = (options[@"isNew"] != nil && [options[@"isNew"] boolValue]);
            if (isNew) {
                controller = [ABI30_0_0EXContactsViewController viewControllerForNewContact:contact];
            } else {
                controller = [ABI30_0_0EXContactsViewController viewControllerForUnknownContact:contact];
            }
        }
        
        if (!controller) {
            [ABI30_0_0EXContacts rejectWithError:@"Could not build controller, invalid props" error:nil rejecter:reject];
            return;
        }
        
        NSString *cancelButtonTitle = options[@"cancelButtonTitle"];
        if (![self _fieldHasValue:cancelButtonTitle])
            cancelButtonTitle = @"Cancel";
        [controller setCloseButton:cancelButtonTitle];
        
        controller.contactStore = contactStore;
        controller.delegate = self;
        
        if ([options[@"displayedPropertyKeys"] isKindOfClass:[NSArray class]])
            controller.displayedPropertyKeys = [self _contactKeysToFetchFromFields:options[@"displayedPropertyKeys"]];
        if (options[@"allowsEditing"] != nil && [options[@"allowsEditing"] boolValue])
            controller.allowsEditing = [options[@"allowsEditing"] boolValue];
        if (options[@"allowsActions"] != nil && [options[@"allowsActions"] boolValue])
            controller.allowsActions = [options[@"allowsActions"] boolValue];
        if (options[@"shouldShowLinkedContacts"] != nil && [options[@"shouldShowLinkedContacts"] boolValue])
            controller.shouldShowLinkedContacts = [options[@"shouldShowLinkedContacts"] boolValue];
        if (options[@"message"] != nil && [options[@"message"] stringValue])
            controller.message = [options[@"message"] stringValue];
        if (options[@"alternateName"] != nil && [options[@"alternateName"] stringValue])
            controller.alternateName = [options[@"alternateName"] stringValue];
        if (options[ABI30_0_0EXContactsOptionGroupId] != nil && [options[ABI30_0_0EXContactsOptionGroupId] stringValue])
            controller.parentGroup = [self _groupWithId:[options[ABI30_0_0EXContactsOptionGroupId] stringValue] contactStore:contactStore rejecter:reject];
        
        BOOL isAnimated = true;
        if (options[@"preventAnimation"] != nil && [options[@"preventAnimation"] boolValue])
            isAnimated = [options[@"preventAnimation"] boolValue];
        
        UIViewController *parent = self->_utilities.currentViewController;
        
        // We need to wrap our contact view controller in UINavigationController.
        // See: https://stackoverflow.com/questions/38748969/cnui-error-contact-view-delayed-appearance-timed-out
        UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:controller];
        navigationController.modalPresentationStyle = UIModalPresentationFullScreen;
        self.presentingViewController = navigationController;
        [parent presentViewController:navigationController animated:isAnimated completion:^{
            resolve(nil);
        }];
    }];
}

ABI30_0_0EX_EXPORT_METHOD_AS(addExistingContactToGroupAsync,
                    addExistingContactToGroupAsync:(NSString *)identifier
                    groupId:(NSString *)groupId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:nil];
    
    CNMutableContact *contact = [ABI30_0_0EXContacts getContactWithId:identifier
                                                contactStore:contactStore
                                                 keysToFetch:keysToFetch
                                                    rejecter:reject];
    if (!contact) return;
    
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    
    [saveRequest addMember:contact toGroup:group];
    
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(addContactAsync,
                    addContactAsync:(NSDictionary *)data
                    containerId:(NSString *)containerId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNMutableContact *contact = [[CNMutableContact alloc] init];
    [self _mutateContact:contact withData:data resolver:resolve rejecter:reject];
    if (!containerId) {
        containerId = [contactStore defaultContainerIdentifier];
    }
    [saveRequest addContact:contact toContainerWithIdentifier:containerId];
    if ([ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:nil rejecter:reject]) {
        resolve(contact.identifier);
    }
}

ABI30_0_0EX_EXPORT_METHOD_AS(updateContactAsync,
                    updateContactAsync:(NSDictionary *)updates
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:nil];
    
    CNMutableContact *contact = [ABI30_0_0EXContacts getContactWithId:updates[@"id"]
                                                contactStore:contactStore
                                                 keysToFetch:keysToFetch
                                                    rejecter:reject];
    if (!contact) return;
    [self _mutateContact:contact withData:updates resolver:resolve rejecter:reject];
    [saveRequest updateContact:contact];
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(removeContactAsync,
                    removeContactAsync:(NSString *)identifier
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    
    NSArray *keysToFetch = @[CNContactIdentifierKey];
    
    CNMutableContact *contact = [ABI30_0_0EXContacts getContactWithId:identifier contactStore:contactStore keysToFetch:keysToFetch rejecter:reject];
    if (!contact) return;
    
    [saveRequest deleteContact:contact];
    
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(updateGroupNameAsync,
                    updateGroupNameAsync:(NSString *)name
                    groupId:(NSString *)groupId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    CNMutableGroup *mutableGroup = [group mutableCopy];
    mutableGroup.name = name;
    [saveRequest updateGroup:mutableGroup];
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(addExistingGroupToContainerAsync,
                    addExistingGroupToContainerAsync:(NSString *)groupId
                    containerId:(NSString *)containerId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNMutableGroup *group = (CNMutableGroup *)[self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    [saveRequest addGroup:group toContainerWithIdentifier:containerId];
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
    if ([ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:nil rejecter:reject]) {
        resolve([[self class] encodeGroup:group]);
    }
}

ABI30_0_0EX_EXPORT_METHOD_AS(createGroupAsync,
                    createGroupAsync:(NSString *)name
                    containerId:(NSString *)containerId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNMutableGroup *group = [[CNMutableGroup alloc] init];
    group.name = name;
    [saveRequest addGroup:group toContainerWithIdentifier:containerId];
    if ([ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:nil rejecter:reject]) {
        resolve(group.identifier);
    }
}

ABI30_0_0EX_EXPORT_METHOD_AS(removeContactFromGroupAsync,
                    removeContactFromGroupAsync:(NSString *)identifier
                    groupId:(NSString *)groupId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    NSArray *keysToFetch = @[CNContactIdentifierKey];
    
    CNMutableContact *contact = [ABI30_0_0EXContacts getContactWithId:identifier contactStore:contactStore keysToFetch:keysToFetch rejecter:reject];
    if (!contact) return;
    
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    CNMutableGroup *mutableGroup = [group mutableCopy];
    [saveRequest removeMember:contact fromGroup:mutableGroup];
    
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(removeGroupAsync,
                    removeGroupAsync:(NSString *)groupId
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    CNMutableGroup *mutableGroup = [group mutableCopy];
    [saveRequest deleteGroup:mutableGroup];
    [ABI30_0_0EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(getContainersAsync,
                    getContainersAsync:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    NSError *error;
    
    NSPredicate *predicate;
    if (options[ABI30_0_0EXContactsOptionContactId]) {
        predicate = [CNContainer predicateForContainerOfContactWithIdentifier:options[ABI30_0_0EXContactsOptionContactId]];
    } else if (options[ABI30_0_0EXContactsOptionGroupId]) {
        predicate = [CNContainer predicateForContainerOfGroupWithIdentifier:options[ABI30_0_0EXContactsOptionGroupId]];
    } else if (options[ABI30_0_0EXContactsOptionContainerId]) {
        NSArray *ids = [ABI30_0_0EXContacts _ensureArray: options[ABI30_0_0EXContactsOptionContainerId]];
        predicate = [CNContainer predicateForContainersWithIdentifiers:ids];
    }
    
    NSArray<CNContainer*> *containers = [contactStore containersMatchingPredicate:predicate error:&error];
    
    if (error) {
        [ABI30_0_0EXContacts rejectWithError:@"Error fetching containers" error:nil rejecter:reject];
        return;
    } else {
        NSMutableArray *response = [NSMutableArray new];
        for (CNContainer *container in containers) {
            [response addObject:[[self class] encodeContainer:container]];
        }
        resolve(response);
    }
}

ABI30_0_0EX_EXPORT_METHOD_AS(getGroupsAsync,
                    getGroupsAsync:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    NSMutableArray *response = [[NSMutableArray alloc] init];
    
    if (options[ABI30_0_0EXContactsOptionGroupName]) {
        NSArray<NSDictionary *> *groups = [self _groupsWithName:options[ABI30_0_0EXContactsOptionGroupName] contactStore:contactStore rejecter:reject];
        if (groups) {
            [response addObjectsFromArray:groups];
        }
    } else {
        NSArray<CNGroup *> *groups = [ABI30_0_0EXContacts getGroupsWithData:options contactStore:contactStore rejecter:reject];
        if (!groups) return;
        for (CNGroup *group in groups) {
            if (group) [response addObject: [[self class] encodeGroup:group]];
        }
    }
    
    resolve(response);
}

ABI30_0_0EX_EXPORT_METHOD_AS(getContactsAsync,
                    getContactsAsync:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:options[@"fields"]];
    NSDictionary *payload = [self _fetchContactData:options
                                       contactStore:contactStore
                                        keysToFetch:keysToFetch
                             ];
    
    [self _serializeContactPayload:payload
                       keysToFetch:keysToFetch
                           options:options
                          resolver:resolve
                          rejecter:reject
     ];
}

- (void)_serializeContactPayload:(NSDictionary *)payload
                     keysToFetch:(NSArray<NSString *> *)keysToFetch
                         options:(NSDictionary *)options
                        resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                        rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    if (payload[@"error"]) {
        [ABI30_0_0EXContacts rejectWithError:@"Error while fetching contacts" error:payload[@"error"] rejecter:reject];
        return;
    } else {
        NSMutableArray *response = [[NSMutableArray alloc] init];
        for (CNContact *contact in payload[ABI30_0_0EXContactsOptionData]) {
            [response addObject:[self _serializeContact:contact
                                            keysToFetch:keysToFetch
                                               rejecter:reject
                                 ]];
        }
        [payload setValue:response forKey:ABI30_0_0EXContactsOptionData];
        resolve(payload);
    }
}

- (NSDictionary *)_queryContactsWithPredicate:(NSPredicate *)predicate
                                  keysToFetch:(NSArray<NSString *> *)keysToFetch
                                 contactStore:(CNContactStore *)contactStore
                                      options:(NSDictionary *)options
{
    NSUInteger pageOffset = 0;
    NSUInteger pageSize = 0;
    
    if (options[ABI30_0_0EXContactsOptionPageOffset] != nil && [options[ABI30_0_0EXContactsOptionPageOffset] unsignedIntegerValue]) {
        pageOffset = [options[ABI30_0_0EXContactsOptionPageOffset] unsignedIntegerValue];
    }
    
    if (options[ABI30_0_0EXContactsOptionPageSize] != nil && [options[ABI30_0_0EXContactsOptionPageSize] unsignedIntegerValue]) {
        pageSize = [options[ABI30_0_0EXContactsOptionPageSize] unsignedIntegerValue];
    }
    
    NSString *sortOrder = options[ABI30_0_0EXContactsOptionSort];
    CNContactFetchRequest *fetchRequest = [ABI30_0_0EXContacts buildFetchRequest:sortOrder keysToFetch:keysToFetch];
    fetchRequest.predicate = predicate;

    // Should the contacts be grouped by name - default is `YES`
    fetchRequest.unifyResults = YES;
    if (options[ABI30_0_0EXContactsOptionRawContacts] != nil && [options[ABI30_0_0EXContactsOptionRawContacts] boolValue]) {
        BOOL shouldReturnRawContacts = [options[ABI30_0_0EXContactsOptionRawContacts] boolValue];
        fetchRequest.unifyResults = !shouldReturnRawContacts;
    }
    
    __block NSUInteger currentIndex = 0;
    NSError *err;
    NSMutableArray *response = [[NSMutableArray alloc] init];
    
    NSUInteger endIndex = pageOffset + pageSize;
    BOOL success = [contactStore enumerateContactsWithFetchRequest:fetchRequest error:&err usingBlock:^(CNContact * _Nonnull person, BOOL * _Nonnull stop) {
        // Paginate the result.
        BOOL shouldAddContact = (currentIndex >= pageOffset) && (currentIndex < endIndex);
        currentIndex++;
        if (shouldAddContact || pageSize <= 0) {
            [response addObject:person];
        }
    }];
    
    NSUInteger total = currentIndex;
    BOOL hasNextPage = NO;
    BOOL hasPreviousPage = pageOffset > 0;
    if (pageSize > 0) {
        hasNextPage = pageOffset + pageSize < total;
    }
    
    if (success && !err) {
        NSMutableDictionary *payload = [NSMutableDictionary new];
        [payload setObject:response forKey:ABI30_0_0EXContactsOptionData];
        [payload setObject:@(hasNextPage) forKey:ABI30_0_0EXContactsOptionHasNextPage];
        [payload setObject:@(hasPreviousPage) forKey:ABI30_0_0EXContactsOptionHasPreviousPage];
        [payload setObject:@(currentIndex) forKey:ABI30_0_0EXContactsOptionTotal];
        return payload;
    } else {
        return @{ @"error": err };
    }
}

- (BOOL)_fieldHasValue:(NSString *)value
{
    return (value && ![value isEqualToString:@""]);
}

- (NSDictionary *)_serializeContact:(CNContact *)person
                        keysToFetch:(NSArray *)keysToFetch
                           rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    if (keysToFetch == nil) {
        keysToFetch = [self _contactKeysToFetchFromFields:nil];
    }
    
    NSMutableDictionary *contact = [NSMutableDictionary new];
    
    // no-op
    contact[ABI30_0_0EXContactsKeyId] = person.identifier;
    contact[ABI30_0_0EXContactsKeyContactType] = person.contactType == CNContactTypePerson ? ABI30_0_0EXContactsContactTypePerson : ABI30_0_0EXContactsContactTypeCompany;
    contact[ABI30_0_0EXContactsKeyImageAvailable] = @(person.imageDataAvailable);
    // optionals
    NSString *name = [[self class] assembleDisplayNameForContact:person];
    if ([self _fieldHasValue:name]) contact[ABI30_0_0EXContactsKeyName] = name;
    if ([self _fieldHasValue:person.givenName]) contact[ABI30_0_0EXContactsKeyFirstName] = person.givenName;
    if ([self _fieldHasValue:person.middleName]) contact[ABI30_0_0EXContactsKeyMiddleName] = person.middleName;
    if ([self _fieldHasValue:person.familyName]) contact[ABI30_0_0EXContactsKeyLastName] = person.familyName;
    if ([self _fieldHasValue:person.previousFamilyName]) contact[ABI30_0_0EXContactsKeyMaidenName] = person.previousFamilyName;
    
    if ([self _fieldHasValue:person.nickname]) contact[ABI30_0_0EXContactsKeyNickname] = person.nickname;
    if ([self _fieldHasValue:person.organizationName]) contact[ABI30_0_0EXContactsKeyCompany] = person.organizationName;
    if ([self _fieldHasValue:person.jobTitle]) contact[ABI30_0_0EXContactsKeyJobTitle] = person.jobTitle;
    if ([self _fieldHasValue:person.departmentName]) contact[ABI30_0_0EXContactsKeyDepartment] = person.departmentName;
    
    if ([keysToFetch containsObject:CNContactNamePrefixKey] &&
        [self _fieldHasValue:person.namePrefix]) {
        contact[ABI30_0_0EXContactsKeyNamePrefix] = person.namePrefix;
    }
    if ([keysToFetch containsObject:CNContactNameSuffixKey] &&
        [self _fieldHasValue:person.nameSuffix]) {
        contact[ABI30_0_0EXContactsKeyNameSuffix] = person.nameSuffix;
    }
    if ([keysToFetch containsObject:CNContactPhoneticGivenNameKey] &&
        [self _fieldHasValue:person.phoneticGivenName]) {
        contact[ABI30_0_0EXContactsKeyPhoneticFirstName] = person.phoneticGivenName;
    }
    if ([keysToFetch containsObject:CNContactPhoneticMiddleNameKey] &&
        [self _fieldHasValue:person.phoneticMiddleName]) {
        contact[ABI30_0_0EXContactsKeyPhoneticMiddleName] = person.phoneticMiddleName;
    }
    if ([keysToFetch containsObject:CNContactPhoneticFamilyNameKey] &&
        [self _fieldHasValue:person.phoneticFamilyName]) {
        contact[ABI30_0_0EXContactsKeyPhoneticLastName] = person.phoneticFamilyName;
    }
    if ([keysToFetch containsObject:CNContactNoteKey] && [self _fieldHasValue:person.note]) {
        contact[ABI30_0_0EXContactsKeyNote] = person.note;
    }
    
    // complex types
    if (person.imageDataAvailable) {
        // This is the raw image used for a contact - no crop
        if ([keysToFetch containsObject:CNContactImageDataKey]) {
            contact[ABI30_0_0EXContactsKeyRawImage] = [self _writeDataToUri:person.identifier
                                                              data:person.imageData
                                                          imageKey:CNContactImageDataKey
                                                     includeBase64:[keysToFetch containsObject:ABI30_0_0EXContactsKeyRawImageBase64]
                                                          rejecter:reject
                                              ];
        }
        // This is the edited / cropped image used for the contact.
        // https://developer.apple.com/documentation/contacts/cncontact/1402903-thumbnailimagedata?language=objc
        // 320x320
        if ([keysToFetch containsObject:CNContactThumbnailImageDataKey]) {
            contact[ABI30_0_0EXContactsKeyImage] = [self _writeDataToUri:person.identifier
                                                           data:person.thumbnailImageData
                                                       imageKey:CNContactThumbnailImageDataKey
                                                  includeBase64:[keysToFetch containsObject:ABI30_0_0EXContactsKeyImageBase64]
                                                       rejecter:reject
                                           ];
        }
    }
    if ([keysToFetch containsObject:CNContactBirthdayKey]) {
        contact[ABI30_0_0EXContactsKeyBirthday] = [[self class] birthdayForContact:person.birthday];
    }
    if ([keysToFetch containsObject:CNContactNonGregorianBirthdayKey]) {
        contact[ABI30_0_0EXContactsKeyNonGregorianBirthday] = [[self class] birthdayForContact:person.nonGregorianBirthday];
    }
    if ([keysToFetch containsObject:CNContactPostalAddressesKey]) {
        NSArray *values = [[self class] addressesForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyAddresses] = values;
    }
    if ([keysToFetch containsObject:CNContactPhoneNumbersKey]) {
        NSArray *values = [[self class] phoneNumbersForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyPhoneNumbers] = values;
    }
    if ([keysToFetch containsObject:CNContactEmailAddressesKey]) {
        NSArray *values = [[self class] emailsForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyEmails] = values;
    }
    if ([keysToFetch containsObject:CNContactSocialProfilesKey]) {
        NSArray *values = [[self class] socialProfilesForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeySocialProfiles] = values;
    }
    if ([keysToFetch containsObject:CNContactInstantMessageAddressesKey]) {
        NSArray *values = [[self class] instantMessageAddressesForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyInstantMessageAddresses] = values;
    }
    if ([keysToFetch containsObject:CNContactUrlAddressesKey]) {
        NSArray *values = [[self class] urlsForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyUrlAddresses] = values;
    }
    if ([keysToFetch containsObject:CNContactDatesKey]) {
        NSArray *values = [[self class] datesForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyDates] = values;
    }
    if ([keysToFetch containsObject:CNContactRelationsKey]) {
        NSArray *values = [[self class] relationsForContact:person];
        if (values.count > 0) contact[ABI30_0_0EXContactsKeyRelationships] = values;
    }
    
    return contact;
}

- (void)_mutateContact:(CNMutableContact *)contact
              withData:(NSDictionary *)data
              resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
              rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    if (data[ABI30_0_0EXContactsKeyFirstName]) contact.givenName = data[ABI30_0_0EXContactsKeyFirstName];
    if (data[ABI30_0_0EXContactsKeyLastName]) contact.familyName = data[ABI30_0_0EXContactsKeyLastName];
    if (data[ABI30_0_0EXContactsKeyMiddleName]) contact.middleName = data[ABI30_0_0EXContactsKeyMiddleName];
    if (data[ABI30_0_0EXContactsKeyMaidenName]) contact.previousFamilyName = data[ABI30_0_0EXContactsKeyMaidenName];
    if (data[ABI30_0_0EXContactsKeyNickname]) contact.nickname = data[ABI30_0_0EXContactsKeyNickname];
    if (data[ABI30_0_0EXContactsKeyCompany]) contact.organizationName = data[ABI30_0_0EXContactsKeyCompany];
    if (data[ABI30_0_0EXContactsKeyJobTitle]) contact.jobTitle = data[ABI30_0_0EXContactsKeyJobTitle];
    if (data[ABI30_0_0EXContactsKeyDepartment]) contact.departmentName = data[ABI30_0_0EXContactsKeyDepartment];
    if (data[ABI30_0_0EXContactsKeyNamePrefix]) contact.namePrefix = data[ABI30_0_0EXContactsKeyNamePrefix];
    if (data[ABI30_0_0EXContactsKeyNameSuffix]) contact.nameSuffix = data[ABI30_0_0EXContactsKeyNameSuffix];
    if (data[ABI30_0_0EXContactsKeyPhoneticFirstName]) contact.phoneticGivenName = data[ABI30_0_0EXContactsKeyPhoneticFirstName];
    if (data[ABI30_0_0EXContactsKeyPhoneticMiddleName]) contact.phoneticMiddleName = data[ABI30_0_0EXContactsKeyPhoneticMiddleName];
    if (data[ABI30_0_0EXContactsKeyPhoneticLastName]) contact.phoneticFamilyName = data[ABI30_0_0EXContactsKeyPhoneticLastName];
    if (data[ABI30_0_0EXContactsKeyNote]) contact.note = data[ABI30_0_0EXContactsKeyNote];
    
    contact.birthday = [ABI30_0_0EXContacts decodeBirthday:data[ABI30_0_0EXContactsKeyBirthday] contact:contact];
    
    if (data[ABI30_0_0EXContactsKeyNonGregorianBirthday]) {
        NSDictionary *birthday = data[ABI30_0_0EXContactsKeyNonGregorianBirthday];
        NSString *identifier = birthday[@"format"];
        if ([identifier isEqualToString:@"hebrew"] || [identifier isEqualToString:@"islamic"] || [identifier isEqualToString:@"chinese"]) {
            // TODO: Evan: Apple API broken.
            //      contact.nonGregorianBirthday = [ABI30_0_0EXContacts decodeBirthday:data[@"nonGregorianBirthday"] contact:contact];
        }
    }
    
    if (data[ABI30_0_0EXContactsKeyContactType]) {
        NSString *contactType = data[ABI30_0_0EXContactsKeyContactType];
        if ([contactType isEqualToString:ABI30_0_0EXContactsContactTypePerson]) {
            contact.contactType = CNContactTypePerson;
        } else if ([contactType isEqualToString:ABI30_0_0EXContactsContactTypeCompany]) {
            contact.contactType = CNContactTypeOrganization;
        }
    }
    
    NSMutableArray *postalAddresses = [ABI30_0_0EXContacts decodeAddresses:data[ABI30_0_0EXContactsKeyAddresses]];
    if (postalAddresses) contact.postalAddresses = postalAddresses;
    
    NSMutableArray *phoneNumbers = [ABI30_0_0EXContacts decodePhoneNumbers:data[ABI30_0_0EXContactsKeyPhoneNumbers]];
    if (phoneNumbers) contact.phoneNumbers = phoneNumbers;
    
    NSMutableArray *emails = [ABI30_0_0EXContacts decodeEmailAddresses:data[ABI30_0_0EXContactsKeyEmails]];
    if (emails) contact.emailAddresses = emails;
    
    NSMutableArray *socialProfiles = [ABI30_0_0EXContacts decodeSocialProfiles:data[ABI30_0_0EXContactsKeySocialProfiles]];
    if (socialProfiles) contact.socialProfiles = socialProfiles;
    
    NSMutableArray *instantMessageAddresses = [ABI30_0_0EXContacts decodeInstantMessageAddresses:data[ABI30_0_0EXContactsKeyInstantMessageAddresses]];
    if (instantMessageAddresses) contact.instantMessageAddresses = instantMessageAddresses;
    
    NSMutableArray *urlAddresses = [ABI30_0_0EXContacts decodeUrlAddresses:data[ABI30_0_0EXContactsKeyUrlAddresses]];
    if (urlAddresses) contact.urlAddresses = urlAddresses;
    
    NSMutableArray *dates = [ABI30_0_0EXContacts decodeDates:data[ABI30_0_0EXContactsKeyDates]];
    if (dates) contact.dates = dates;
    
    NSMutableArray *relationships = [ABI30_0_0EXContacts decodeRelationships:data[ABI30_0_0EXContactsKeyRelationships]];
    if (relationships) contact.contactRelations = relationships;
    
    if (data[ABI30_0_0EXContactsKeyImage]) {
        NSData *imageData;
        if ([data[ABI30_0_0EXContactsKeyImage] isKindOfClass:[NSString class]]) {
            imageData = [self _imageDataForPath:data[ABI30_0_0EXContactsKeyImage] rejecter:reject];
        } else if ([data[ABI30_0_0EXContactsKeyImage] isKindOfClass:[NSDictionary class]]) {
            imageData = [self _imageDataForPath:data[ABI30_0_0EXContactsKeyImage][@"uri"] rejecter:reject];
        }
        if (imageData) {
            contact.imageData = imageData;
        }
    }
}

- (nullable NSData *)_imageDataForPath:(NSString *)uri
                              rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSURL *url = [NSURL URLWithString:uri];
    NSString *path = [url.path stringByStandardizingPath];
    
    if (!self.fileSystem) {
        reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
        return nil;
    } else if (!([self.fileSystem permissionsForURI:url] & ABI30_0_0EXFileSystemPermissionRead)) {
        reject(@"E_MISSING_PERMISSION", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
        return nil;
    }
    
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];
    if (image == nil) {
        reject(@"E_CANNOT_OPEN", @"Could not open provided image", nil);
        return nil;
    }
    
    return UIImagePNGRepresentation(image);
}

- (nullable CNContactStore *)_getContactStoreOrReject:(ABI30_0_0EXPromiseRejectBlock)reject {
    if(!_contactStore) {
        CNContactStore* store = [[CNContactStore alloc] init];
        
        if(!store.defaultContainerIdentifier) {
            //APPL says: If the caller lacks Contacts authorization or an error occurs, nil is returned.
            
            NSDictionary *cameraPermissions = [_permissionsManager getPermissionsForResource:@"contacts"];
            if (![cameraPermissions[@"status"] isEqualToString:@"granted"]) {
                reject(@"E_MISSING_PERMISSION", @"Missing contacts permission.", nil);
                return nil;
            } else {
                [ABI30_0_0EXContacts rejectWithError:@"An unknown error has occurred. No default container identifier." error:nil rejecter:reject];
                return nil;
            }
        }
        
        _contactStore = store;
    }
    
    return _contactStore;
}

- (nullable NSDictionary *)_writeDataToUri:(NSString *)userId data:(NSData *)data imageKey:(NSString *)imageKey includeBase64:(BOOL)includeBase64 rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    
    if (!self.fileSystem) {
        reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
        return nil;
    }
    
    UIImage *image = [[UIImage alloc] initWithData:data];
    NSString *extension = @".png";
    //TODO: Evan: Do we need to check to make sure we have write permission for FILE_SYSTEM?
    NSString *directory = [self.fileSystem.cachesDirectory stringByAppendingPathComponent:@"Contacts"];
    [self.fileSystem ensureDirExistsWithPath:directory];
    //TODO: Evan: Do we need to delete this value first? Should we add an expiration since contact images don't change often?
    NSString *fileName = [[NSString stringWithFormat:@"%@-%@", userId, imageKey] stringByAppendingString:extension];
    NSString *newPath = [directory stringByAppendingPathComponent:fileName];
    //TODO: Evan: Can this fail? Should we handle errors here?
    [data writeToFile:newPath atomically:YES];
    NSURL *fileURL = [NSURL fileURLWithPath:newPath];
    NSString *filePath = [fileURL absoluteString];
    NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                      @"uri": filePath,
                                                                                      @"width": @(CGImageGetWidth(image.CGImage)),
                                                                                      @"height": @(CGImageGetHeight(image.CGImage))
                                                                                      }];
    
    if (includeBase64) {
        //TODO: Evan: Make sure this can be decoded using ReactABI30_0_0Native.ImageStore
        NSString *base64String = [data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed];
        response[@"base64"] = [NSString stringWithFormat:@"%@%@", @"data:image/png;base64,", base64String];
    }
    
    return response;
}

- (nonnull NSArray <id<CNKeyDescriptor>> *)_contactKeysToFetchFromFields:(NSArray *)fields
{
    const NSDictionary *mapping = @{
                                    @"id": CNContactIdentifierKey,
                                    @"contactType": CNContactTypeKey,
                                    @"addresses": CNContactPostalAddressesKey,
                                    @"phoneNumbers": CNContactPhoneNumbersKey,
                                    @"emails": CNContactEmailAddressesKey,
                                    @"firstName": CNContactGivenNameKey,
                                    @"middleName": CNContactMiddleNameKey,
                                    @"lastName": CNContactFamilyNameKey,
                                    @"namePrefix": CNContactNamePrefixKey,
                                    @"nameSuffix": CNContactNameSuffixKey,
                                    @"nickname": CNContactNicknameKey,
                                    @"phoneticFirstName": CNContactPhoneticGivenNameKey,
                                    @"phoneticMiddleName": CNContactPhoneticMiddleNameKey,
                                    @"phoneticLastName": CNContactPhoneticFamilyNameKey,
                                    @"maidenName": CNContactPreviousFamilyNameKey,
                                    @"birthday": CNContactBirthdayKey,
                                    @"nonGregorianBirthday": CNContactNonGregorianBirthdayKey,
                                    @"imageAvailable": CNContactImageDataAvailableKey,
                                    @"rawImage": CNContactImageDataKey,
                                    @"image": CNContactThumbnailImageDataKey,
                                    @"note": CNContactNoteKey,
                                    @"company": CNContactOrganizationNameKey,
                                    @"jobTitle": CNContactJobTitleKey,
                                    @"department": CNContactDepartmentNameKey,
                                    @"socialProfiles": CNContactSocialProfilesKey,
                                    @"instantMessageAddresses": CNContactInstantMessageAddressesKey,
                                    @"urlAddresses": CNContactUrlAddressesKey,
                                    @"dates": CNContactDatesKey,
                                    @"relationships": CNContactRelationsKey,
                                    @"name": [CNContactFormatter descriptorForRequiredKeysForStyle:CNContactFormatterStyleFullName],
                                    @"editor": [CNContactViewController descriptorForRequiredKeys],
                                    };
    
    NSMutableArray <id<CNKeyDescriptor>> *results = [NSMutableArray arrayWithCapacity:fields.count];
    
    if (fields == nil) {
        // If no fields are defined, get all fields.
        fields = [mapping allKeys];
    } else {
        // Add default fields to our user defined fields.
        fields = [fields arrayByAddingObjectsFromArray:@[
                                                         ABI30_0_0EXContactsKeyId,
                                                         ABI30_0_0EXContactsKeyContactType,
                                                         ABI30_0_0EXContactsKeyName,
                                                         ABI30_0_0EXContactsKeyFirstName,
                                                         ABI30_0_0EXContactsKeyMiddleName,
                                                         ABI30_0_0EXContactsKeyLastName,
                                                         ABI30_0_0EXContactsKeyMaidenName,
                                                         ABI30_0_0EXContactsKeyNickname,
                                                         ABI30_0_0EXContactsKeyCompany,
                                                         ABI30_0_0EXContactsKeyJobTitle,
                                                         ABI30_0_0EXContactsKeyDepartment,
                                                         ABI30_0_0EXContactsKeyImageAvailable
                                                         ]];
        // Remove duplicates
        fields = [[NSSet setWithArray:fields] allObjects];
    }
    
    for (NSString *field in fields) {
        if (mapping[field]) {
            [results addObject:mapping[field]];
        } else {
            [results addObject:field];
        }
    }

    return results;
}

#pragma mark - CNContactViewControllerDelegate

- (void)contactViewController:(CNContactViewController *)viewController didCompleteWithContact:(CNContact *)contact
{
    [viewController dismissViewControllerAnimated:YES completion:nil];
}

#pragma mark - Error Handling

+ (void)rejectWithError:(NSString *)message error:(nullable NSError *)error rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSString *errorMessage = message;
    if (error != nil) {
        errorMessage = [NSString stringWithFormat:@"%@ | %@", errorMessage, [ABI30_0_0EXContacts stringWithError:error]];
    }
    reject(@"E_CONTACTS", errorMessage, error);
}

+ (NSString *)stringWithError:(NSError *)error
{
    //TODO:Bacon: See if new line works here.
    return [NSString stringWithFormat:@"Description: %@, Reason: %@, Options: %@, Suggestion: %@", error.localizedDescription, error.localizedFailureReason, error.localizedRecoveryOptions, error.localizedRecoverySuggestion];
}

#pragma mark - CNContactStore

+ (CNContactFetchRequest *)buildFetchRequest:(NSString *)sort keysToFetch:(NSArray *)keysToFetch
{
    CNContactFetchRequest *fetchRequest = [[CNContactFetchRequest alloc] initWithKeysToFetch:keysToFetch];
    NSDictionary *sortOrders = @{
                                 @"userDefault": @(CNContactSortOrderUserDefault),
                                 @"firstName": @(CNContactSortOrderGivenName),
                                 @"lastName":@(CNContactSortOrderFamilyName),
                                 @"none":@(CNContactSortOrderNone)
                                 };
    if (sortOrders[sort]) {
        fetchRequest.sortOrder = (CNContactSortOrder)sortOrders[sort];
    }
    
    return fetchRequest;
}

+ (BOOL)executeSaveRequest:(CNSaveRequest *)saveRequest contactStore:(CNContactStore *)contactStore resolver:(ABI30_0_0EXPromiseResolveBlock)resolve rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSError *error;
    [contactStore executeSaveRequest:saveRequest error:&error];
    
    if (error) {
        [ABI30_0_0EXContacts rejectWithError:@"Failed to execute save request" error:error rejecter:reject];
        return false;
    } else if (resolve) {
        resolve(nil);
    }
    return true;
}

+ (NSString *)identifierFromData:(NSDictionary *)data rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSString *identifier = [data valueForKey:CNContactIdentifierKey];
    if (!identifier) {
        [ABI30_0_0EXContacts rejectWithError:@"Failed to provide a contact identifier" error:nil rejecter:reject];
        return nil;
    }
    return identifier;
}

+ (CNMutableContact *)getContactWithId:(NSString *)identifier contactStore:(CNContactStore *)contactStore keysToFetch:(NSArray<id<CNKeyDescriptor> > *)keys rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSError *error;
    
    CNMutableContact *contact = [[contactStore unifiedContactWithIdentifier:identifier keysToFetch:keys error:&error] mutableCopy];
    if (error) {
        [ABI30_0_0EXContacts rejectWithError:[NSString stringWithFormat:@"Failed to get contact with id: %@", identifier] error:error rejecter:reject];
    } else if (!contact) {
        [ABI30_0_0EXContacts rejectWithError:[NSString stringWithFormat:@"Unexpected error: couldn't find contact with id: %@", identifier] error:error rejecter:reject];
    }
    return contact;
}

+ (NSArray<CNGroup *> *)getGroupsWithData:(NSDictionary *)data contactStore:(CNContactStore *)contactStore rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSPredicate *predicate;
    if (data[ABI30_0_0EXContactsOptionContainerId]) {
        predicate = [CNGroup predicateForGroupsInContainerWithIdentifier:data[ABI30_0_0EXContactsOptionContainerId]];
    } else if (data[ABI30_0_0EXContactsOptionGroupId]) {
        predicate = [CNGroup predicateForGroupsWithIdentifiers:[ABI30_0_0EXContacts _ensureArray:data[ABI30_0_0EXContactsOptionGroupId]]];
    }
    
    NSError *error;
    NSArray<CNGroup *> *groups = [contactStore groupsMatchingPredicate:predicate error:&error];
    if (error) {
        [ABI30_0_0EXContacts rejectWithError:@"Failed to get groups" error:error rejecter:reject];
        return nil;
    }
    return groups;
}

- (nullable CNGroup *)_groupWithId:(NSString *)identifier contactStore:(CNContactStore *)contactStore rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSPredicate *predicate = [CNGroup predicateForGroupsWithIdentifiers:@[identifier]];
    NSError *error;
    NSArray<CNGroup *> *groups = [contactStore groupsMatchingPredicate:predicate error:&error];
    if (error || groups.count == 0) {
        [ABI30_0_0EXContacts rejectWithError:[NSString stringWithFormat:@"Failed to get group for id: %@", identifier] error:error rejecter:reject];
        return nil;
    }
    return groups[0];
}

- (nullable NSArray<NSDictionary *> *)_groupsWithName:(NSString *)name contactStore:(CNContactStore *)contactStore rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSError *error;
    NSArray<CNGroup *> *groups = [contactStore groupsMatchingPredicate:nil error:&error];
    if (error) {
        [ABI30_0_0EXContacts rejectWithError:[NSString stringWithFormat:@"Failed to get group for name: %@", name] error:error rejecter:reject];
        return nil;
    } else if (groups.count == 0) {
        return nil;
    }
    NSMutableArray *response = [[NSMutableArray alloc] init];
    
    for (CNGroup *group in groups) {
        if ([name isEqualToString:group.name]) {
            [response addObject:[[self class] encodeGroup:group]];
        }
    }
    return response;
}

- (nullable CNContact *)_contactWithId:(NSString *)identifier contactStore:(CNContactStore *)contactStore rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
    NSError *error;
    CNContact *contact = [contactStore unifiedContactWithIdentifier:identifier keysToFetch:@[[CNContactViewController descriptorForRequiredKeys]] error:&error];
    if (error) {
        [ABI30_0_0EXContacts rejectWithError:@"Failed to unify contact" error:error rejecter:reject];
        return nil;
    }
    return contact;
}

- (NSDictionary *)_fetchContactData:(NSDictionary *)options contactStore:(CNContactStore *)contactStore keysToFetch:(NSArray<NSString *> *)keysToFetch
{
    NSPredicate *predicate;
    
    if (options[@"id"]) {
        NSArray<NSString *> *contactIds = [ABI30_0_0EXContacts _ensureArray:options[@"id"]];
        predicate = [CNContact predicateForContactsWithIdentifiers:contactIds];
    } else if (options[@"name"]) {
        predicate = [CNContact predicateForContactsMatchingName:options[@"name"]];
    } else if (options[ABI30_0_0EXContactsOptionGroupId]) {
        predicate = [CNContact predicateForContactsInGroupWithIdentifier:options[ABI30_0_0EXContactsOptionGroupId]];
    } else if (options[ABI30_0_0EXContactsOptionContainerId]) {
        predicate = [CNContact predicateForContactsInContainerWithIdentifier:options[ABI30_0_0EXContactsOptionContainerId]];
    }
    NSDictionary *payload = [self _queryContactsWithPredicate:predicate
                                                  keysToFetch:keysToFetch
                                                 contactStore:contactStore
                                                      options:options];
    return payload;
}

+ (NSArray *)_ensureArray:(id)input
{
    NSArray *ids;
    if ([input isKindOfClass:[NSString class]]) {
        ids = @[(NSString *)input];
    } else if ([input isKindOfClass:[NSArray class]]) {
        ids = (NSArray *)input;
    }
    return ids;
}

@end
