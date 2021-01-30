// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationCategoriesModule.h"
#import "EXScopedNotificationCategoryMigrator.h"

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
    _escapedExperienceId = [NSRegularExpression escapedPatternForString: experienceId];
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
  [super setNotificationCategoryWithCategoryId:_isInExpoGo ? [self scopeIdentifier:categoryId] : categoryId
                                       actions:actions
                                       options:options
                                       resolve:resolve
                                        reject:reject];
}

- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(UMPromiseResolveBlock)resolve
                                          reject:(UMPromiseRejectBlock)reject
{
  [super deleteNotificationCategoryWithCategoryId: _isInExpoGo ? [self scopeIdentifier:categoryId] : categoryId
                                          resolve:resolve
                                           reject:reject];
}

- (NSString *)scopeIdentifier:(NSString *)categoryId
{
  NSString *escapedCategoryId = [NSRegularExpression escapedPatternForString:categoryId];
  return [NSString stringWithFormat:@"%@/%@", _escapedExperienceId, escapedCategoryId];
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [EXNotificationCategoriesModule serializeCategory:category];
  if (_isInExpoGo) {
    // Double-escape experienceId for regex pattern
    NSString* scopingPrefixPattern = [NSString stringWithFormat:@"^%@(/|-)", [NSRegularExpression escapedPatternForString: _escapedExperienceId]];
    NSError *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:scopingPrefixPattern options:NSRegularExpressionCaseInsensitive error:&error];
    serializedCategory[@"identifier"] = [regex stringByReplacingMatchesInString:category.identifier options:0 range:NSMakeRange(0, [category.identifier length]) withTemplate:@""];
  }
  return serializedCategory;
}

@end
