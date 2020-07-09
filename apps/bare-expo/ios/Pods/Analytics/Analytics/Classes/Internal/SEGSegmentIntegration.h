#import <Foundation/Foundation.h>
#import "SEGIntegration.h"
#import "SEGHTTPClient.h"
#import "SEGStorage.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const SEGSegmentDidSendRequestNotification;
extern NSString *const SEGSegmentRequestDidSucceedNotification;
extern NSString *const SEGSegmentRequestDidFailNotification;

/**
 * Filenames of "Application Support" files where essential data is stored.
 */
extern NSString *const kSEGUserIdFilename;
extern NSString *const kSEGQueueFilename;
extern NSString *const kSEGTraitsFilename;


@interface SEGSegmentIntegration : NSObject <SEGIntegration>

- (id)initWithAnalytics:(SEGAnalytics *)analytics httpClient:(SEGHTTPClient *)httpClient fileStorage:(id<SEGStorage>)fileStorage userDefaultsStorage:(id<SEGStorage>)userDefaultsStorage;

@end

NS_ASSUME_NONNULL_END
