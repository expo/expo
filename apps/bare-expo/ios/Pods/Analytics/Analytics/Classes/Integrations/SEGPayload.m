#import "SEGPayload.h"


@implementation SEGPayload

- (instancetype)initWithContext:(NSDictionary *)context integrations:(NSDictionary *)integrations
{
    if (self = [super init]) {
        _context = [context copy];
        _integrations = [integrations copy];
    }
    return self;
}

@end


@implementation SEGApplicationLifecyclePayload

@end


@implementation SEGRemoteNotificationPayload

@end


@implementation SEGContinueUserActivityPayload

@end


@implementation SEGOpenURLPayload

@end
