#import "SEGSegmentIntegrationFactory.h"
#import "SEGSegmentIntegration.h"


@implementation SEGSegmentIntegrationFactory

- (id)initWithHTTPClient:(SEGHTTPClient *)client storage:(id<SEGStorage>)storage
{
    if (self = [super init]) {
        _client = client;
        _storage = storage;
    }
    return self;
}

- (id<SEGIntegration>)createWithSettings:(NSDictionary *)settings forAnalytics:(SEGAnalytics *)analytics
{
    return [[SEGSegmentIntegration alloc] initWithAnalytics:analytics httpClient:self.client storage:self.storage];
}

- (NSString *)key
{
    return @"Segment.io";
}

@end
