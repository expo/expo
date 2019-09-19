//
//  EXOtaConfig.h
//  EXOta
//
//  Created by Michał Czernek on 18/09/2019.
//

#import <Foundation/Foundation.h>
#import <EXOtaUpdater.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaConfigBuilder: NSObject

@property (nonatomic, copy) NSString *username;
@property (nonatomic, copy) NSString *projectName;
@property (nonatomic, copy) NSString *releaseChannel;
@property (nonatomic, copy) NSString *sdkVersion;
@property (nonatomic) NSInteger apiVersion;
@property (nonatomic) NSInteger timeout;

@end

@interface EXExpoManifestRequestConfig : NSObject<EXManifestRequestConfig>

- (id)initWithBuilder:(void (^)(EXOtaConfigBuilder *))builderBlock;
- (id)initWithUsername:(NSString*)username withProjectName:(NSString*)projectName withReleaseChannel:(NSString*)channel withExpoSdkVersion:(NSString*)sdkVersion withApiVersion:(NSInteger)apiVersion withTimeout:(NSInteger)timeout;

@end

NS_ASSUME_NONNULL_END
