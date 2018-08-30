// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXContacts+Serialization.h"

@implementation EXContacts (Serialization)

#pragma mark - Encode Contacts

+ (NSString *)calendarFormatToString:(NSCalendarIdentifier)identifier
{
  NSDictionary *mapping = @{
                            NSCalendarIdentifierGregorian: @"gregorian",
                            NSCalendarIdentifierBuddhist: @"buddhist",
                            NSCalendarIdentifierChinese: @"chinese",
                            NSCalendarIdentifierCoptic: @"coptic",
                            NSCalendarIdentifierEthiopicAmeteMihret: @"ethiopicAmeteMihret",
                            NSCalendarIdentifierEthiopicAmeteAlem: @"ethiopicAmeteAlem",
                            NSCalendarIdentifierHebrew: @"hebrew",
                            NSCalendarIdentifierISO8601: @"iso8601",
                            NSCalendarIdentifierIndian: @"indian",
                            NSCalendarIdentifierIslamic: @"islamic",
                            NSCalendarIdentifierIslamicCivil: @"islamicCivil",
                            NSCalendarIdentifierJapanese: @"japanese",
                            NSCalendarIdentifierPersian: @"persian",
                            NSCalendarIdentifierRepublicOfChina: @"republicOfChina",
                            NSCalendarIdentifierIslamicTabular: @"islamicTabular",
                            NSCalendarIdentifierIslamicUmmAlQura: @"islamicUmmAlQura"
                            };
  return mapping[identifier];
}

+ (NSCalendarIdentifier)calendarFormatFromString:(NSString *)identifier
{
  NSDictionary *mapping = @{
                            @"gregorian": NSCalendarIdentifierGregorian,
                            @"buddhist": NSCalendarIdentifierBuddhist,
                            @"chinese": NSCalendarIdentifierChinese,
                            @"coptic": NSCalendarIdentifierCoptic,
                            @"ethiopicAmeteMihret": NSCalendarIdentifierEthiopicAmeteMihret,
                            @"ethiopicAmeteAlem": NSCalendarIdentifierEthiopicAmeteAlem,
                            @"hebrew": NSCalendarIdentifierHebrew,
                            @"iso8601": NSCalendarIdentifierISO8601,
                            @"indian": NSCalendarIdentifierIndian,
                            @"islamic": NSCalendarIdentifierIslamic,
                            @"islamicCivil": NSCalendarIdentifierIslamicCivil,
                            @"japanese": NSCalendarIdentifierJapanese,
                            @"persian": NSCalendarIdentifierPersian,
                            @"republicOfChina": NSCalendarIdentifierRepublicOfChina,
                            @"islamicTabular": NSCalendarIdentifierIslamicTabular,
                            @"islamicUmmAlQura": NSCalendarIdentifierIslamicUmmAlQura,
                            };
  if (mapping[identifier]) {
    return mapping[identifier];
  } else {
    return NSCalendarIdentifierGregorian;
  }
}

+ (nullable NSArray *)addressesForContact:(CNContact * _Nonnull)person
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

+ (nullable NSArray *)phoneNumbersForContact:(CNContact * _Nonnull) person
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

+ (nullable NSArray *)emailsForContact:(CNContact * _Nonnull) person
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

+ (nullable NSDictionary *)birthdayForContact:(NSDateComponents *)birthday
{
  if (!birthday) {
    return nil;
  }
  NSMutableDictionary *birthdayObject = [NSMutableDictionary new];
  
  if (birthday.month != NSDateComponentUndefined) {
    [birthdayObject setObject:@(birthday.month - 1) forKey:@"month"];
  }
  if (birthday.day != NSDateComponentUndefined) {
    [birthdayObject setObject:@(birthday.day) forKey:@"day"];
  }
  if (birthday.year != NSDateComponentUndefined) {
    [birthdayObject setObject:@(birthday.year) forKey:@"year"];
  }
  if (birthday.calendar) {
    [birthdayObject setObject:[EXContacts calendarFormatToString:birthday.calendar.calendarIdentifier] forKey:@"format"];
  }
  
  return birthdayObject;
}

+ (nullable NSArray *)socialProfilesForContact:(CNContact * _Nonnull)person
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
        if (!profile[@"label"]) {
          profile[@"label"] = container.label;
        }
      }
      [results addObject:profile];
    }
  }
  return results;
}

+ (nullable NSArray *)instantMessageAddressesForContact:(CNContact * _Nonnull)person
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
      address[@"label"] = container.label;
      [results addObject:address];
    }
  }
  return results;
}

+ (nullable NSArray *)urlsForContact:(CNContact * _Nonnull) person
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

+ (nullable NSArray *)datesForContact:(CNContact * _Nonnull)person
{
  NSMutableArray *results = nil;
  if (person.dates) {
    results = [NSMutableArray arrayWithCapacity:person.dates.count];
    
    for (CNLabeledValue<NSDateComponents *> *container in person.dates) {
      NSDateComponents *val = container.value;
      NSMutableDictionary *date = [NSMutableDictionary dictionary];
      date[@"day"] = @(val.day);
      date[@"month"] = @(val.month - 1);
      date[@"year"] = val.year == NSDateComponentUndefined ? nil : @(val.year);
      date[@"id"] = container.identifier;
      if (val.calendar) {
        date[@"format"] = [EXContacts calendarFormatToString:val.calendar.calendarIdentifier];
      }
      if (container.label) {
        date[@"label"] = [CNLabeledValue localizedStringForLabel:container.label];
      }
      [results addObject:date];
    }
  }
  return results;
}

+ (nullable NSArray *)relationsForContact:(CNContact * _Nonnull)person
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

+ (nullable NSString *)assembleDisplayNameForContact:(CNContact * _Nonnull)person
{
  if (person.givenName) {
    return [CNContactFormatter stringFromContact:person style:CNContactFormatterStyleFullName];
  }
  return @"";
}

+ (NSDictionary *)encodeContainer:(CNContainer * _Nonnull)container
{
    return @{
             @"name": container.name,
             @"id": container.identifier,
             @"type": [self encodeContainerType:container.type],
             };
}

+ (NSString *)encodeContainerType:(CNContainerType)type
{
    switch (type) {
        case CNContainerTypeLocal:
            return @"local";
        case CNContainerTypeExchange:
            return @"exchange";
        case CNContainerTypeCardDAV:
            return @"cardDAV";
        default:
            return @"unassigned";
    }
}

+ (NSDictionary *)encodeGroup:(CNGroup * _Nonnull)group
{
    NSMutableDictionary *object = [NSMutableDictionary new];
    [object setObject:group.identifier forKey:@"id"];
    if (group.name) [object setObject:group.name forKey:@"name"];
    return object;
}

#pragma mark - Decode Labels

+ (NSString *)decodeContactLabel:(NSString *)label
{
  label = [self decodeLabel:label];
  
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationChild]])
    label = CNLabelContactRelationChild;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationFather]])
    label = CNLabelContactRelationFather;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationFriend]])
    label = CNLabelContactRelationFriend;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationMother]])
    label = CNLabelContactRelationMother;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationParent]])
    label = CNLabelContactRelationParent;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationSister]])
    label = CNLabelContactRelationSister;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationSpouse]])
    label = CNLabelContactRelationSpouse;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationBrother]])
    label = CNLabelContactRelationBrother;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationMother]])
    label = CNLabelContactRelationMother;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationManager]])
    label = CNLabelContactRelationManager;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationAssistant]])
    label = CNLabelContactRelationAssistant;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationPartner]])
    label = CNLabelContactRelationPartner;
  
  if (@available(iOS 11.0, *)) {
    if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationSon]])
      label = CNLabelContactRelationSon;
    else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelContactRelationDaughter]])
      label = CNLabelContactRelationDaughter;
  }
  return label;
}

+ (NSString *)decodePhoneLabel:(NSString *)label
{
  label = [EXContacts decodeLabel:label];
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberMain]])
    label = CNLabelPhoneNumberMain;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberPager]])
    label = CNLabelPhoneNumberPager;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberiPhone]])
    label = CNLabelPhoneNumberiPhone;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberMobile]])
    label = CNLabelPhoneNumberMobile;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberHomeFax]])
    label = CNLabelPhoneNumberHomeFax;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberWorkFax]])
    label = CNLabelPhoneNumberWorkFax;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelPhoneNumberOtherFax]])
    label = CNLabelPhoneNumberOtherFax;
  return label;
}

+ (NSString *)decodeEmailLabel:(NSString *)label
{
  label = [EXContacts decodeLabel:label];
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelEmailiCloud]])
    label = CNLabelEmailiCloud;
  return label;
}

+ (NSString *)decodeUrlAddressLabel:(NSString *)label
{
  label = [EXContacts decodeLabel:label];
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelURLAddressHomePage]])
    label = CNLabelURLAddressHomePage;
  return label;
}

+ (NSString *)decodeEmailAddressLabel:(NSString *)label
{
  label = [EXContacts decodeLabel:label];
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelEmailiCloud]])
    label = CNLabelEmailiCloud;
  return label;
}

+ (NSString *)decodeDateLabel:(NSString *)label
{
  label = [EXContacts decodeLabel:label];
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelDateAnniversary]])
    label = CNLabelDateAnniversary;
  return label;
}

+ (NSString *)decodeLabel:(NSString *)label
{
  if (!label || [label isEqualToString:@""]) {
    return @"default";
  }
  if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelHome]])
    label = CNLabelHome;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelWork]])
    label = CNLabelWork;
  else if ([label isEqualToString:[CNLabeledValue localizedStringForLabel:CNLabelOther]])
    label = CNLabelOther;
  return label;
}

#pragma mark - Decode contacts

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeRelationships:(nullable NSArray *)input
{
  if (!input) return nil;
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [self decodeContactLabel:item[@"label"]];
    [output addObject:[[CNLabeledValue alloc]
                       initWithLabel:label
                       value: [[CNContactRelation alloc] initWithName:item[@"name"] ] ]];
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeDates:(nullable NSArray *)input
{
  if (!input) return nil;
  
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodeDateLabel:item[@"label"]];
    NSDateComponents *val = [[NSDateComponents alloc] init];
    
    if (item[@"day"]) {
      val.day = [item[@"day"] integerValue];
    }
    if (item[@"month"]) {
      val.month = [item[@"month"] integerValue] + 1;
    }
    if (item[@"year"]) {
      val.day = [item[@"year"] integerValue];
    }
    [output addObject:[[CNLabeledValue alloc]
                       initWithLabel:label
                       value:val]];
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeUrlAddresses:(nullable NSArray *)input
{
  if (!input) return nil;
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodeUrlAddressLabel:item[@"label"]];
    [output addObject:[[CNLabeledValue alloc]
                       initWithLabel:label
                       value:item[@"url"]]];
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeInstantMessageAddresses:(nullable NSArray *)input
{
  if (!input) return nil;
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodeLabel:item[@"label"]];
    [output addObject:[[CNLabeledValue alloc] initWithLabel:label value:[[CNInstantMessageAddress alloc] initWithUsername:item[@"username"] service:item[@"service"]]]];
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeSocialProfiles:(nullable NSArray *)input
{
  if (!input) return nil;
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodeLabel:item[@"label"]];
    CNSocialProfile *profile = [[CNSocialProfile alloc] initWithUrlString:item[@"url"] username:item[@"username"] userIdentifier:item[@"userId"] service:item[@"service"]];
    [output addObject:[[CNLabeledValue alloc] initWithLabel:label value:profile]];
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeEmailAddresses:(nullable NSArray *)input
{
  if (!input) {
    return nil;
  }
  
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodeEmailLabel:item[@"label"]];
    NSString *email = item[@"email"];
    
    if (email && label) {
      [output addObject:[[CNLabeledValue alloc] initWithLabel:label value:email]];
    }
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodePhoneNumbers:(NSArray *)input
{
  if (!input) {
    return nil;
  }
  
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodePhoneLabel:item[@"label"]];
    CNPhoneNumber *number = [[CNPhoneNumber alloc] initWithStringValue:[item valueForKey:@"number"]];
    [output addObject:[[CNLabeledValue alloc] initWithLabel:label value:number]];
  }
  return output;
}

+ (nullable NSMutableArray<CNLabeledValue *> *)decodeAddresses:(NSArray *)input
{
  if (!input) {
    return nil;
  }
  NSMutableArray *output = [[NSMutableArray alloc] init];
  for (NSDictionary *item in input) {
    NSString *label = [EXContacts decodeLabel:item[@"label"]];
    NSString *street = item[@"street"];
    if (street && label) {
      CNMutablePostalAddress *address = [[CNMutablePostalAddress alloc] init];
      address.street = street;
      address.postalCode = item[@"postalCode"];
      address.city = item[@"city"];
      address.country = item[@"country"];
      address.state = item[@"region"];
      address.ISOCountryCode = item[@"isoCountryCode"];
      [output addObject:[[CNLabeledValue alloc] initWithLabel:label value: address]];
    }
  }
  return output;
}

+ (NSDateComponents *)decodeBirthday:(NSDictionary *)input contact:(CNContact *)contact
{
  if (input) {
    NSDateComponents *components;
    if (contact.birthday != nil) {
      components = contact.birthday;
    } else {
      components = [[NSDateComponents alloc] init];
    }
    
    if (input[@"month"]) {
      // To match JS Date()
      components.month = [input[@"month"] intValue] + 1;
    }
    if (input[@"year"]) {
      components.year = [input[@"year"] intValue];
    }
    if (input[@"day"]) {
      components.day = [input[@"day"] intValue];
    }
    if (input[@"format"]) {
      //      NSCalendar *adjustedCalendar = [[NSCalendar alloc] initWithCalendarIdentifier:[EXContacts calendarFormatFromString:input[@"format"]]];
      //      NSDate *sourceDate = [adjustedCalendar dateFromComponents:components];
      //      components = [adjustedCalendar components:NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear fromDate:sourceDate];
    }
    return components;
  }
  
  return contact.birthday;
}

+ (NSArray<NSString *> *)groupNames:(NSArray<CNGroup *> *)groups
{
  NSMutableArray *names = [[NSMutableArray alloc] init];
  for (CNGroup *group in groups) {
    [names addObject:group.name];
  }
  return names;
}

+ (NSArray<NSString *> *)groupIds:(NSArray<CNGroup *> *)groups
{
  NSMutableArray *ids = [[NSMutableArray alloc] init];
  for (CNGroup *group in groups) {
    [ids addObject:group.identifier];
  }
  return ids;
}

@end
