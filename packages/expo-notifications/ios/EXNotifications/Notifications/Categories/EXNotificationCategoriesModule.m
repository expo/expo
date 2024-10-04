// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationCategoriesModule.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

@implementation EXNotificationCategoriesModule

EX_EXPORT_MODULE(ExpoNotificationCategoriesModule);

# pragma mark - Exported methods

EX_EXPORT_METHOD_AS(getNotificationCategoriesAsync,
                 getNotificationCategoriesAsyncWithResolver:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableArray* existingCategories = [NSMutableArray new];
    for (UNNotificationCategory *category in categories) {
      [existingCategories addObject:[self serializeCategory:category]];
    }
    resolve(existingCategories);
  }];
}

EX_EXPORT_METHOD_AS(setNotificationCategoryAsync,
                 setNotificationCategoryWithCategoryId:(NSString *)categoryId
                 actions:(NSArray *)actions
                 options:(NSDictionary *)options
                 resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject)
{
  UNNotificationCategory *newCategory = [EXNotificationCategoriesModule createCategoryWithId:categoryId
                                                                                     actions:actions
                                                                                     options:options];
  
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy] ?: [[NSMutableSet alloc] init];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:newCategory.identifier]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [newCategories addObject:newCategory];
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve([self serializeCategory:newCategory]);
  }];
}

EX_EXPORT_METHOD_AS(deleteNotificationCategoryAsync,
                 deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                 resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    BOOL didDelete = NO;
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:categoryId]) {
        [newCategories removeObject:category];
        didDelete = YES;
        break;
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve(@(didDelete));
  }];
}

# pragma mark- Internal

+ (UNNotificationCategory *)createCategoryWithId:(NSString*)categoryId
                                         actions:(NSArray *)actions
                                         options:(NSDictionary *)options
{
  NSArray<NSString *> *intentIdentifiers = options[@"intentIdentifiers"];
  NSString *previewPlaceholder = options[@"previewPlaceholder"];
  NSString *categorySummaryFormat = options[@"categorySummaryFormat"];

  NSMutableArray<UNNotificationAction *> *actionsArray = [[NSMutableArray alloc] init];
  for (NSDictionary<NSString *, id> *actionParams in actions) {
    [actionsArray addObject:[self parseNotificationActionFromParams:actionParams]];
  }
  UNNotificationCategoryOptions categoryOptions = [self parseNotificationCategoryOptionsFromParams: options];
  return [UNNotificationCategory categoryWithIdentifier:categoryId
                                                actions:actionsArray
                                      intentIdentifiers:intentIdentifiers
                          hiddenPreviewsBodyPlaceholder:previewPlaceholder
                                  categorySummaryFormat:categorySummaryFormat
                                                options:categoryOptions];
}

+ (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *identifier = params[@"identifier"];
  NSString *buttonTitle = params[@"buttonTitle"];
  UNNotificationActionOptions options = UNNotificationActionOptionNone;

  if (params[@"options"][@"opensAppToForeground"] == nil || [params[@"options"][@"opensAppToForeground"] boolValue]) {
    options += UNNotificationActionOptionForeground;
  }
  if ([params[@"options"][@"isDestructive"] boolValue]) {
    options += UNNotificationActionOptionDestructive;
  }
  if ([params[@"options"][@"isAuthenticationRequired"] boolValue]) {
    options += UNNotificationActionOptionAuthenticationRequired;
  }

  if ([params[@"textInput"] isKindOfClass:[NSDictionary class]]) {
    return [UNTextInputNotificationAction actionWithIdentifier:identifier
                                                         title:buttonTitle
                                                       options:options
                                          textInputButtonTitle:params[@"textInput"][@"submitButtonTitle"]
                                          textInputPlaceholder:params[@"textInput"][@"placeholder"]];
  }

  return [UNNotificationAction actionWithIdentifier:identifier title:buttonTitle options:options];
}

+ (UNNotificationCategoryOptions )parseNotificationCategoryOptionsFromParams:(NSDictionary *)params
{
  UNNotificationCategoryOptions options = UNNotificationCategoryOptionNone;
  if ([params[@"customDismissAction"] boolValue]) {
    options += UNNotificationCategoryOptionCustomDismissAction;
  }
  if ([params[@"allowInCarPlay"] boolValue]) {
    options += UNNotificationCategoryOptionAllowInCarPlay;
  }
  if ([params[@"showTitle"] boolValue]) {
    options += UNNotificationCategoryOptionHiddenPreviewsShowTitle;
  }
  if ([params[@"showSubtitle"] boolValue]) {
    options += UNNotificationCategoryOptionHiddenPreviewsShowSubtitle;
  }

  return options;
}

- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedCategory = [NSMutableDictionary dictionary];
  serializedCategory[@"identifier"] = category.identifier;
  serializedCategory[@"actions"] = [self serializeActions: category.actions];
  serializedCategory[@"options"] = [self serializeCategoryOptions: category];
  return serializedCategory;
}

- (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category
{
  NSMutableDictionary* serializedOptions = [NSMutableDictionary dictionary];
  serializedOptions[@"intentIdentifiers"] = category.intentIdentifiers;
  serializedOptions[@"customDismissAction"] =  [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionCustomDismissAction) != 0)];
  serializedOptions[@"allowInCarPlay"] = [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionAllowInCarPlay) != 0)];
  serializedOptions[@"previewPlaceholder"] = category.hiddenPreviewsBodyPlaceholder;
  serializedOptions[@"showTitle"] =  [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionHiddenPreviewsShowTitle) != 0)];
  serializedOptions[@"showSubtitle"] = [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionHiddenPreviewsShowSubtitle) != 0)];
  serializedOptions[@"categorySummaryFormat"] = category.categorySummaryFormat;
  serializedOptions[@"allowAnnouncement"] = [NSNumber numberWithBool:((category.options & UNNotificationActionOptionAuthenticationRequired) != 0)];
  return serializedOptions;
}

- (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions
{
  NSMutableArray* serializedActions = [NSMutableArray new];
  for (NSUInteger i = 0; i < [actions count]; i++)
  {
    NSMutableDictionary *actionDictionary = [NSMutableDictionary dictionary];
    actionDictionary[@"buttonTitle"] = actions[i].title;
    actionDictionary[@"identifier"] = actions[i].identifier;
    actionDictionary[@"options"] = [self serializeActionOptions:actions[i].options];
    if ([actions[i] isKindOfClass:[UNTextInputNotificationAction class]]) {
      UNTextInputNotificationAction *textInputAction = (UNTextInputNotificationAction *)actions[i];
      NSMutableDictionary *textInputOptions = [NSMutableDictionary dictionary];
      textInputOptions[@"placeholder"] = textInputAction.textInputPlaceholder;
      textInputOptions[@"submitButtonTitle"] = textInputAction.textInputButtonTitle;
      actionDictionary[@"textInput"] = textInputOptions;
    }
    [serializedActions addObject:actionDictionary];
  }
  return serializedActions;
}

- (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options
{
  NSMutableDictionary* serializedOptions = [NSMutableDictionary dictionary];
  serializedOptions[@"opensAppToForeground"] =  [NSNumber numberWithBool:((options & UNNotificationActionOptionForeground) != 0)];
  serializedOptions[@"isDestructive"] = [NSNumber numberWithBool:((options & UNNotificationActionOptionDestructive) != 0)];
  serializedOptions[@"isAuthenticationRequired"] = [NSNumber numberWithBool:((options & UNNotificationActionOptionAuthenticationRequired) != 0)];
  return serializedOptions;
}

@end
