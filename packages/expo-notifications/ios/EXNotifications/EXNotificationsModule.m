// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsModule.h>

@interface EXNotificationsModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXNotificationsModule

UM_EXPORT_MODULE(ExpoNotifications);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
