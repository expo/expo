// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationsDelegate.h>

@interface ABI42_0_0EXNotificationCategoriesModule : ABI42_0_0UMExportedModule <ABI42_0_0EXNotificationsDelegate>

- (void)getNotificationCategoriesAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve reject:(ABI42_0_0UMPromiseRejectBlock)reject;
- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI42_0_0UMPromiseResolveBlock)resolve 
                                       reject:(ABI42_0_0UMPromiseRejectBlock)reject;
- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI42_0_0UMPromiseResolveBlock)resolve 
                                          reject:(ABI42_0_0UMPromiseRejectBlock)reject;
- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category;
- (UNNotificationCategory *)createCategoryWithId:(NSString*)categoryId
                                         actions:(NSArray *)actions
                                         options:(NSDictionary *)options;
- (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category;
- (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions;
- (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options;

@end
