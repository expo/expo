// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXContacts/EXContacts.h>
#import <EXContacts/EXContactsViewController.h>
#import <EXContacts/EXContacts+Serialization.h>

#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXCore/EXUtilities.h>

#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>

static NSString *const EXContactsOptionContainerId = @"containerId";
static NSString *const EXContactsOptionGroupId = @"groupId";
static NSString *const EXContactsOptionGroupName = @"groupName";
static NSString *const EXContactsOptionContactId = @"contactId";
static NSString *const EXContactsOptionHasNextPage = @"hasNextPage";
static NSString *const EXContactsOptionHasPreviousPage = @"hasPreviousPage";
static NSString *const EXContactsOptionPageOffset = @"pageOffset";
static NSString *const EXContactsOptionPageSize = @"pageSize";
static NSString *const EXContactsOptionSort = @"sort";
static NSString *const EXContactsOptionRawContacts = @"rawContacts";
static NSString *const EXContactsOptionTotal = @"total";

static NSString *const EXContactsOptionData = @"data";

static NSString *const EXContactsContactTypePerson = @"person";
static NSString *const EXContactsContactTypeCompany = @"company";

static NSString *const EXContactsKeyId = @"id";
static NSString *const EXContactsKeyContactType = @"contactType";
static NSString *const EXContactsKeyAddresses = @"addresses";
static NSString *const EXContactsKeyPhoneNumbers = @"phoneNumbers";
static NSString *const EXContactsKeyEmails = @"emails";
static NSString *const EXContactsKeyFirstName = @"firstName";
static NSString *const EXContactsKeyMiddleName = @"middleName";
static NSString *const EXContactsKeyLastName = @"lastName";
static NSString *const EXContactsKeyNamePrefix = @"namePrefix";
static NSString *const EXContactsKeyNameSuffix = @"nameSuffix";
static NSString *const EXContactsKeyNickname = @"nickname";
static NSString *const EXContactsKeyPhoneticFirstName = @"phoneticFirstName";
static NSString *const EXContactsKeyPhoneticMiddleName = @"phoneticMiddleName";
static NSString *const EXContactsKeyPhoneticLastName = @"phoneticLastName";
static NSString *const EXContactsKeyMaidenName = @"maidenName";
static NSString *const EXContactsKeyBirthday = @"birthday";
static NSString *const EXContactsKeyNonGregorianBirthday = @"nonGregorianBirthday";
static NSString *const EXContactsKeyImageAvailable = @"imageAvailable";
static NSString *const EXContactsKeyRawImage = @"rawImage";
static NSString *const EXContactsKeyImage = @"image";
static NSString *const EXContactsKeyNote = @"note";
static NSString *const EXContactsKeyCompany = @"company";
static NSString *const EXContactsKeyJobTitle = @"jobTitle";
static NSString *const EXContactsKeyDepartment = @"department";
static NSString *const EXContactsKeySocialProfiles = @"socialProfiles";
static NSString *const EXContactsKeyInstantMessageAddresses = @"instantMessageAddresses";
static NSString *const EXContactsKeyUrlAddresses = @"urlAddresses";
static NSString *const EXContactsKeyDates = @"dates";
static NSString *const EXContactsKeyRelationships = @"relationships";
static NSString *const EXContactsKeyName = @"name";
static NSString *const EXContactsKeyEditor = @"editor";
static NSString *const EXContactsKeyRawImageBase64 = @"rawImageBase64";
static NSString *const EXContactsKeyImageBase64 = @"imageBase64";

@import Contacts;

@interface EXContacts () <CNContactViewControllerDelegate>

@property (nonatomic, strong) CNContactStore *contactStore;
@property (nonatomic, strong) UIViewController *presentingViewController;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXContacts

EX_EXPORT_MODULE(ExpoContacts);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
}

EX_EXPORT_METHOD_AS(getDefaultContainerIdentifierAsync,
                    getDefaultContainerIdentifierAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    
    resolve([contactStore defaultContainerIdentifier]);
}

EX_EXPORT_METHOD_AS(writeContactToFileAsync,
                    writeContactToFileAsync:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:options[@"fields"]];
    NSDictionary *payload = [self _fetchContactData:options
                                       contactStore:contactStore
                                        keysToFetch:keysToFetch
                             ];
    
    if (payload[@"error"]) {
        [EXContacts rejectWithError:@"Error while fetching contacts" error:payload[@"error"] rejecter:reject];
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
            [EXContacts rejectWithError:@"Failed to cache contacts" error:error rejecter:reject];
            return;
        }
        
        [data writeToFile:newPath atomically:YES];
        
        NSURL *fileURL = [NSURL fileURLWithPath:newPath];
        NSString *filePath = [fileURL absoluteString];
        
        resolve(filePath);
    }
}

EX_EXPORT_METHOD_AS(dismissFormAsync,
                    dismissFormAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXUtilities performSynchronouslyOnMainThread:^{
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

EX_EXPORT_METHOD_AS(presentFormAsync,
                    presentFormAsync:(NSString *)identifier
                    data:(NSDictionary *)data
                    options:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
  
  [EXUtilities performSynchronouslyOnMainThread:^{
    
        EXContactsViewController *controller;
        CNMutableContact *contact;
        
        if (identifier) {
            // Must be full contact from device
            contact = [[self _contactWithId:identifier contactStore:contactStore rejecter:reject] mutableCopy];
            if (!contact) return;
            controller = [EXContactsViewController viewControllerForContact:contact];
        } else {
            contact = [[CNMutableContact alloc] init];
            [self _mutateContact:contact withData:data resolver:resolve rejecter:reject];
            BOOL isNew = (options[@"isNew"] != nil && [options[@"isNew"] boolValue]);
            if (isNew) {
                controller = [EXContactsViewController viewControllerForNewContact:contact];
            } else {
                controller = [EXContactsViewController viewControllerForUnknownContact:contact];
            }
        }
        
        if (!controller) {
            [EXContacts rejectWithError:@"Could not build controller, invalid props" error:nil rejecter:reject];
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
        if (options[EXContactsOptionGroupId] != nil && [options[EXContactsOptionGroupId] stringValue])
            controller.parentGroup = [self _groupWithId:[options[EXContactsOptionGroupId] stringValue] contactStore:contactStore rejecter:reject];
        
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

EX_EXPORT_METHOD_AS(addExistingContactToGroupAsync,
                    addExistingContactToGroupAsync:(NSString *)identifier
                    groupId:(NSString *)groupId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:nil];
    
    CNMutableContact *contact = [EXContacts getContactWithId:identifier
                                                contactStore:contactStore
                                                 keysToFetch:keysToFetch
                                                    rejecter:reject];
    if (!contact) return;
    
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    
    [saveRequest addMember:contact toGroup:group];
    
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(addContactAsync,
                    addContactAsync:(NSDictionary *)data
                    containerId:(NSString *)containerId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
    if ([EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:nil rejecter:reject]) {
        resolve(contact.identifier);
    }
}

EX_EXPORT_METHOD_AS(updateContactAsync,
                    updateContactAsync:(NSDictionary *)updates
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    NSArray *keysToFetch = [self _contactKeysToFetchFromFields:nil];
    
    CNMutableContact *contact = [EXContacts getContactWithId:updates[@"id"]
                                                contactStore:contactStore
                                                 keysToFetch:keysToFetch
                                                    rejecter:reject];
    if (!contact) return;
    [self _mutateContact:contact withData:updates resolver:resolve rejecter:reject];
    [saveRequest updateContact:contact];
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(removeContactAsync,
                    removeContactAsync:(NSString *)identifier
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    
    NSArray *keysToFetch = @[CNContactIdentifierKey];
    
    CNMutableContact *contact = [EXContacts getContactWithId:identifier contactStore:contactStore keysToFetch:keysToFetch rejecter:reject];
    if (!contact) return;
    
    [saveRequest deleteContact:contact];
    
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(updateGroupNameAsync,
                    updateGroupNameAsync:(NSString *)name
                    groupId:(NSString *)groupId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    CNMutableGroup *mutableGroup = [group mutableCopy];
    mutableGroup.name = name;
    [saveRequest updateGroup:mutableGroup];
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(addExistingGroupToContainerAsync,
                    addExistingGroupToContainerAsync:(NSString *)groupId
                    containerId:(NSString *)containerId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNMutableGroup *group = (CNMutableGroup *)[self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    [saveRequest addGroup:group toContainerWithIdentifier:containerId];
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
    if ([EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:nil rejecter:reject]) {
        resolve([[self class] encodeGroup:group]);
    }
}

EX_EXPORT_METHOD_AS(createGroupAsync,
                    createGroupAsync:(NSString *)name
                    containerId:(NSString *)containerId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    CNMutableGroup *group = [[CNMutableGroup alloc] init];
    group.name = name;
    [saveRequest addGroup:group toContainerWithIdentifier:containerId];
    if ([EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:nil rejecter:reject]) {
        resolve(group.identifier);
    }
}

EX_EXPORT_METHOD_AS(removeContactFromGroupAsync,
                    removeContactFromGroupAsync:(NSString *)identifier
                    groupId:(NSString *)groupId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    NSArray *keysToFetch = @[CNContactIdentifierKey];
    
    CNMutableContact *contact = [EXContacts getContactWithId:identifier contactStore:contactStore keysToFetch:keysToFetch rejecter:reject];
    if (!contact) return;
    
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    CNMutableGroup *mutableGroup = [group mutableCopy];
    [saveRequest removeMember:contact fromGroup:mutableGroup];
    
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(removeGroupAsync,
                    removeGroupAsync:(NSString *)groupId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
    
    CNGroup *group = [self _groupWithId:groupId contactStore:contactStore rejecter:reject];
    if (!group) return;
    CNMutableGroup *mutableGroup = [group mutableCopy];
    [saveRequest deleteGroup:mutableGroup];
    [EXContacts executeSaveRequest:saveRequest contactStore:contactStore resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(getContainersAsync,
                    getContainersAsync:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    NSError *error;
    
    NSPredicate *predicate;
    if (options[EXContactsOptionContactId]) {
        predicate = [CNContainer predicateForContainerOfContactWithIdentifier:options[EXContactsOptionContactId]];
    } else if (options[EXContactsOptionGroupId]) {
        predicate = [CNContainer predicateForContainerOfGroupWithIdentifier:options[EXContactsOptionGroupId]];
    } else if (options[EXContactsOptionContainerId]) {
        NSArray *ids = [EXContacts _ensureArray: options[EXContactsOptionContainerId]];
        predicate = [CNContainer predicateForContainersWithIdentifiers:ids];
    }
    
    NSArray<CNContainer*> *containers = [contactStore containersMatchingPredicate:predicate error:&error];
    
    if (error) {
        [EXContacts rejectWithError:@"Error fetching containers" error:nil rejecter:reject];
        return;
    } else {
        NSMutableArray *response = [NSMutableArray new];
        for (CNContainer *container in containers) {
            [response addObject:[[self class] encodeContainer:container]];
        }
        resolve(response);
    }
}

EX_EXPORT_METHOD_AS(getGroupsAsync,
                    getGroupsAsync:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
    CNContactStore *contactStore = [self _getContactStoreOrReject:reject];
    if(!contactStore) return;
    NSMutableArray *response = [[NSMutableArray alloc] init];
    
    if (options[EXContactsOptionGroupName]) {
        NSArray<NSDictionary *> *groups = [self _groupsWithName:options[EXContactsOptionGroupName] contactStore:contactStore rejecter:reject];
        if (groups) {
            [response addObjectsFromArray:groups];
        }
    } else {
        NSArray<CNGroup *> *groups = [EXContacts getGroupsWithData:options contactStore:contactStore rejecter:reject];
        if (!groups) return;
        for (CNGroup *group in groups) {
            if (group) [response addObject: [[self class] encodeGroup:group]];
        }
    }
    
    resolve(response);
}

EX_EXPORT_METHOD_AS(getContactsAsync,
                    getContactsAsync:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
                        resolver:(EXPromiseResolveBlock)resolve
                        rejecter:(EXPromiseRejectBlock)reject
{
    if (payload[@"error"]) {
        [EXContacts rejectWithError:@"Error while fetching contacts" error:payload[@"error"] rejecter:reject];
        return;
    } else {
        NSMutableArray *response = [[NSMutableArray alloc] init];
        for (CNContact *contact in payload[EXContactsOptionData]) {
            [response addObject:[self _serializeContact:contact
                                            keysToFetch:keysToFetch
                                               rejecter:reject
                                 ]];
        }
        [payload setValue:response forKey:EXContactsOptionData];
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
    
    if (options[EXContactsOptionPageOffset] != nil && [options[EXContactsOptionPageOffset] unsignedIntegerValue]) {
        pageOffset = [options[EXContactsOptionPageOffset] unsignedIntegerValue];
    }
    
    if (options[EXContactsOptionPageSize] != nil && [options[EXContactsOptionPageSize] unsignedIntegerValue]) {
        pageSize = [options[EXContactsOptionPageSize] unsignedIntegerValue];
    }
    
    NSString *sortOrder = options[EXContactsOptionSort];
    CNContactFetchRequest *fetchRequest = [EXContacts buildFetchRequest:sortOrder keysToFetch:keysToFetch];
    fetchRequest.predicate = predicate;

    // Should the contacts be grouped by name - default is `YES`
    fetchRequest.unifyResults = YES;
    if (options[EXContactsOptionRawContacts] != nil && [options[EXContactsOptionRawContacts] boolValue]) {
        BOOL shouldReturnRawContacts = [options[EXContactsOptionRawContacts] boolValue];
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
        [payload setObject:response forKey:EXContactsOptionData];
        [payload setObject:@(hasNextPage) forKey:EXContactsOptionHasNextPage];
        [payload setObject:@(hasPreviousPage) forKey:EXContactsOptionHasPreviousPage];
        [payload setObject:@(currentIndex) forKey:EXContactsOptionTotal];
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
                           rejecter:(EXPromiseRejectBlock)reject
{
    if (keysToFetch == nil) {
        keysToFetch = [self _contactKeysToFetchFromFields:nil];
    }
    
    NSMutableDictionary *contact = [NSMutableDictionary new];
    
    // no-op
    contact[EXContactsKeyId] = person.identifier;
    contact[EXContactsKeyContactType] = person.contactType == CNContactTypePerson ? EXContactsContactTypePerson : EXContactsContactTypeCompany;
    contact[EXContactsKeyImageAvailable] = @(person.imageDataAvailable);
    // optionals
    NSString *name = [[self class] assembleDisplayNameForContact:person];
    if ([self _fieldHasValue:name]) contact[EXContactsKeyName] = name;
    if ([self _fieldHasValue:person.givenName]) contact[EXContactsKeyFirstName] = person.givenName;
    if ([self _fieldHasValue:person.middleName]) contact[EXContactsKeyMiddleName] = person.middleName;
    if ([self _fieldHasValue:person.familyName]) contact[EXContactsKeyLastName] = person.familyName;
    if ([self _fieldHasValue:person.previousFamilyName]) contact[EXContactsKeyMaidenName] = person.previousFamilyName;
    
    if ([self _fieldHasValue:person.nickname]) contact[EXContactsKeyNickname] = person.nickname;
    if ([self _fieldHasValue:person.organizationName]) contact[EXContactsKeyCompany] = person.organizationName;
    if ([self _fieldHasValue:person.jobTitle]) contact[EXContactsKeyJobTitle] = person.jobTitle;
    if ([self _fieldHasValue:person.departmentName]) contact[EXContactsKeyDepartment] = person.departmentName;
    
    if ([keysToFetch containsObject:CNContactNamePrefixKey] &&
        [self _fieldHasValue:person.namePrefix]) {
        contact[EXContactsKeyNamePrefix] = person.namePrefix;
    }
    if ([keysToFetch containsObject:CNContactNameSuffixKey] &&
        [self _fieldHasValue:person.nameSuffix]) {
        contact[EXContactsKeyNameSuffix] = person.nameSuffix;
    }
    if ([keysToFetch containsObject:CNContactPhoneticGivenNameKey] &&
        [self _fieldHasValue:person.phoneticGivenName]) {
        contact[EXContactsKeyPhoneticFirstName] = person.phoneticGivenName;
    }
    if ([keysToFetch containsObject:CNContactPhoneticMiddleNameKey] &&
        [self _fieldHasValue:person.phoneticMiddleName]) {
        contact[EXContactsKeyPhoneticMiddleName] = person.phoneticMiddleName;
    }
    if ([keysToFetch containsObject:CNContactPhoneticFamilyNameKey] &&
        [self _fieldHasValue:person.phoneticFamilyName]) {
        contact[EXContactsKeyPhoneticLastName] = person.phoneticFamilyName;
    }
    if ([keysToFetch containsObject:CNContactNoteKey] && [self _fieldHasValue:person.note]) {
        contact[EXContactsKeyNote] = person.note;
    }
    
    // complex types
    if (person.imageDataAvailable) {
        // This is the raw image used for a contact - no crop
        if ([keysToFetch containsObject:CNContactImageDataKey]) {
            contact[EXContactsKeyRawImage] = [self _writeDataToUri:person.identifier
                                                              data:person.imageData
                                                          imageKey:CNContactImageDataKey
                                                     includeBase64:[keysToFetch containsObject:EXContactsKeyRawImageBase64]
                                                          rejecter:reject
                                              ];
        }
        // This is the edited / cropped image used for the contact.
        // https://developer.apple.com/documentation/contacts/cncontact/1402903-thumbnailimagedata?language=objc
        // 320x320
        if ([keysToFetch containsObject:CNContactThumbnailImageDataKey]) {
            contact[EXContactsKeyImage] = [self _writeDataToUri:person.identifier
                                                           data:person.thumbnailImageData
                                                       imageKey:CNContactThumbnailImageDataKey
                                                  includeBase64:[keysToFetch containsObject:EXContactsKeyImageBase64]
                                                       rejecter:reject
                                           ];
        }
    }
    if ([keysToFetch containsObject:CNContactBirthdayKey]) {
        contact[EXContactsKeyBirthday] = [[self class] birthdayForContact:person.birthday];
    }
    if ([keysToFetch containsObject:CNContactNonGregorianBirthdayKey]) {
        contact[EXContactsKeyNonGregorianBirthday] = [[self class] birthdayForContact:person.nonGregorianBirthday];
    }
    if ([keysToFetch containsObject:CNContactPostalAddressesKey]) {
        NSArray *values = [[self class] addressesForContact:person];
        if (values.count > 0) contact[EXContactsKeyAddresses] = values;
    }
    if ([keysToFetch containsObject:CNContactPhoneNumbersKey]) {
        NSArray *values = [[self class] phoneNumbersForContact:person];
        if (values.count > 0) contact[EXContactsKeyPhoneNumbers] = values;
    }
    if ([keysToFetch containsObject:CNContactEmailAddressesKey]) {
        NSArray *values = [[self class] emailsForContact:person];
        if (values.count > 0) contact[EXContactsKeyEmails] = values;
    }
    if ([keysToFetch containsObject:CNContactSocialProfilesKey]) {
        NSArray *values = [[self class] socialProfilesForContact:person];
        if (values.count > 0) contact[EXContactsKeySocialProfiles] = values;
    }
    if ([keysToFetch containsObject:CNContactInstantMessageAddressesKey]) {
        NSArray *values = [[self class] instantMessageAddressesForContact:person];
        if (values.count > 0) contact[EXContactsKeyInstantMessageAddresses] = values;
    }
    if ([keysToFetch containsObject:CNContactUrlAddressesKey]) {
        NSArray *values = [[self class] urlsForContact:person];
        if (values.count > 0) contact[EXContactsKeyUrlAddresses] = values;
    }
    if ([keysToFetch containsObject:CNContactDatesKey]) {
        NSArray *values = [[self class] datesForContact:person];
        if (values.count > 0) contact[EXContactsKeyDates] = values;
    }
    if ([keysToFetch containsObject:CNContactRelationsKey]) {
        NSArray *values = [[self class] relationsForContact:person];
        if (values.count > 0) contact[EXContactsKeyRelationships] = values;
    }
    
    return contact;
}

- (void)_mutateContact:(CNMutableContact *)contact
              withData:(NSDictionary *)data
              resolver:(EXPromiseResolveBlock)resolve
              rejecter:(EXPromiseRejectBlock)reject
{
    if (data[EXContactsKeyFirstName]) contact.givenName = data[EXContactsKeyFirstName];
    if (data[EXContactsKeyLastName]) contact.familyName = data[EXContactsKeyLastName];
    if (data[EXContactsKeyMiddleName]) contact.middleName = data[EXContactsKeyMiddleName];
    if (data[EXContactsKeyMaidenName]) contact.previousFamilyName = data[EXContactsKeyMaidenName];
    if (data[EXContactsKeyNickname]) contact.nickname = data[EXContactsKeyNickname];
    if (data[EXContactsKeyCompany]) contact.organizationName = data[EXContactsKeyCompany];
    if (data[EXContactsKeyJobTitle]) contact.jobTitle = data[EXContactsKeyJobTitle];
    if (data[EXContactsKeyDepartment]) contact.departmentName = data[EXContactsKeyDepartment];
    if (data[EXContactsKeyNamePrefix]) contact.namePrefix = data[EXContactsKeyNamePrefix];
    if (data[EXContactsKeyNameSuffix]) contact.nameSuffix = data[EXContactsKeyNameSuffix];
    if (data[EXContactsKeyPhoneticFirstName]) contact.phoneticGivenName = data[EXContactsKeyPhoneticFirstName];
    if (data[EXContactsKeyPhoneticMiddleName]) contact.phoneticMiddleName = data[EXContactsKeyPhoneticMiddleName];
    if (data[EXContactsKeyPhoneticLastName]) contact.phoneticFamilyName = data[EXContactsKeyPhoneticLastName];
    if (data[EXContactsKeyNote]) contact.note = data[EXContactsKeyNote];
    
    contact.birthday = [EXContacts decodeBirthday:data[EXContactsKeyBirthday] contact:contact];
    
    if (data[EXContactsKeyNonGregorianBirthday]) {
        NSDictionary *birthday = data[EXContactsKeyNonGregorianBirthday];
        NSString *identifier = birthday[@"format"];
        if ([identifier isEqualToString:@"hebrew"] || [identifier isEqualToString:@"islamic"] || [identifier isEqualToString:@"chinese"]) {
            // TODO: Evan: Apple API broken.
            //      contact.nonGregorianBirthday = [EXContacts decodeBirthday:data[@"nonGregorianBirthday"] contact:contact];
        }
    }
    
    if (data[EXContactsKeyContactType]) {
        NSString *contactType = data[EXContactsKeyContactType];
        if ([contactType isEqualToString:EXContactsContactTypePerson]) {
            contact.contactType = CNContactTypePerson;
        } else if ([contactType isEqualToString:EXContactsContactTypeCompany]) {
            contact.contactType = CNContactTypeOrganization;
        }
    }
    
    NSMutableArray *postalAddresses = [EXContacts decodeAddresses:data[EXContactsKeyAddresses]];
    if (postalAddresses) contact.postalAddresses = postalAddresses;
    
    NSMutableArray *phoneNumbers = [EXContacts decodePhoneNumbers:data[EXContactsKeyPhoneNumbers]];
    if (phoneNumbers) contact.phoneNumbers = phoneNumbers;
    
    NSMutableArray *emails = [EXContacts decodeEmailAddresses:data[EXContactsKeyEmails]];
    if (emails) contact.emailAddresses = emails;
    
    NSMutableArray *socialProfiles = [EXContacts decodeSocialProfiles:data[EXContactsKeySocialProfiles]];
    if (socialProfiles) contact.socialProfiles = socialProfiles;
    
    NSMutableArray *instantMessageAddresses = [EXContacts decodeInstantMessageAddresses:data[EXContactsKeyInstantMessageAddresses]];
    if (instantMessageAddresses) contact.instantMessageAddresses = instantMessageAddresses;
    
    NSMutableArray *urlAddresses = [EXContacts decodeUrlAddresses:data[EXContactsKeyUrlAddresses]];
    if (urlAddresses) contact.urlAddresses = urlAddresses;
    
    NSMutableArray *dates = [EXContacts decodeDates:data[EXContactsKeyDates]];
    if (dates) contact.dates = dates;
    
    NSMutableArray *relationships = [EXContacts decodeRelationships:data[EXContactsKeyRelationships]];
    if (relationships) contact.contactRelations = relationships;
    
    if (data[EXContactsKeyImage]) {
        NSData *imageData;
        if ([data[EXContactsKeyImage] isKindOfClass:[NSString class]]) {
            imageData = [self _imageDataForPath:data[EXContactsKeyImage] rejecter:reject];
        } else if ([data[EXContactsKeyImage] isKindOfClass:[NSDictionary class]]) {
            imageData = [self _imageDataForPath:data[EXContactsKeyImage][@"uri"] rejecter:reject];
        }
        if (imageData) {
            contact.imageData = imageData;
        }
    }
}

- (nullable NSData *)_imageDataForPath:(NSString *)uri
                              rejecter:(EXPromiseRejectBlock)reject
{
    NSURL *url = [NSURL URLWithString:uri];
    NSString *path = [url.path stringByStandardizingPath];
    
    if (!self.fileSystem) {
        reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
        return nil;
    } else if (!([self.fileSystem permissionsForURI:url] & EXFileSystemPermissionRead)) {
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

- (nullable CNContactStore *)_getContactStoreOrReject:(EXPromiseRejectBlock)reject {
    if(!_contactStore) {
        CNContactStore* store = [[CNContactStore alloc] init];
        
        if(!store.defaultContainerIdentifier) {
            //APPL says: If the caller lacks Contacts authorization or an error occurs, nil is returned.
            
            NSDictionary *cameraPermissions = [_permissionsManager getPermissionsForResource:@"contacts"];
            if (![cameraPermissions[@"status"] isEqualToString:@"granted"]) {
                reject(@"E_MISSING_PERMISSION", @"Missing contacts permission.", nil);
                return nil;
            } else {
                [EXContacts rejectWithError:@"An unknown error has occurred. No default container identifier." error:nil rejecter:reject];
                return nil;
            }
        }
        
        _contactStore = store;
    }
    
    return _contactStore;
}

- (nullable NSDictionary *)_writeDataToUri:(NSString *)userId data:(NSData *)data imageKey:(NSString *)imageKey includeBase64:(BOOL)includeBase64 rejecter:(EXPromiseRejectBlock)reject
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
        //TODO: Evan: Make sure this can be decoded using ReactNative.ImageStore
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
                                                         EXContactsKeyId,
                                                         EXContactsKeyContactType,
                                                         EXContactsKeyName,
                                                         EXContactsKeyFirstName,
                                                         EXContactsKeyMiddleName,
                                                         EXContactsKeyLastName,
                                                         EXContactsKeyMaidenName,
                                                         EXContactsKeyNickname,
                                                         EXContactsKeyCompany,
                                                         EXContactsKeyJobTitle,
                                                         EXContactsKeyDepartment,
                                                         EXContactsKeyImageAvailable
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

+ (void)rejectWithError:(NSString *)message error:(nullable NSError *)error rejecter:(EXPromiseRejectBlock)reject
{
    NSString *errorMessage = message;
    if (error != nil) {
        errorMessage = [NSString stringWithFormat:@"%@ | %@", errorMessage, [EXContacts stringWithError:error]];
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

+ (BOOL)executeSaveRequest:(CNSaveRequest *)saveRequest contactStore:(CNContactStore *)contactStore resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
    NSError *error;
    [contactStore executeSaveRequest:saveRequest error:&error];
    
    if (error) {
        [EXContacts rejectWithError:@"Failed to execute save request" error:error rejecter:reject];
        return false;
    } else if (resolve) {
        resolve(nil);
    }
    return true;
}

+ (NSString *)identifierFromData:(NSDictionary *)data rejecter:(EXPromiseRejectBlock)reject
{
    NSString *identifier = [data valueForKey:CNContactIdentifierKey];
    if (!identifier) {
        [EXContacts rejectWithError:@"Failed to provide a contact identifier" error:nil rejecter:reject];
        return nil;
    }
    return identifier;
}

+ (CNMutableContact *)getContactWithId:(NSString *)identifier contactStore:(CNContactStore *)contactStore keysToFetch:(NSArray<id<CNKeyDescriptor> > *)keys rejecter:(EXPromiseRejectBlock)reject
{
    NSError *error;
    
    CNMutableContact *contact = [[contactStore unifiedContactWithIdentifier:identifier keysToFetch:keys error:&error] mutableCopy];
    if (error) {
        [EXContacts rejectWithError:[NSString stringWithFormat:@"Failed to get contact with id: %@", identifier] error:error rejecter:reject];
    } else if (!contact) {
        [EXContacts rejectWithError:[NSString stringWithFormat:@"Unexpected error: couldn't find contact with id: %@", identifier] error:error rejecter:reject];
    }
    return contact;
}

+ (NSArray<CNGroup *> *)getGroupsWithData:(NSDictionary *)data contactStore:(CNContactStore *)contactStore rejecter:(EXPromiseRejectBlock)reject
{
    NSPredicate *predicate;
    if (data[EXContactsOptionContainerId]) {
        predicate = [CNGroup predicateForGroupsInContainerWithIdentifier:data[EXContactsOptionContainerId]];
    } else if (data[EXContactsOptionGroupId]) {
        predicate = [CNGroup predicateForGroupsWithIdentifiers:[EXContacts _ensureArray:data[EXContactsOptionGroupId]]];
    }
    
    NSError *error;
    NSArray<CNGroup *> *groups = [contactStore groupsMatchingPredicate:predicate error:&error];
    if (error) {
        [EXContacts rejectWithError:@"Failed to get groups" error:error rejecter:reject];
        return nil;
    }
    return groups;
}

- (nullable CNGroup *)_groupWithId:(NSString *)identifier contactStore:(CNContactStore *)contactStore rejecter:(EXPromiseRejectBlock)reject
{
    NSPredicate *predicate = [CNGroup predicateForGroupsWithIdentifiers:@[identifier]];
    NSError *error;
    NSArray<CNGroup *> *groups = [contactStore groupsMatchingPredicate:predicate error:&error];
    if (error || groups.count == 0) {
        [EXContacts rejectWithError:[NSString stringWithFormat:@"Failed to get group for id: %@", identifier] error:error rejecter:reject];
        return nil;
    }
    return groups[0];
}

- (nullable NSArray<NSDictionary *> *)_groupsWithName:(NSString *)name contactStore:(CNContactStore *)contactStore rejecter:(EXPromiseRejectBlock)reject
{
    NSError *error;
    NSArray<CNGroup *> *groups = [contactStore groupsMatchingPredicate:nil error:&error];
    if (error) {
        [EXContacts rejectWithError:[NSString stringWithFormat:@"Failed to get group for name: %@", name] error:error rejecter:reject];
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

- (nullable CNContact *)_contactWithId:(NSString *)identifier contactStore:(CNContactStore *)contactStore rejecter:(EXPromiseRejectBlock)reject
{
    NSError *error;
    CNContact *contact = [contactStore unifiedContactWithIdentifier:identifier keysToFetch:@[[CNContactViewController descriptorForRequiredKeys]] error:&error];
    if (error) {
        [EXContacts rejectWithError:@"Failed to unify contact" error:error rejecter:reject];
        return nil;
    }
    return contact;
}

- (NSDictionary *)_fetchContactData:(NSDictionary *)options contactStore:(CNContactStore *)contactStore keysToFetch:(NSArray<NSString *> *)keysToFetch
{
    NSPredicate *predicate;
    
    if (options[@"id"]) {
        NSArray<NSString *> *contactIds = [EXContacts _ensureArray:options[@"id"]];
        predicate = [CNContact predicateForContactsWithIdentifiers:contactIds];
    } else if (options[@"name"]) {
        predicate = [CNContact predicateForContactsMatchingName:options[@"name"]];
    } else if (options[EXContactsOptionGroupId]) {
        predicate = [CNContact predicateForContactsInGroupWithIdentifier:options[EXContactsOptionGroupId]];
    } else if (options[EXContactsOptionContainerId]) {
        predicate = [CNContact predicateForContactsInContainerWithIdentifier:options[EXContactsOptionContainerId]];
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
