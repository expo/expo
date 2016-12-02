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
 * @param fields array with possible values 'addresses, 'phoneNumbers', 'emails'
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

- (void)_getContactsWithPermissionGrantedAsync:(NSArray *)fields addressBook:(ABAddressBookRef)addressBook resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  NSSet *fieldsSet = [NSSet setWithArray:fields];
  CFArrayRef allPeople = ABAddressBookCopyArrayOfAllPeople(addressBook);
  CFIndex numberOfPeople = ABAddressBookGetPersonCount(addressBook);
  NSMutableArray *response = [[NSMutableArray alloc] init];
  
  for (NSUInteger index = 0; index < numberOfPeople; index++) {
    ABRecordRef person = CFArrayGetValueAtIndex(allPeople, index);
    
    NSMutableDictionary *contact = [NSMutableDictionary dictionary];
    contact[@"id"] = @(ABRecordGetRecordID(person));
    contact[@"firstName"] = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonFirstNameProperty));
    contact[@"lastName"] = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonLastNameProperty));
    contact[@"middleName"] = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonMiddleNameProperty));
    contact[@"name"] = [self _assembleDisplayNameFromFirstName:contact[@"firstName"] lastName:contact[@"lastName"]];
    contact[@"company"] = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonOrganizationProperty));
    contact[@"jobTitle"] = (__bridge_transfer NSString *)(ABRecordCopyValue(person, kABPersonJobTitleProperty));
    
    if ([fieldsSet containsObject:@"addresses"]) {
      contact[@"addresses"] = [self _addressesForContact:person];
    }
    if ([fieldsSet containsObject:@"phoneNumbers"]) {
      contact[@"phoneNumbers"] = [self _phoneNumbersForContact:person];
    }
    if ([fieldsSet containsObject:@"emails"]) {
      contact[@"emails"] = [self _emailsForContact:person];
    }
    
    [response addObject:contact];
  }
  
  CFRelease(allPeople);
  resolve(response);
}

- (NSArray *)_addressesForContact:(ABRecordRef)person
{
  NSMutableArray *results = nil;
  ABMultiValueRef addresses = ABRecordCopyValue(person, kABPersonAddressProperty);
  if (addresses) {
    CFIndex numberOfAddresses = ABMultiValueGetCount(addresses);
    if (numberOfAddresses > 0) {
      results = [NSMutableArray arrayWithCapacity:numberOfAddresses];
      
      for (NSUInteger index = 0; index < numberOfAddresses; index++) {
        CFDictionaryRef dict = ABMultiValueCopyValueAtIndex(addresses, index);
        
        NSMutableDictionary *address = [NSMutableDictionary dictionary];
        
        address[@"street"] = (NSString *)(CFDictionaryGetValue(dict, kABPersonAddressStreetKey));
        address[@"city"] = (NSString *)(CFDictionaryGetValue(dict, kABPersonAddressCityKey));
        address[@"region"] = (NSString *)(CFDictionaryGetValue(dict, kABPersonAddressStateKey));
        address[@"postcode"] = (NSString *)(CFDictionaryGetValue(dict, kABPersonAddressZIPKey));
        address[@"country"] = (NSString *)(CFDictionaryGetValue(dict, kABPersonAddressCountryKey));
        
        CFStringRef labelRef = ABMultiValueCopyLabelAtIndex(addresses, index);
        
        if (labelRef) {
          address[@"label"] = (__bridge_transfer NSString *)(ABAddressBookCopyLocalizedLabel(labelRef));
          CFRelease(labelRef);
        }
        [results addObject:address];
        CFRelease(dict);
      }
    }
    
    CFRelease(addresses);
  }
  return results;
}

- (NSArray *)_phoneNumbersForContact:(ABRecordRef)person
{
  NSMutableArray *results = nil;
  ABMultiValueRef phoneNumbers = ABRecordCopyValue(person, kABPersonPhoneProperty);
  if (phoneNumbers) {
    CFIndex numberOfPhones = ABMultiValueGetCount(phoneNumbers);
    
    if (numberOfPhones > 0) {
      results = [NSMutableArray arrayWithCapacity:numberOfPhones];
      
      for (NSUInteger index = 0; index < numberOfPhones; index++) {
        NSString *phoneNumber = (__bridge_transfer NSString *)(ABMultiValueCopyValueAtIndex(phoneNumbers, index));
        CFStringRef phoneLabelRef = ABMultiValueCopyLabelAtIndex(phoneNumbers, index);
        if (phoneLabelRef) {
          NSString *phoneLabel = (__bridge_transfer NSString *)(ABAddressBookCopyLocalizedLabel(phoneLabelRef));
          [results addObject:@{ @"number": phoneNumber, @"label": phoneLabel }];
          CFRelease(phoneLabelRef);
        } else {
          [results addObject:@{ @"number": phoneNumber }];
        }
      }
    }
    
    CFRelease(phoneNumbers);
  }
  return results;
}

- (NSArray *)_emailsForContact:(ABRecordRef)person
{
  NSMutableArray *results = nil;
  ABMultiValueRef emails = ABRecordCopyValue(person, kABPersonEmailProperty);
  if (emails) {
    CFIndex numberOfEmails = ABMultiValueGetCount(emails);
    
    if (numberOfEmails > 0) {
      results = [NSMutableArray arrayWithCapacity:numberOfEmails];
      
      for (NSUInteger index = 0; index < numberOfEmails; index++) {
        NSString *emailAddress = (__bridge_transfer NSString *)(ABMultiValueCopyValueAtIndex(emails, index));
        CFStringRef emailLabelRef = ABMultiValueCopyLabelAtIndex(emails, index);
        if (emailLabelRef) {
          NSString *emailLabel = (__bridge_transfer NSString *)(ABAddressBookCopyLocalizedLabel(emailLabelRef));
          [results addObject:@{ @"email": emailAddress, @"label": emailLabel }];
          CFRelease(emailLabelRef);
        } else {
          [results addObject:@{ @"email": emailAddress }];
        }
      }
    }

    CFRelease(emails);
  }
  return results;
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
