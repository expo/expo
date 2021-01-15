#import "SEGGroupPayload.h"


@implementation SEGGroupPayload

- (instancetype)initWithGroupId:(NSString *)groupId
                         traits:(NSDictionary *)traits
                        context:(NSDictionary *)context
                   integrations:(NSDictionary *)integrations
{
    if (self = [super initWithContext:context integrations:integrations]) {
        _groupId = [groupId copy];
        _traits = [traits copy];
    }
    return self;
}

@end
