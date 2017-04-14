// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI16_0_0EXContacts.h"
#import "ABI16_0_0EXContactsRequester.h"

@import Contacts;

@interface ABI16_0_0EXContacts ()

@property (nonatomic, strong) CNContactStore *contactStore;

@end

@implementation ABI16_0_0EXContacts

ABI16_0_0RCT_EXPORT_MODULE(ExponentContacts);

/**
 * @param options Options including what fields to get and paging information.
 */
ABI16_0_0RCT_EXPORT_METHOD(getContactsAsync:(NSDictionary *)options resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if (!_contactStore) {
    _contactStore = [[CNContactStore alloc] init];
  }

  if ([ABI16_0_0EXPermissions statusForPermissions:[ABI16_0_0EXContactsRequester permissions]] != ABI16_0_0EXPermissionStatusGranted) {
    reject(@"E_MISSING_PERMISSION", @"Missing contacts permission.", nil);
    return;
  }

  // always include id, name, firstName, middleName, lastName, company, jobTitle
  NSMutableSet *fieldsSet = [NSMutableSet setWithArray:options[@"fields"]];
  [fieldsSet addObjectsFromArray:@[@"id", @"name", @"firstName", @"middleName", @"lastName", @"company", @"jobTitle"]];

  NSArray *keysToFetch = [self _contactKeysToFetchFromFields:fieldsSet.allObjects];
  CNContactFetchRequest *fetchRequest = [[CNContactFetchRequest alloc] initWithKeysToFetch:keysToFetch];
  fetchRequest.unifyResults = YES;
  fetchRequest.predicate = nil;

  NSUInteger pageOffset = [options[@"pageOffset"] unsignedIntegerValue];
  NSUInteger pageSize = [options[@"pageSize"] unsignedIntegerValue];
  __block NSUInteger currentIndex = 0;
  NSError *err;
  NSMutableArray *response = [[NSMutableArray alloc] init];
  BOOL success = [_contactStore enumerateContactsWithFetchRequest:fetchRequest error:&err usingBlock:^(CNContact * _Nonnull person, BOOL * _Nonnull stop) {
    // Paginate the result.
    BOOL shouldAddContact = (currentIndex >= pageOffset) && (currentIndex < pageOffset + pageSize);
    currentIndex++;
    if (!shouldAddContact) {
      // Don't use `stop` because we need to go through every contact to get the total count.
      return;
    }

    NSMutableDictionary *contact = [NSMutableDictionary dictionary];
    contact[@"id"] = person.identifier;
    contact[@"firstName"] = person.givenName;
    contact[@"lastName"] = person.familyName;
    contact[@"middleName"] = person.middleName;
    contact[@"name"] = [self _assembleDisplayNameForContact:person];
    contact[@"company"] = person.organizationName;
    contact[@"jobTitle"] = person.jobTitle;

    if ([keysToFetch containsObject:CNContactPostalAddressesKey]) {
      contact[@"addresses"] = [self _addressesForContact:person];
    }
    if ([keysToFetch containsObject:CNContactPhoneNumbersKey]) {
      contact[@"phoneNumbers"] = [self _phoneNumbersForContact:person];
    }
    if ([keysToFetch containsObject:CNContactEmailAddressesKey]) {
      contact[@"emails"] = [self _emailsForContact:person];
    }

    [response addObject:contact];
  }];

  // When we are done iterating the total is the current index.
  NSUInteger total = currentIndex;

  if (success && !err) {
    resolve(@{
      @"data": response,
      @"hasNextPage": @(pageOffset + pageSize < total),
      @"hasPreviousPage": @(pageOffset > 0),
      @"total": @(total),
    });
  } else {
    reject(0, @"Error while fetching contacts", err);
  }
}

- (NSArray *)_addressesForContact:(CNContact * _Nonnull)person
{
  NSMutableArray *results = nil;
  if (person.postalAddresses) {
    results = [NSMutableArray arrayWithCapacity:person.postalAddresses.count];

    for (CNLabeledValue<CNPostalAddress *> *container in person.postalAddresses) {
      CNPostalAddress *val = container.value;
      NSMutableDictionary *address = [NSMutableDictionary dictionary];
      address[@"street"] = val.street;
      address[@"city"] = val.city;
      address[@"region"] = val.state;
      address[@"postcode"] = val.postalCode;
      address[@"country"] = val.country;
      if (container.label) {
        address[@"label"] = [CNLabeledValue localizedStringForLabel:container.label];

      }
      [results addObject:address];
    }
  }
  return results;
}

- (NSArray *)_phoneNumbersForContact:(CNContact * _Nonnull) person
{
  NSMutableArray *results = nil;
  if (person.phoneNumbers) {
    results = [NSMutableArray arrayWithCapacity:person.phoneNumbers.count];

    for (CNLabeledValue<CNPhoneNumber *> *container in person.phoneNumbers) {
      NSString *phoneNumber = container.value.stringValue;
      if (container.label) {
        NSString *phoneLabel = [CNLabeledValue localizedStringForLabel:container.label];
        [results addObject:@{ @"number": phoneNumber, @"label": phoneLabel }];
      } else {
        [results addObject:@{ @"number": phoneNumber }];
      }
    }
  }
  return results;
}

- (NSArray *)_emailsForContact:(CNContact * _Nonnull) person
{
  NSMutableArray *results = nil;
  if (person.emailAddresses) {
    results = [NSMutableArray arrayWithCapacity:person.emailAddresses.count];

    for (CNLabeledValue<NSString *> *container in person.emailAddresses) {
      NSString *emailAddress = container.value;
      if (container.label) {
        NSString *emailLabel = [CNLabeledValue localizedStringForLabel:container.label];
        [results addObject:@{ @"email": emailAddress, @"label": emailLabel }];
      } else {
        [results addObject:@{ @"email": emailAddress }];
      }
    }
  }
  return results;
}

- (NSArray <id<CNKeyDescriptor>> *)_contactKeysToFetchFromFields:(NSArray *)fields
{
  const NSDictionary *mapping = @{
                                  @"id": CNContactIdentifierKey,
                                  @"addresses": CNContactPostalAddressesKey,
                                  @"phoneNumbers": CNContactPhoneNumbersKey,
                                  @"emails": CNContactEmailAddressesKey,
                                  @"firstName": CNContactGivenNameKey,
                                  @"middleName": CNContactMiddleNameKey,
                                  @"lastName": CNContactFamilyNameKey,
                                  @"company": CNContactOrganizationNameKey,
                                  @"jobTitle": CNContactJobTitleKey,
                                  @"name": [CNContactFormatter descriptorForRequiredKeysForStyle:CNContactFormatterStyleFullName],
                                  };
  NSMutableArray <id<CNKeyDescriptor>> *results = [NSMutableArray arrayWithCapacity:fields.count];
  for (NSString *field in fields) {
    if (mapping[field]) {
      [results addObject:mapping[field]];
    }
  }
  return results;
}

- (NSString *)_assembleDisplayNameForContact:(CNContact * _Nonnull)person
{
  return [CNContactFormatter stringFromContact:person style:CNContactFormatterStyleFullName];
}

@end
