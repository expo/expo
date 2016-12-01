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
  // id, name, emails (email, label), phoneNumbers (number, label), middleName, company, jobTitle
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
    
    if ([fieldsSet containsObject:@"phone_number"]) {
      ABMultiValueRef phoneNumbers = ABRecordCopyValue(person, kABPersonPhoneProperty);
      if (phoneNumbers) {
        CFIndex numberOfPhones = ABMultiValueGetCount(phoneNumbers);
      
        if (numberOfPhones > 0) {
          contact[@"phoneNumbers"] = [NSMutableArray new];
        
          for (NSUInteger index = 0; index < numberOfPhones; index++) {
            NSString *phoneNumber = (__bridge_transfer NSString *)(ABMultiValueCopyValueAtIndex(phoneNumbers, index));
            
            CFStringRef phoneLabelRef = ABMultiValueCopyLabelAtIndex(phoneNumbers, index);
            NSString *phoneLabel = phoneLabelRef ?
              (__bridge_transfer NSString *)(ABAddressBookCopyLocalizedLabel(phoneLabelRef)) :
              nil;
          
            [contact[@"phoneNumbers"] addObject:@{
                                                  @"number": phoneNumber,
                                                  @"label": phoneLabel,
                                                  @"default": @(index == 0),
                                                  }];
          
            if (phoneLabelRef) {
              CFRelease(phoneLabelRef);
            }
          }
        }
      
        CFRelease(phoneNumbers);
      }
    }
    
    if ([fieldsSet containsObject:@"email"]) {
      ABMultiValueRef emails = ABRecordCopyValue(person, kABPersonEmailProperty);
      if (emails) {
        CFIndex numberOfEmails = ABMultiValueGetCount(emails);
      
        if (numberOfEmails > 0) {
          contact[@"emails"] = [NSMutableArray new];
        
          for (NSUInteger index = 0; index < numberOfEmails; index++) {
            NSString *emailAddress = (__bridge_transfer NSString *)(ABMultiValueCopyValueAtIndex(emails, index));
          
            CFStringRef emailLabelRef = ABMultiValueCopyLabelAtIndex(emails, index);
            NSString *emailLabel = emailLabelRef ?
              (__bridge_transfer NSString *)(ABAddressBookCopyLocalizedLabel(emailLabelRef)) :
              nil;
          
            [contact[@"emails"] addObject:@{
                                            @"email": emailAddress,
                                            @"label": emailLabel,
                                            @"default": @(index == 0),
                                            }];
          
            if (emailLabelRef) {
              CFRelease(emailLabelRef);
            }
          }
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
