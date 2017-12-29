// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXContacts.h"
#import "EXContactsRequester.h"

@import Contacts;

@interface EXContacts ()

@property (nonatomic, strong) CNContactStore *contactStore;

@end

@implementation EXContacts

RCT_EXPORT_MODULE(ExponentContacts);

/**
 * @param options Options including what fields to get and paging information.
 */
RCT_EXPORT_METHOD(getContactsAsync:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!_contactStore) {
    _contactStore = [[CNContactStore alloc] init];
  }

  if ([EXPermissions statusForPermissions:[EXContactsRequester permissions]] != EXPermissionStatusGranted) {
    reject(@"E_MISSING_PERMISSION", @"Missing contacts permission.", nil);
    return;
  }

  // always include id, contactType, name, firstName, middleName, lastName, previousLastName, nickname, company, jobTitle, department, imageAvailable
  NSMutableSet *fieldsSet = [NSMutableSet setWithArray:options[@"fields"]];
  [fieldsSet addObjectsFromArray:@[
                                   @"id",
                                   @"contactType",
                                   @"name",
                                   @"firstName",
                                   @"middleName",
                                   @"lastName",
                                   @"previousLastName",
                                   @"nickname",
                                   @"company",
                                   @"jobTitle",
                                   @"department",
                                   @"imageAvailable"
                                   ]];

  NSArray *keysToFetch = [self _contactKeysToFetchFromFields:fieldsSet.allObjects];
  NSString *contactId = options[@"id"];
  BOOL fetchSingleContact = contactId != nil;
  
  CNContactFetchRequest *fetchRequest = [[CNContactFetchRequest alloc] initWithKeysToFetch:keysToFetch];
  fetchRequest.unifyResults = YES;
  if (fetchSingleContact) {
    fetchRequest.predicate = [CNContact predicateForContactsWithIdentifiers:@[contactId]];
  } else {
    fetchRequest.predicate = nil;
  }
  

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
    contact[@"contactType"] = person.contactType == CNContactTypePerson ? @"person" : @"organization";
    contact[@"name"] = [self _assembleDisplayNameForContact:person];
    contact[@"firstName"] = person.givenName;
    contact[@"lastName"] = person.familyName;
    contact[@"previousLastName"] = person.previousFamilyName;
    contact[@"middleName"] = person.middleName;
    contact[@"nickname"] = person.nickname;
    contact[@"company"] = person.organizationName;
    contact[@"jobTitle"] = person.jobTitle;
    contact[@"department"] = person.departmentName;
    contact[@"imageAvailable"] = @(person.imageDataAvailable);

    if ([keysToFetch containsObject:CNContactNamePrefixKey]) {
      contact[@"namePrefix"] = person.namePrefix;
    }
    if ([keysToFetch containsObject:CNContactNameSuffixKey]) {
      contact[@"nameSuffix"] = person.nameSuffix;
    }
    if ([keysToFetch containsObject:CNContactPhoneticGivenNameKey]) {
      contact[@"phoneticFirstName"] = person.phoneticGivenName;
    }
    if ([keysToFetch containsObject:CNContactPhoneticMiddleNameKey]) {
      contact[@"phoneticMiddleName"] = person.phoneticMiddleName;
    }
    if ([keysToFetch containsObject:CNContactPhoneticFamilyNameKey]) {
      contact[@"phoneticLastName"] = person.phoneticFamilyName;
    }
    if ([keysToFetch containsObject:CNContactNoteKey]) {
      contact[@"note"] = person.note;
    }
    if ([keysToFetch containsObject:CNContactImageDataKey]) {
      NSString *uri = person.imageDataAvailable ?
       [NSString stringWithFormat:@"%@%@", @"data:image/png;base64,",
       [person.imageData base64EncodedStringWithOptions:0] ]
       : (NSString *)[NSNull null];
      contact[@"image"] = @{ @"uri": uri };
    }
    if ([keysToFetch containsObject:CNContactThumbnailImageDataKey]) {
      NSString *uri = person.imageDataAvailable ?
       [NSString stringWithFormat:@"%@%@", @"data:image/png;base64,",
       [person.thumbnailImageData base64EncodedStringWithOptions:0] ]
       : (NSString *)[NSNull null];
      contact[@"thumbnail"] = @{ @"uri": uri };
    }
    if ([keysToFetch containsObject:CNContactBirthdayKey]) {
      contact[@"birthday"] = [self _birthdayForContact:person.birthday];
    }
    if ([keysToFetch containsObject:CNContactNonGregorianBirthdayKey]) {
      contact[@"nonGregorianBirthday"] = [self _birthdayForContact:person.nonGregorianBirthday];
    }
    if ([keysToFetch containsObject:CNContactPostalAddressesKey]) {
      contact[@"addresses"] = [self _addressesForContact:person];
    }
    if ([keysToFetch containsObject:CNContactPhoneNumbersKey]) {
      contact[@"phoneNumbers"] = [self _phoneNumbersForContact:person];
    }
    if ([keysToFetch containsObject:CNContactEmailAddressesKey]) {
      contact[@"emails"] = [self _emailsForContact:person];
    }
    if ([keysToFetch containsObject:CNContactSocialProfilesKey]) {
      contact[@"socialProfiles"] = [self _socialProfilesForContact:person];
    }
    if ([keysToFetch containsObject:CNContactInstantMessageAddressesKey]) {
      contact[@"instantMessageAddresses"] = [self _instantMessageAddressesForContact:person];
    }
    if ([keysToFetch containsObject:CNContactUrlAddressesKey]) {
      contact[@"urls"] = [self _urlsForContact:person];
    }
    if ([keysToFetch containsObject:CNContactDatesKey]) {
      contact[@"dates"] = [self _datesForContact:person];
    }
    if ([keysToFetch containsObject:CNContactRelationsKey]) {
      contact[@"relationships"] = [self _relationsForContact:person];
    }

    [response addObject:contact];
  }];

  // When we are done iterating the total is the current index.
  NSUInteger total = currentIndex;

  if (success && !err) {
    if (fetchSingleContact) {
      resolve(total > 0 ? response[0] : nil);
    } else {
      resolve(@{
                @"data": response,
                @"hasNextPage": @(pageOffset + pageSize < total),
                @"hasPreviousPage": @(pageOffset > 0),
                @"total": @(total),
                });
    }
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
      address[@"postalCode"] = val.postalCode;
      address[@"country"] = val.country;
      address[@"isoCountryCode"] = val.ISOCountryCode;
      address[@"id"] = container.identifier;
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
      CNPhoneNumber *val = container.value;
      NSMutableDictionary *phoneNumber = [NSMutableDictionary dictionary];
      phoneNumber[@"number"] = val.stringValue;
      phoneNumber[@"countryCode"] = [val valueForKey:@"countryCode"];
      phoneNumber[@"digits"] = [val valueForKey:@"digits"];
      phoneNumber[@"id"] = container.identifier;
      if (container.label) {
        phoneNumber[@"label"] = [CNLabeledValue localizedStringForLabel:container.label];
      }
      [results addObject:phoneNumber];
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
        [results addObject:@{ @"email": emailAddress, @"label": emailLabel, @"id": container.identifier }];
      } else {
        [results addObject:@{ @"email": emailAddress, @"id": container.identifier }];
      }
    }
  }
  return results;
}

- (NSDictionary *)_birthdayForContact:(NSDateComponents *) birthday
{
  if (birthday) {
    return @{
             @"day": @(birthday.day),
             @"month": @(birthday.month),
             @"year": @(birthday.year)
             };
  }
  return nil;
}

- (NSArray *)_socialProfilesForContact:(CNContact * _Nonnull)person
{
  NSMutableArray *results = nil;
  if (person.socialProfiles) {
    results = [NSMutableArray arrayWithCapacity:person.socialProfiles.count];
    
    for (CNLabeledValue<CNSocialProfile *> *container in person.socialProfiles) {
      CNSocialProfile *val = container.value;
      NSMutableDictionary *profile = [NSMutableDictionary dictionary];
      profile[@"service"] = val.service;
      profile[@"localizedService"] = [CNInstantMessageAddress localizedStringForKey:val.service];
      profile[@"url"] = val.urlString;
      profile[@"username"] = val.username;
      profile[@"userId"] = val.userIdentifier;
      profile[@"id"] = container.identifier;
      if (container.label) {
        profile[@"label"] = [CNLabeledValue localizedStringForLabel:container.label];
      }
      [results addObject:profile];
    }
  }
  return results;
}

- (NSArray *)_instantMessageAddressesForContact:(CNContact * _Nonnull)person
{
  NSMutableArray *results = nil;
  if (person.instantMessageAddresses) {
    results = [NSMutableArray arrayWithCapacity:person.instantMessageAddresses.count];
    
    for (CNLabeledValue<CNInstantMessageAddress *> *container in person.instantMessageAddresses) {
      CNInstantMessageAddress *val = container.value;
      NSMutableDictionary *address = [NSMutableDictionary dictionary];
      address[@"service"] = val.service;
      address[@"localizedService"] = [CNInstantMessageAddress localizedStringForKey:val.service];
      address[@"username"] = val.username;
      address[@"id"] = container.identifier;
      [results addObject:address];
    }
  }
  return results;
}

- (NSArray *)_urlsForContact:(CNContact * _Nonnull) person
{
  NSMutableArray *results = nil;
  if (person.urlAddresses) {
    results = [NSMutableArray arrayWithCapacity:person.urlAddresses.count];
    
    for (CNLabeledValue<NSString *> *container in person.urlAddresses) {
      NSString *urlAddress = container.value;
      if (container.label) {
        NSString *urlLabel = [CNLabeledValue localizedStringForLabel:container.label];
        [results addObject:@{ @"url": urlAddress, @"label": urlLabel, @"id": container.identifier }];
      } else {
        [results addObject:@{ @"url": urlAddress, @"id": container.identifier }];
      }    }
  }
  return results;
}

- (NSArray *)_datesForContact:(CNContact * _Nonnull)person
{
  NSMutableArray *results = nil;
  if (person.dates) {
    results = [NSMutableArray arrayWithCapacity:person.dates.count];
    
    for (CNLabeledValue<NSDateComponents *> *container in person.dates) {
      NSDateComponents *val = container.value;
      NSMutableDictionary *date = [NSMutableDictionary dictionary];
      date[@"day"] = @(val.day);
      date[@"month"] = @(val.month);
      date[@"year"] = val.year == NSDateComponentUndefined ? nil : @(val.year);
      date[@"id"] = container.identifier;
      if (container.label) {
        date[@"label"] = [CNLabeledValue localizedStringForLabel:container.label];
      }
      [results addObject:date];
    }
  }
  return results;
}

- (NSArray *)_relationsForContact:(CNContact * _Nonnull)person
{
  NSMutableArray *results = nil;
  if (person.contactRelations) {
    results = [NSMutableArray arrayWithCapacity:person.contactRelations.count];
    
    for (CNLabeledValue<CNContactRelation *> *container in person.contactRelations) {
      CNContactRelation *val = container.value;
      NSMutableDictionary *relation = [NSMutableDictionary dictionary];
      relation[@"name"] = val.name;
      relation[@"id"] = container.identifier;
      if (container.label) {
        relation[@"label"] = [CNLabeledValue localizedStringForLabel:container.label];
      }
      [results addObject:relation];
    }
  }
  return results;
}

- (NSArray <id<CNKeyDescriptor>> *)_contactKeysToFetchFromFields:(NSArray *)fields
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
                                  @"previousLastName": CNContactPreviousFamilyNameKey,
                                  @"birthday": CNContactBirthdayKey,
                                  @"nonGregorianBirthday": CNContactNonGregorianBirthdayKey,
                                  @"imageAvailable": CNContactImageDataAvailableKey,
                                  @"image": CNContactImageDataKey,
                                  @"thumbnail": CNContactThumbnailImageDataKey,
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
