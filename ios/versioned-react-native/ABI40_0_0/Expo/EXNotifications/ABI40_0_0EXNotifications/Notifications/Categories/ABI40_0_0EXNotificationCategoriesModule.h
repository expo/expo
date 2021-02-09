// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsDelegate.h>

@interface ABI40_0_0EXNotificationCategoriesModule : ABI40_0_0UMExportedModule <ABI40_0_0EXNotificationsDelegate>

- (void)getNotificationCategoriesAsyncWithResolver:(ABI40_0_0UMPromiseResolveBlock)resolve reject:(ABI40_0_0UMPromiseRejectBlock)reject;
- (void)setNotificationCategoryWithCategoryId:(NSString *)categoryId
                                      actions:(NSArray *)actions
                                      options:(NSDictionary *)options
                                      resolve:(ABI40_0_0UMPromiseResolveBlock)resolve 
                                       reject:(ABI40_0_0UMPromiseRejectBlock)reject;
- (void)deleteNotificationCategoryWithCategoryId:(NSString *)categoryId
                                         resolve:(ABI40_0_0UMPromiseResolveBlock)resolve 
                                          reject:(ABI40_0_0UMPromiseRejectBlock)reject;
- (NSMutableDictionary *)serializeCategoryOptions:(UNNotificationCategory *)category;
- (NSMutableArray *)serializeActions:(NSArray<UNNotificationAction *>*)actions;
- (NSMutableDictionary *)serializeActionOptions:(NSUInteger)options;

@end
