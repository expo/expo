#import <Foundation/Foundation.h>
#import "SEGAnalytics.h"

// TODO: Make this configurable via SEGAnalyticsConfiguration
// NOTE: `/` at the end kind of screws things up. So don't use it
//#define SEGMENT_API_BASE [NSURL URLWithString:@"https://api-segment-io-5fsaj1xnikhp.runscope.net/v1"]
//#define SEGMENT_CDN_BASE [NSURL URLWithString:@"https://cdn-segment-com-5fsaj1xnikhp.runscope.net/v1"]
//#define MOBILE_SERVICE_BASE [NSURL URLWithString:@"https://mobile--service-segment-com-5fsaj1xnikhp.runscope.net/v1"]
#define SEGMENT_API_BASE [NSURL URLWithString:@"https://api.segment.io/v1"]
#define SEGMENT_CDN_BASE [NSURL URLWithString:@"https://cdn-settings.segment.com/v1"]
#define MOBILE_SERVICE_BASE [NSURL URLWithString:@"https://mobile-service.segment.com/v1"]

NS_ASSUME_NONNULL_BEGIN


@interface SEGHTTPClient : NSObject

@property (nonatomic, strong) SEGRequestFactory requestFactory;
@property (nonatomic, readonly) NSMutableDictionary<NSString *, NSURLSession *> *sessionsByWriteKey;
@property (nonatomic, readonly) NSURLSession *genericSession;

+ (SEGRequestFactory)defaultRequestFactory;
+ (NSString *)authorizationHeader:(NSString *)writeKey;

- (instancetype)initWithRequestFactory:(SEGRequestFactory _Nullable)requestFactory;

/**
 * Upload dictionary formatted as per https://segment.com/docs/sources/server/http/#batch.
 * This method will convert the dictionary to json, gzip it and upload the data.
 * It will respond with retry = YES if the batch should be reuploaded at a later time.
 * It will ask to retry for json errors and 3xx/5xx codes, and not retry for 2xx/4xx response codes.
 * NOTE: You need to re-dispatch within the completionHandler onto a desired queue to avoid threading issues.
 * Completion handlers are called on a dispatch queue internal to SEGHTTPClient. 
 */
- (NSURLSessionUploadTask *)upload:(JSON_DICT)batch forWriteKey:(NSString *)writeKey completionHandler:(void (^)(BOOL retry))completionHandler;

- (NSURLSessionDataTask *)settingsForWriteKey:(NSString *)writeKey completionHandler:(void (^)(BOOL success, JSON_DICT _Nullable settings))completionHandler;

- (NSURLSessionDataTask *)attributionWithWriteKey:(NSString *)writeKey forDevice:(JSON_DICT)context completionHandler:(void (^)(BOOL success, JSON_DICT _Nullable properties))completionHandler;

@end

NS_ASSUME_NONNULL_END
