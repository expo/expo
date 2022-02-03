// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsDelegate.h>

@interface ABI43_0_0EXNotificationCategoriesModule : ABI43_0_0EXExportedModule <ABI43_0_0EXNotificationsDelegate>

- (void)getNotificationCategoriesAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve reject:(ABI43_0_0EXPromiseRejectBlock)reject;
- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI43_0_0EXPromiseResolveBlock)resolve 
                                       reject:(ABI43_0_0EXPromiseRejectBlock)reject;
- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI43_0_0EXPromiseResolveBlock)resolve 
                                          reject:(ABI43_0_0EXPromiseRejectBlock)reject;
- (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category;
- (UNNotificationCategory *)createCategoryWithId:(NSString*)categoryId
                                         actions:(NSArray *)actions
                                         options:(NSDictionary *)options;
- (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category;
- (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions;
- (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options;

@end
