// Copyright 2016-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>

#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

#import <EXNotifications/EXMailbox.h>
#import <EXNotifications/EXPostOffice.h>
#import <EXNotifications/EXThreadSafePostOffice.h>

#import <EXNotifications/EXOnTokenChangeListener.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotifications : UMExportedModule <EXMailbox,
                                               UMModuleRegistryConsumer,
                                               UMEventEmitter,
                                               EXOnTokenChangeListener>

@end

NS_ASSUME_NONNULL_END
