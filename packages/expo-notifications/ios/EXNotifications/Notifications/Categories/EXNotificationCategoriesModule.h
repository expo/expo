// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <EXNotifications/EXNotificationsDelegate.h>

@interface EXNotificationCategoriesModule : UMExportedModule <EXNotificationsDelegate>

- (void)getNotificationCategoriesAsyncWithResolver:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject;
- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(UMPromiseResolveBlock)resolve 
                                       reject:(UMPromiseRejectBlock)reject;
- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(UMPromiseResolveBlock)resolve 
                                          reject:(UMPromiseRejectBlock)reject;
+ (UNNotificationCategory *)createCategoryWithId:(NSString*)categoryId
                                         actions:(NSArray *)actions
                                         options:(NSDictionary *)options;
+ (NSMutableDictionary *)serializeCategory:(UNNotificationCategory *)category;
+ (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category;
+ (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions;
+ (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options;

@end
