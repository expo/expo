// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXContacts.h"

@import AddressBook;

@interface EXContacts ()

@property (nonatomic, assign) ABAddressBookRef addressBookRef;

@end

@implementation EXContacts

RCT_EXPORT_MODULE(ExponentContacts);

// TODO: iOS 9: use Contacts framework instead of deprecated AddressBook

/**
 * @param fields array with possible values 'phone_number', 'email'
 */
RCT_EXPORT_METHOD(getContactsAsync:(NSArray *)fields resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _releaseAddressBook];
  _addressBookRef = ABAddressBookCreateWithOptions(nil, nil);
  ABAuthorizationStatus permissions = ABAddressBookGetAuthorizationStatus();
  
  if (permissions == kABAuthorizationStatusNotDetermined) {
    __weak typeof(self) weakSelf = self;
    ABAddressBookRequestAccessWithCompletion(_addressBookRef, ^(bool granted, CFErrorRef error) {
      if (granted) {
        // initial permissions grant
        dispatch_async(dispatch_get_main_queue(), ^{
          __strong typeof(self) strongSelf = weakSelf;
          [strongSelf _getContactsWithPermissionGrantedAsync:fields addressBook:strongSelf.addressBookRef resolver:resolve rejecter:reject];
        });
      } else {
        reject(0, @"User rejected contacts permission.", (__bridge NSError *)(error));
        [weakSelf _releaseAddressBook];
      }
    });
  } else if (permissions == kABAuthorizationStatusAuthorized) {
    [self _getContactsWithPermissionGrantedAsync:fields addressBook:_addressBookRef resolver:resolve rejecter:reject];
    [self _releaseAddressBook];
  } else {
    reject(0, @"User rejected contacts permission.", nil);
    [self _releaseAddressBook];
  }
}

- (void)dealloc
{
  [self _releaseAddressBook];
}

- (void)_getContactsWithPermissionGrantedAsync: (NSArray *)fields addressBook:(ABAddressBookRef)addressBook resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  NSSet *fieldsSet = [NSSet setWithArray:fields];
  CFArrayRef allPeople = ABAddressBookCopyArrayOfAllPeople(addressBook);
  CFIndex numberOfPeople = ABAddressBookGetPersonCount(addressBook);
  
  // response: array of maps, each map has potential keys
  //   id, name, email, phoneNumber
  //   if the contact has neither an email nor a phone number, we skip it
  NSMutableArray *response = [[NSMutableArray alloc] init];
  
  for (NSUInteger index = 0; index < numberOfPeople; index++) {
    NSMutableDictionary *contact = [NSMutableDictionary dictionary];
    
    ABRecordRef person = CFArrayGetValueAtIndex(allPeople, index);
    contact[@"id"] = @(ABRecordGetRecordID(person));
    
    NSString *firstName = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonFirstNameProperty));
    NSString *lastName = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonLastNameProperty));
    NSString *name = [self _assembleDisplayNameFromFirstName:firstName lastName:lastName];
    if (name) {
      contact[@"name"] = name;
    }
    
    if ([fieldsSet containsObject:@"phone_number"]) {
      ABMultiValueRef phoneNumbers = ABRecordCopyValue(person, kABPersonPhoneProperty);
      if (phoneNumbers) {
        if (ABMultiValueGetCount(phoneNumbers) > 0) {
          contact[@"phoneNumber"] = (__bridge_transfer NSString *)ABMultiValueCopyValueAtIndex(phoneNumbers, 0);
        }
        CFRelease(phoneNumbers);
      }
    }
    
    if ([fieldsSet containsObject:@"email"]) {
      ABMultiValueRef emails = ABRecordCopyValue(person, kABPersonEmailProperty);
      if (emails) {
        if (ABMultiValueGetCount(emails) > 0) {
          contact[@"email"] = (__bridge_transfer NSString *)ABMultiValueCopyValueAtIndex(emails, 0);
        }
        CFRelease(emails);
      }
    }
    
    [response addObject:contact];
  }
  
  CFRelease(allPeople);
  resolve(response);
}

- (NSString *)_assembleDisplayNameFromFirstName: (NSString *)firstName lastName: (NSString *)lastName
{
  if (firstName && lastName) {
    return [NSString stringWithFormat:@"%@ %@", firstName, lastName];
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  return nil;
}

- (void)_releaseAddressBook
{
  if (_addressBookRef) {
    CFRelease(_addressBookRef);
    _addressBookRef = nil;
  }
}

@end
