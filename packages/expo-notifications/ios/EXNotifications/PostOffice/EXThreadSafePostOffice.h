//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXPostOffice.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXThreadSafePostOffice : NSObject <EXPostOffice>

+ (id<EXPostOffice>)sharedInstance;

@end

NS_ASSUME_NONNULL_END
