// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoriesModule.h"

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
    if (!_isInExpoGo) {
      [self unscopeExistingNotificationCategories];
    }
  }
  return self;
}

- (void)unscopeExistingNotificationCategories
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *previousCategory in newCategories) {
      if ([previousCategory.identifier hasPrefix:self->_experienceId]) {
        NSMutableDictionary *unscopedSerializedCategory = [self serializeCategory:previousCategory];
        UNNotificationCategory *newCategory = [super createCategoryWithId:unscopedSerializedCategory[@"identifier"]
                                                                  actions:unscopedSerializedCategory[@"actions"]
                                                                  options:unscopedSerializedCategory[@"options"]];
        [newCategories removeObject:previousCategory];
        [newCategories addObject:newCategory];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
  }];
}

- (void)getNotificationCategoriesAsyncWithResolver:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  if (_isInExpoGo) {
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
      NSMutableArray* existingCategories = [NSMutableArray new];
      for (UNNotificationCategory *category in categories) {
        if ([category.identifier hasPrefix:self->_experienceId]) {
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
  NSString *scopedCategoryIdentifier = [NSString stringWithFormat:@"%@-%@", _experienceId, categoryId];
  [super setNotificationCategoryWithCategoryId:_isInExpoGo ? scopedCategoryIdentifier : categoryId actions:actions options:options resolve:resolve reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(UMPromiseResolveBlock)resolve
                                          reject:(UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [NSString stringWithFormat:@"%@-%@", _experienceId, categoryId];
  [super deleteNotificationCategoryWithCategoryId:_isInExpoGo ? scopedCategoryIdentifier : categoryId resolve:resolve reject:reject];
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
