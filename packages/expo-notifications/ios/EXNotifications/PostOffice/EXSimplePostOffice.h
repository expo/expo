//  Copyright © 2019-present 650 Industries. All rights reserved.


#import <Foundation/Foundation.h>
#import "EXPostOffice.h"
#import "EXNotificationRepository.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXSimplePostOffice : NSObject <EXPostOffice>

- (instancetype)initWithNotificationRepository:(id<EXNotificationRepository>)notificationRepository;

@end

NS_ASSUME_NONNULL_END
