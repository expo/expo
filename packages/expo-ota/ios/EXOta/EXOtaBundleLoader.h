//
//  EXOtaBundleLoader.h
//  EXOta
//
//  Created by Michał Czernek on 09/10/2019.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaBundleLoader : NSObject

- (id)initWithTimeout:(NSInteger) timeout;

- (void)loadJSBundleFromUrl:(NSString *)url withDirectory:(NSString *)directoryName withFileName:(NSString*)fileName success:(void (^)(NSString *path))successBlock error:(void (^)(NSError *error))errorBlock;

@end

NS_ASSUME_NONNULL_END
