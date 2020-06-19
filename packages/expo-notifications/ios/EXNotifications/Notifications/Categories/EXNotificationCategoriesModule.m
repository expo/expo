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
    resolve([self parseCategoryToJson:newCategory]);
  }];
}

UM_EXPORT_METHOD_AS(deleteNotificationCategoryAsync,
                 deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                 resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  NSString *internalCategoryId = [self internalIdForIdentifier:categoryId];
  __block NSNumber *didDelete = [NSNumber numberWithBool:NO];
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:internalCategoryId]) {
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

- (NSString *)internalIdForIdentifier:(NSString *)identifier
{
  // if NOT bare, return [NSString stringWithFormat:@"%@%@%@", experienceId, scopedIdentifierSeparator, identifier];
  // else
  return identifier;
}

- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *identifier = [self internalIdForIdentifier:params[@"identifier"]];
  NSString *buttonTitle = params[@"buttonTitle"];
  //NSDictionary *actionOptions = params[@"options"];
  UNNotificationActionOptions options = UNNotificationActionOptionNone;
  if (![params[@"options"][@"doNotOpenInForeground"] boolValue]) {
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

- (NSMutableDictionary *)parseCategoryToJson:(UNNotificationCategory *)category
{
  NSMutableDictionary* parsedCategory = [NSMutableDictionary dictionary];
  parsedCategory[@"identifier"] = category.identifier;
  parsedCategory[@"actions"] = [self parseActions: category.actions];
  if (@available(iOS 11, *)) {
    parsedCategory[@"hiddenPreviewsBodyPlaceholder"] = category.hiddenPreviewsBodyPlaceholder;
  }
  return parsedCategory;
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
      actionDictionary[@"options"] = [self parseOptions:action.options];
    } else {
      UNNotificationAction *action = actions[i];
      actionDictionary[@"buttonTitle"] = action.title;
      actionDictionary[@"identifier"] = action.identifier;
      actionDictionary[@"options"] = [self parseOptions:action.options];
    }
    [parsedActions addObject:actionDictionary];
  }
  return parsedActions;
}

- (NSMutableDictionary *)parseOptions:(NSUInteger)options
{
  NSMutableDictionary* parsedOptions = [NSMutableDictionary dictionary];
  parsedOptions[@"doNotOpenInForeground"] =  [NSNumber numberWithBool:((options & UNNotificationActionOptionForeground) == 0)];
  parsedOptions[@"isDestructive"] = [NSNumber numberWithBool:((options & UNNotificationActionOptionDestructive) != 0)];
  parsedOptions[@"isAuthenticationRequired"] = [NSNumber numberWithBool:((options & UNNotificationActionOptionAuthenticationRequired) != 0)];
  return parsedOptions;
}

@end
