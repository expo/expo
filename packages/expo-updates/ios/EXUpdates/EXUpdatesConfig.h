//  Copyright © 2019 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesConfig : NSObject

@property (nonatomic, readonly) NSURL *remoteUrl;
@property (nonatomic, readonly) NSString *releaseChannel;

+ (instancetype)sharedInstance;

@end

NS_ASSUME_NONNULL_END
