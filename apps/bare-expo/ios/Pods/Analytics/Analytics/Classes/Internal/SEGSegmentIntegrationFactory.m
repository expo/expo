#import "SEGSegmentIntegrationFactory.h"
#import "SEGSegmentIntegration.h"


@implementation SEGSegmentIntegrationFactory

- (id)initWithHTTPClient:(SEGHTTPClient *)client fileStorage:(id<SEGStorage>)fileStorage userDefaultsStorage:(id<SEGStorage>)userDefaultsStorage
{
    if (self = [super init]) {
        _client = client;
        _userDefaultsStorage = userDefaultsStorage;
        _fileStorage = fileStorage;
    }
    return self;
}

- (id<SEGIntegration>)createWithSettings:(NSDictionary *)settings forAnalytics:(SEGAnalytics *)analytics
{
    return [[SEGSegmentIntegration alloc] initWithAnalytics:analytics httpClient:self.client fileStorage:self.fileStorage userDefaultsStorage:self.userDefaultsStorage];
}

- (NSString *)key
{
    return @"Segment.io";
}

@end
