// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedNotificationCategoriesModule.h"

@interface ABI40_0_0EXScopedNotificationCategoriesModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI40_0_0EXScopedNotificationCategoriesModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (void)getNotificationCategoriesAsyncWithResolver:(ABI40_0_0UMPromiseResolveBlock)resolve reject:(ABI40_0_0UMPromiseRejectBlock)reject
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableArray* existingCategories = [NSMutableArray new];
    for (UNNotificationCategory *category in categories) {
      if ([category.identifier hasPrefix:self->_experienceId]) {
        [existingCategories addObject:[self serializeCategory:category]];
      }
    }
    resolve(existingCategories);
  }];
}

- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI40_0_0UMPromiseResolveBlock)resolve 
                                       reject:(ABI40_0_0UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [NSString stringWithFormat:@"%@-%@", _experienceId, categoryId];
  [super setNotificationCategoryWithCategoryId:scopedCategoryIdentifier actions:actions options:options resolve:resolve reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI40_0_0UMPromiseResolveBlock)resolve 
                                          reject:(ABI40_0_0UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [NSString stringWithFormat:@"%@-%@", _experienceId, categoryId];
  [super deleteNotificationCategoryWithCategoryId:scopedCategoryIdentifier resolve:resolve reject:reject];
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [NSMutableDictionary dictionary];
  NSString* experienceIdPrefix = [NSString stringWithFormat:@"%@-", _experienceId];
  serializedCategory[@"identifier"] = [category.identifier stringByReplacingOccurrencesOfString:experienceIdPrefix withString:@""];
  serializedCategory[@"actions"] = [super serializeActions: category.actions];
  serializedCategory[@"options"] = [super serializeCategoryOptions: category];
  return serializedCategory;
}

@end
