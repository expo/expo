// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI42_0_0EXScopedNotificationCategoriesModule.h"
#import "ABI42_0_0EXScopedNotificationCategoryMigrator.h"
#import "ABI42_0_0EXScopedNotificationsUtils.h"

@interface ABI42_0_0EXScopedNotificationCategoriesModule ()

@property (nonatomic, strong) NSString *scopeKey;

@end

@implementation ABI42_0_0EXScopedNotificationCategoriesModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  return self;
}

- (void)getNotificationCategoriesAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableArray* existingCategories = [NSMutableArray new];
    for (UNNotificationCategory *category in categories) {
      if ([ABI42_0_0EXScopedNotificationsUtils isId:category.identifier scopedByExperience:self->_scopeKey]) {
        [existingCategories addObject:[self serializeCategory:category]];
      }
    }
    resolve(existingCategories);
  }];
}

- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                       reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [ABI42_0_0EXScopedNotificationsUtils scopedIdentifierFromId:categoryId
                                                                            forExperience:_scopeKey];
  [super setNotificationCategoryWithCategoryId:scopedCategoryIdentifier
                                       actions:actions
                                       options:options
                                       resolve:resolve
                                        reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                          reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [ABI42_0_0EXScopedNotificationsUtils scopedIdentifierFromId:categoryId
                                                                            forExperience:_scopeKey];
  [super deleteNotificationCategoryWithCategoryId:scopedCategoryIdentifier
                                          resolve:resolve
                                           reject:reject];
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [super serializeCategory:category];
  serializedCategory[@"identifier"] = [ABI42_0_0EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:serializedCategory[@"identifier"]].identifier;

  return serializedCategory;
}

#pragma mark - static method for migrating categories in both Expo Go and standalones. Added in SDK 41. TODO(Cruzan): Remove in SDK 47

+ (void)maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                                                           scopeKey:(NSString *)scopeKey
                                                                                   isInExpoGo:(BOOL)isInExpoGo
{
  if (isInExpoGo) {
    // Changed scoping prefix in SDK 41 FROM "experienceId-" to ESCAPED "experienceId/"
    [ABI42_0_0EXScopedNotificationCategoryMigrator migrateLegacyScopedCategoryIdentifiersForProjectWithScopeKey:scopeKey];
  } else {
    // Used to prefix with "experienceId-" even in standalone apps in SDKs <= 40, so we need to unscope those
    [ABI42_0_0EXScopedNotificationCategoryMigrator unscopeLegacyCategoryIdentifiersForProjectWithScopeKey:scopeKey];
  }
}

@end
