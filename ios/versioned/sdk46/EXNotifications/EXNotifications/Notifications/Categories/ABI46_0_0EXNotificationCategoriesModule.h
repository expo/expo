// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationsDelegate.h>

@interface ABI46_0_0EXNotificationCategoriesModule : ABI46_0_0EXExportedModule <ABI46_0_0EXNotificationsDelegate>

- (void)getNotificationCategoriesAsyncWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve reject:(ABI46_0_0EXPromiseRejectBlock)reject;
- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI46_0_0EXPromiseResolveBlock)resolve 
                                       reject:(ABI46_0_0EXPromiseRejectBlock)reject;
- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI46_0_0EXPromiseResolveBlock)resolve 
                                          reject:(ABI46_0_0EXPromiseRejectBlock)reject;
- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category;
- (UNNotificationCategory *)createCategoryWithId:(NSString*)categoryId
                                         actions:(NSArray *)actions
                                         options:(NSDictionary *)options;
- (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category;
- (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions;
- (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options;

@end
