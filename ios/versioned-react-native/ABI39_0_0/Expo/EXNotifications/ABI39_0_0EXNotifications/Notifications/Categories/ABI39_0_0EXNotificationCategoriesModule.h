// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsDelegate.h>

@interface ABI39_0_0EXNotificationCategoriesModule : ABI39_0_0UMExportedModule <ABI39_0_0EXNotificationsDelegate>

- (void)getNotificationCategoriesAsyncWithResolver:(ABI39_0_0UMPromiseResolveBlock)resolve reject:(ABI39_0_0UMPromiseRejectBlock)reject;
- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI39_0_0UMPromiseResolveBlock)resolve 
                                       reject:(ABI39_0_0UMPromiseRejectBlock)reject;
- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI39_0_0UMPromiseResolveBlock)resolve 
                                          reject:(ABI39_0_0UMPromiseRejectBlock)reject;
- (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category;
- (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions;
- (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options;

@end
