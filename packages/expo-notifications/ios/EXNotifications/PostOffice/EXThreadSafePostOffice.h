//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXPostOffice.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXThreadSafePostOffice : NSObject <EXPostOffice>

+ (id<EXPostOffice>)sharedInstance;

@end

NS_ASSUME_NONNULL_END
