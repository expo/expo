//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationRepository.h>
#import <EXNotifications/EXPostOffice.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSimplePostOffice : NSObject <EXPostOffice>

- (instancetype)initWithNotificationRepository:(id<EXNotificationRepository>)notificationRepository;

@end

NS_ASSUME_NONNULL_END
