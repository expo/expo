// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoriesModule.h"

@interface EXScopedNotificationCategoriesModule ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, strong) NSString *escapedExperienceId;
@property (nonatomic, assign) BOOL isInExpoGo;

@end

@implementation EXScopedNotificationCategoriesModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
                 andConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _escapedExperienceId = [NSRegularExpression escapedPatternForString: experienceId];
    _isInExpoGo = [@"expo" isEqualToString:constantsBinding.appOwnership];
    if (!_isInExpoGo) {
      // Used to prefix with "experienceId-" even in standalone apps in SDKs <= 40, so we need to unscope those
      NSString *pattern = [NSString stringWithFormat:@"^%@-", experienceId];
      [self replaceAllCategoryIdPrefixesMatching:pattern withString:@""];
    } else {
      // Changed scoping prefix in SDK 41 FROM "experienceId-" to ESCAPED "experienceId/"
      NSString *pattern = [NSString stringWithFormat:@"^%@-", experienceId];
      [self replaceAllCategoryIdPrefixesMatching:pattern withString:[NSString stringWithFormat:@"%@/", _escapedExperienceId]];
    }
  }
  return self;
}

- (void)replaceAllCategoryIdPrefixesMatching:(NSString *)pattern
                                  withString:(NSString *)newPrefix
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    NSError *error = nil;
    BOOL didChangeCategories = NO;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:pattern options:NSRegularExpressionCaseInsensitive error:&error];
    for (UNNotificationCategory *previousCategory in categories) {
      if ([regex firstMatchInString:previousCategory.identifier options:0 range:NSMakeRange(0, [previousCategory.identifier length])]) {
        // Serialized categories do not contain the scoping prefix
        NSMutableDictionary *serializedCategory = [self serializeLegacyCategory:previousCategory];
        NSString *newCategoryId = [NSString stringWithFormat: @"%@%@", newPrefix, serializedCategory[@"identifier"]];
        UNNotificationCategory *newCategory = [super createCategoryWithId:newCategoryId
                                                                  actions:serializedCategory[@"actions"]
                                                                  options:serializedCategory[@"options"]];
        [newCategories removeObject:previousCategory];
        [newCategories addObject:newCategory];
        didChangeCategories = YES;
      }
    }
    if (didChangeCategories) {
      [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    }
  }];
}

- (void)getNotificationCategoriesAsyncWithResolver:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  if (_isInExpoGo) {
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
      NSMutableArray* existingCategories = [NSMutableArray new];
      for (UNNotificationCategory *category in categories) {
        if ([category.identifier hasPrefix:self->_escapedExperienceId]) {
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
  NSString *scopedCategoryIdentifier = [NSString stringWithFormat:@"%@/%@", _escapedExperienceId, categoryId];
  [super setNotificationCategoryWithCategoryId:scopedCategoryIdentifier actions:actions options:options resolve:resolve reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(UMPromiseResolveBlock)resolve
                                          reject:(UMPromiseRejectBlock)reject
{
  NSString *scopedCategoryIdentifier = [NSString stringWithFormat:@"%@/%@", _escapedExperienceId, categoryId];
  [super deleteNotificationCategoryWithCategoryId:scopedCategoryIdentifier resolve:resolve reject:reject];
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [NSMutableDictionary dictionary];
  // Double-escape experienceId for regex pattern
  NSString* scopingPrefixPattern = [NSString stringWithFormat:@"^%@(/|-)", [NSRegularExpression escapedPatternForString: _escapedExperienceId]];
  NSError *error = nil;
  NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:scopingPrefixPattern options:NSRegularExpressionCaseInsensitive error:&error];
  serializedCategory[@"identifier"] = [regex stringByReplacingMatchesInString:category.identifier options:0 range:NSMakeRange(0, [category.identifier length]) withTemplate:@""];
  serializedCategory[@"actions"] = [super serializeActions: category.actions];
  serializedCategory[@"options"] = [super serializeCategoryOptions: category];
  return serializedCategory;
}

// legacy categories were stored under an unescaped experienceId
- (NSMutableDictionary *)serializeLegacyCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [NSMutableDictionary dictionary];
  NSString* scopingPrefixPattern = [NSString stringWithFormat:@"^%@(/|-)", [NSRegularExpression escapedPatternForString: _experienceId]];
  NSError *error = nil;
  NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:scopingPrefixPattern options:NSRegularExpressionCaseInsensitive error:&error];
  serializedCategory[@"identifier"] = [regex stringByReplacingMatchesInString:category.identifier options:0 range:NSMakeRange(0, [category.identifier length]) withTemplate:@""];
  serializedCategory[@"actions"] = [super serializeActions: category.actions];
  serializedCategory[@"options"] = [super serializeCategoryOptions: category];
  return serializedCategory;
}

@end
