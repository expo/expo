#import "SEGIdentifyPayload.h"

@interface SEGIdentifyPayload ()
@property (nonatomic, readwrite, nullable) NSString *anonymousId;
@end

@implementation SEGIdentifyPayload

- (instancetype)initWithUserId:(NSString *)userId
                   anonymousId:(NSString *)anonymousId
                        traits:(NSDictionary *)traits
                       context:(NSDictionary *)context
                  integrations:(NSDictionary *)integrations
{
    if (self = [super initWithContext:context integrations:integrations]) {
        _userId = [userId copy];
        _anonymousId = [anonymousId copy];
        _traits = [traits copy];
    }
    return self;
}

@end
