// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationCategoriesModule.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

@interface EXNotificationCategoriesModule ()

@property (nonatomic, weak) id<EXNotificationCenterDelegate> notificationCenterDelegate;

@end

@implementation EXNotificationCategoriesModule

UM_EXPORT_MODULE(ExpoNotificationCategoriesModule);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _notificationCenterDelegate = [moduleRegistry getModuleImplementingProtocol:@protocol(EXNotificationCenterDelegate)];
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(getCategoriesAsync,
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableArray* existingCategories = [NSMutableArray new];
    for (UNNotificationCategory *category in categories) {
      NSMutableDictionary *categoryDictionary = [NSMutableDictionary dictionary];
      categoryDictionary[@"identifier"] = category.identifier;
      categoryDictionary[@"actionIds"] = [self parseIdsFromActions: category.actions];
      if (@available(iOS 11, *)) {
        categoryDictionary[@"hiddenPreviewsBodyPlaceholder"] = category.hiddenPreviewsBodyPlaceholder;
      }
      [existingCategories addObject:categoryDictionary];
    }
    resolve(existingCategories);
  }];
}

UM_EXPORT_METHOD_AS(createCategoryAsync,
                 createCategoryWithCategoryId:(NSString *)categoryId
                 actions:(NSArray *)actions
                 previewPlaceholder:(NSString *)previewPlaceholder
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  NSMutableArray<UNNotificationAction *> *actionsArray = [[NSMutableArray alloc] init];
  for (NSDictionary<NSString *, id> *actionParams in actions) {
    [actionsArray addObject:[self parseNotificationActionFromParams:actionParams]];
  }

  UNNotificationCategory *newCategory;
  if (@available(iOS 11, *)) {
    newCategory = [UNNotificationCategory categoryWithIdentifier:[self internalIdForIdentifier:categoryId]
                                                                               actions:actionsArray
                                                                     intentIdentifiers:@[]
                                                                     hiddenPreviewsBodyPlaceholder: previewPlaceholder
                                                                               options:UNNotificationCategoryOptionNone];
  } else {
    newCategory = [UNNotificationCategory categoryWithIdentifier:[self internalIdForIdentifier:categoryId]
                                                                  actions:actionsArray
                                                                  intentIdentifiers:@[]
                                                                  options:UNNotificationCategoryOptionNone];
  }
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:newCategory.identifier]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [newCategories addObject:newCategory];
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

UM_EXPORT_METHOD_AS(deleteCategoryAsync,
                 deleteCategoryWithCategoryId:(NSString *)categoryId
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  NSString *internalCategoryId = [self internalIdForIdentifier:categoryId];
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:internalCategoryId]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

# pragma mark- Internal

- (NSString *)internalIdForIdentifier:(NSString *)identifier
{
  // if NOT bare, return [NSString stringWithFormat:@"%@%@%@", experienceId, scopedIdentifierSeparator, identifier];
  // else
  return identifier;
}

- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *actionId = [self internalIdForIdentifier:params[@"actionId"]];
  NSString *buttonTitle = params[@"buttonTitle"];

  UNNotificationActionOptions options = UNNotificationActionOptionNone;
  if (![params[@"doNotOpenInForeground"] boolValue]) {
    options += UNNotificationActionOptionForeground;
  }
  if ([params[@"isDestructive"] boolValue]) {
    options += UNNotificationActionOptionDestructive;
  }
  if ([params[@"isAuthenticationRequired"] boolValue]) {
    options += UNNotificationActionOptionAuthenticationRequired;
  }

  if ([params[@"textInput"] isKindOfClass:[NSDictionary class]]) {
    return [UNTextInputNotificationAction actionWithIdentifier:actionId
                                                         title:buttonTitle
                                                       options:options
                                          textInputButtonTitle:params[@"textInput"][@"submitButtonTitle"]
                                          textInputPlaceholder:params[@"textInput"][@"placeholder"]];
  }

  return [UNNotificationAction actionWithIdentifier:actionId title:buttonTitle options:options];
}

- (NSMutableArray *)parseIdsFromActions:(NSArray<UNNotificationAction *> *)actions
{
  NSMutableArray* ids = [NSMutableArray new];
  for (UNNotificationAction *action in actions) {
    [ids addObject:action.identifier];
  }
  return ids;
}

@end
