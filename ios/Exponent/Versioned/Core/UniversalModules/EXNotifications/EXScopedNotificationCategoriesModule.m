// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoriesModule.h"
#import "EXScopedNotificationCategoryMigrator.h"
#import "EXScopedNotificationsUtils.h"

@interface EXScopedNotificationCategoriesModule ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, assign) BOOL isInExpoGo;

@end

@implementation EXScopedNotificationCategoriesModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
                 andConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _isInExpoGo = [@"expo" isEqualToString:constantsBinding.appOwnership];
    if (_isInExpoGo) {
      // Changed scoping prefix in SDK 41 FROM "experienceId-" to ESCAPED "experienceId/"
      [EXScopedNotificationCategoryMigrator migrateCategoriesToNewScopingPrefix:experienceId];
    } else {
      // Used to prefix with "experienceId-" even in standalone apps in SDKs <= 40, so we need to unscope those
      [EXScopedNotificationCategoryMigrator migrateCategoriesToUnscopedIdentifiers:experienceId];
    }
  }
  return self;
}

- (void)getNotificationCategoriesAsyncWithResolver:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  if (_isInExpoGo) {
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
      NSMutableArray* existingCategories = [NSMutableArray new];
      NSString *escapedExperienceId = [EXScopedNotificationsUtils escapedString:self->_experienceId];
      for (UNNotificationCategory *category in categories) {
        if ([category.identifier hasPrefix:escapedExperienceId]) {
          [existingCategories addObject:[self serializeCategory:category]];
        }
      }
      resolve(existingCategories);
    }];
  } else {
    [super getNotificationCategoriesAsyncWithResolver:resolve reject:reject];
  }
}

- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(UMPromiseResolveBlock)resolve
                                       reject:(UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [EXScopedNotificationsUtils scopedCategoryIdentifierWithId:categoryId
                                                                                    forExperience:_experienceId];
  [super setNotificationCategoryWithCategoryId:_isInExpoGo ? scopedCategoryIdentifier : categoryId
                                       actions:actions
                                       options:options
                                       resolve:resolve
                                        reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(UMPromiseResolveBlock)resolve
                                          reject:(UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [EXScopedNotificationsUtils scopedCategoryIdentifierWithId:categoryId
                                                                                    forExperience:_experienceId];
  [super deleteNotificationCategoryWithCategoryId: _isInExpoGo ? scopedCategoryIdentifier : categoryId
                                          resolve:resolve
                                           reject:reject];
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [EXNotificationCategoriesModule serializeCategory:category];
  if (_isInExpoGo) {
    serializedCategory[@"identifier"] = [EXScopedNotificationsUtils unscopedCategoryIdentifierWithId:serializedCategory[@"identifier"]
                                                                                       forExperience:_experienceId];
  }
  return serializedCategory;
}

@end
