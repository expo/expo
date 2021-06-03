//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdatesInterface/EXUpdatesInterface.h>

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDevLauncherController : NSObject <EXUpdatesInterface>

+ (instancetype)sharedInstance;

@end

NS_ASSUME_NONNULL_END
