// Copyright 2021-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXDevLauncherUpdatesHelper : NSObject

+ (NSDictionary *)createUpdatesConfigurationWithURL:(NSURL *)url
                                         projectURL:(NSURL *)projectURL
                                     runtimeVersion:(NSString *)runtimeVersion
                                     installationID:(NSString *)installationID;

@end

NS_ASSUME_NONNULL_END
