// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXContacts/EXContacts.h>

#import <Contacts/Contacts.h>

@interface EXContacts (Serialization)

+ (nullable NSString *)assembleDisplayNameForContact:(CNContact * _Nonnull)person;
+ (nullable NSDictionary *)birthdayForContact:(NSDateComponents * _Nonnull) birthday;
+ (nullable NSArray *)addressesForContact:(CNContact * _Nonnull)person;
+ (nullable NSArray *)phoneNumbersForContact:(CNContact * _Nonnull) person;
+ (nullable NSArray *)emailsForContact:(CNContact * _Nonnull) person;
+ (nullable NSArray *)socialProfilesForContact:(CNContact * _Nonnull)person;
+ (nullable NSArray *)instantMessageAddressesForContact:(CNContact * _Nonnull)person;
+ (nullable NSArray *)urlsForContact:(CNContact * _Nonnull) person;
+ (nullable NSArray *)datesForContact:(CNContact * _Nonnull)person;
+ (nullable NSArray *)relationsForContact:(CNContact * _Nonnull)person;
+ (nullable NSDictionary *)encodeContainer:(CNContainer * _Nonnull)container;
+ (nullable NSDictionary *)encodeGroup:(CNGroup * _Nonnull)group;

+ (nullable NSDateComponents *)decodeBirthday:(nullable NSDictionary *)input contact:(CNContact *_Nonnull)contact;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeAddresses:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodePhoneNumbers:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeEmailAddresses:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeSocialProfiles:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeInstantMessageAddresses:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeUrlAddresses:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeRelationships:(nullable NSArray *)input;
+ (nullable NSMutableArray<CNLabeledValue *> *)decodeDates:(nullable NSArray *)input;

@end
