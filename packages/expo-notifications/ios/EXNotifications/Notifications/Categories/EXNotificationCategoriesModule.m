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

UM_EXPORT_METHOD_AS(getNotificationCategoriesAsync,
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableArray* existingCategories = [NSMutableArray new];
    for (UNNotificationCategory *category in categories) {
      [existingCategories addObject:[self parseCategoryToJson:category]];
    }
    resolve(existingCategories);
  }];
}

UM_EXPORT_METHOD_AS(setNotificationCategoryAsync,
                 setNotificationCategoryWithCategoryId:(NSString *)categoryId
                 actions:(NSArray *)actions
                 options:(NSDictionary *)options
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  NSArray<NSString *> *intentIdentifiers = options[@"intentIdentifiers"];
  NSString *previewPlaceholder = options[@"previewPlaceholder"];
  NSString *categorySummaryFormat = options[@"categorySummaryFormat"];

  NSMutableArray<UNNotificationAction *> *actionsArray = [[NSMutableArray alloc] init];
  for (NSDictionary<NSString *, id> *actionParams in actions) {
    [actionsArray addObject:[self parseNotificationActionFromParams:actionParams]];
  }
  UNNotificationCategoryOptions categoryOptions = [self parseNotificationCategoryOptionsFromParams: options];
  UNNotificationCategory *newCategory;
  if (@available(iOS 12, *)) {
    newCategory = [UNNotificationCategory categoryWithIdentifier:categoryId
                                                         actions:actionsArray
                                               intentIdentifiers:intentIdentifiers
                                   hiddenPreviewsBodyPlaceholder:previewPlaceholder
                                           categorySummaryFormat:categorySummaryFormat
                                                         options:categoryOptions];
  } else if (@available(iOS 11, *)) {
    newCategory = [UNNotificationCategory categoryWithIdentifier:categoryId
                                                         actions:actionsArray
                                               intentIdentifiers:intentIdentifiers
                                   hiddenPreviewsBodyPlaceholder:previewPlaceholder
                                                         options:categoryOptions];
  } else {
    newCategory = [UNNotificationCategory categoryWithIdentifier:categoryId
                                                         actions:actionsArray
                                               intentIdentifiers:intentIdentifiers
                                                         options:categoryOptions];
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
    resolve([self parseCategoryToJson:newCategory]);
  }];
}

UM_EXPORT_METHOD_AS(deleteNotificationCategoryAsync,
                 deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  __block NSNumber *didDelete = [NSNumber numberWithBool:NO];
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:categoryId]) {
        [newCategories removeObject:category];
        didDelete = [NSNumber numberWithBool:YES];
        break;
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve(didDelete);
  }];
}

# pragma mark- Internal

- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
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

- (UNNotificationCategoryOptions )parseNotificationCategoryOptionsFromParams:(NSDictionary *)params
{
  UNNotificationCategoryOptions options = UNNotificationCategoryOptionNone;
  if ([params[@"customDismissAction"] boolValue]) {
    options += UNNotificationCategoryOptionCustomDismissAction;
  }
  if ([params[@"allowInCarPlay"] boolValue]) {
    options += UNNotificationCategoryOptionAllowInCarPlay;
  }
  if (@available(iOS 11, *)) {
    if ([params[@"showTitle"] boolValue]) {
      options += UNNotificationCategoryOptionHiddenPreviewsShowTitle;
    }
    if ([params[@"showSubtitle"] boolValue]) {
      options += UNNotificationCategoryOptionHiddenPreviewsShowSubtitle;
    }
  }
  if (@available(iOS 13, *)) {
    if ([params[@"allowAnnouncement"] boolValue]) {
      options += UNNotificationCategoryOptionAllowAnnouncement;
    }
  }

  return options;
}

- (NSMutableDictionary *)parseCategoryToJson:(UNNotificationCategory *)category
{
  NSMutableDictionary* parsedCategory = [NSMutableDictionary dictionary];
  parsedCategory[@"identifier"] = category.identifier;
  parsedCategory[@"actions"] = [self parseActions: category.actions];
  parsedCategory[@"options"] = [self parseCategoryOptions: category];
  return parsedCategory;
}

- (NSMutableDictionary *)parseCategoryOptions:(UNNotificationCategory *)category
{
  NSMutableDictionary* parsedOptions = [NSMutableDictionary dictionary];
  parsedOptions[@"intentIdentifiers"] = category.intentIdentifiers;
  parsedOptions[@"customDismissAction"] =  [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionCustomDismissAction) != 0)];
  parsedOptions[@"allowInCarPlay"] = [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionAllowInCarPlay) != 0)];
  if (@available(iOS 11, *)) {
    parsedOptions[@"previewPlaceholder"] = category.hiddenPreviewsBodyPlaceholder;
    parsedOptions[@"showTitle"] =  [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionHiddenPreviewsShowTitle) != 0)];
    parsedOptions[@"showSubtitle"] = [NSNumber numberWithBool:((category.options & UNNotificationCategoryOptionHiddenPreviewsShowSubtitle) != 0)];
  }
  if (@available(iOS 12, *)) {
    parsedOptions[@"categorySummaryFormat"] = category.categorySummaryFormat;
  }
  if (@available(iOS 13, *)) {
    parsedOptions[@"allowAnnouncement"] = [NSNumber numberWithBool:((category.options & UNNotificationActionOptionAuthenticationRequired) != 0)];
  }
  return parsedOptions;
}

- (NSMutableArray *)parseActions:(NSArray *)actions
{
  NSMutableArray* parsedActions = [NSMutableArray new];
  for (NSUInteger i = 0; i < [actions count]; i++)
  {
    NSMutableDictionary *actionDictionary = [NSMutableDictionary dictionary];
    if ([actions[i] isKindOfClass:[UNTextInputNotificationAction class]]) {
      UNTextInputNotificationAction *action = actions[i];
      NSMutableDictionary *textInputOptions = [NSMutableDictionary dictionary];
      textInputOptions[@"placeholder"] = action.textInputPlaceholder;
      textInputOptions[@"submitButtonTitle"] = action.textInputButtonTitle;
      actionDictionary[@"textInput"] = textInputOptions;
      actionDictionary[@"buttonTitle"] = action.title;
      actionDictionary[@"identifier"] = action.identifier;
      actionDictionary[@"options"] = [self parseActionOptions:action.options];
    } else {
      UNNotificationAction *action = actions[i];
      actionDictionary[@"buttonTitle"] = action.title;
      actionDictionary[@"identifier"] = action.identifier;
      actionDictionary[@"options"] = [self parseActionOptions:action.options];
    }
    [parsedActions addObject:actionDictionary];
  }
  return parsedActions;
}

- (NSMutableDictionary *)parseActionOptions:(NSUInteger)options
{
  NSMutableDictionary* parsedOptions = [NSMutableDictionary dictionary];
  parsedOptions[@"opensAppToForeground"] =  [NSNumber numberWithBool:((options & UNNotificationActionOptionForeground) != 0)];
  parsedOptions[@"isDestructive"] = [NSNumber numberWithBool:((options & UNNotificationActionOptionDestructive) != 0)];
  parsedOptions[@"isAuthenticationRequired"] = [NSNumber numberWithBool:((options & UNNotificationActionOptionAuthenticationRequired) != 0)];
  return parsedOptions;
}

@end
