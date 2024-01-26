// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoriesModule.h"
#import "EXScopedNotificationCategoryMigrator.h"
#import "EXScopedNotificationsUtils.h"

@interface EXScopedNotificationCategoriesModule ()

@property (nonatomic, strong) NSString *scopeKey;

@end

@implementation EXScopedNotificationCategoriesModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  return self;
}

- (void)getNotificationCategoriesAsyncWithResolver:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableArray* existingCategories = [NSMutableArray new];
    for (UNNotificationCategory *category in categories) {
      if ([EXScopedNotificationsUtils isId:category.identifier scopedByExperience:self->_scopeKey]) {
        [existingCategories addObject:[self serializeCategory:category]];
      }
    }
    resolve(existingCategories);
  }];
}

- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(EXPromiseResolveBlock)resolve
                                       reject:(EXPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [EXScopedNotificationsUtils scopedIdentifierFromId:categoryId
                                                                            forExperience:_scopeKey];
  [super setNotificationCategoryWithCategoryId:scopedCategoryIdentifier
                                       actions:actions
                                       options:options
                                       resolve:resolve
                                        reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(EXPromiseResolveBlock)resolve
                                          reject:(EXPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [EXScopedNotificationsUtils scopedIdentifierFromId:categoryId
                                                                            forExperience:_scopeKey];
  [super deleteNotificationCategoryWithCategoryId:scopedCategoryIdentifier
                                          resolve:resolve
                                           reject:reject];
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [super serializeCategory:category];
  serializedCategory[@"identifier"] = [EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:serializedCategory[@"identifier"]].identifier;

  return serializedCategory;
}

#pragma mark - static method for migrating categories in both Expo Go and standalones. Added in SDK 41. TODO(Cruzan): Remove in SDK 47

+ (void)maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                                                 scopeKey:(NSString *)scopeKey
{
  // Changed scoping prefix in SDK 41 FROM "experienceId-" to ESCAPED "experienceId/"
  [EXScopedNotificationCategoryMigrator migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:scopeKey];
}

@end
