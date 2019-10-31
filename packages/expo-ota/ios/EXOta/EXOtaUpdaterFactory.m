//
//  EXOtaUpdaterFactory.m
//  EXOta
//
//  Created by Michał Czernek on 11/10/2019.
//

#import "EXOtaUpdaterFactory.h"

@implementation EXOtaUpdaterFactory

NSMutableDictionary *updaters;

- (id)init
{
    updaters = [[NSMutableDictionary alloc] init];
    return self;
}

+ (id)sharedFactory
{
    static EXOtaUpdaterFactory *factory = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        factory = [[self alloc] init];
    });
    return factory;
}

- (EXOtaUpdater*)updaterForId:(NSString* _Nullable)identifier initWithConfig:(nonnull id<EXOtaConfig>)config withPersistance:(nonnull EXOtaPersistance *)persistance
{
    if(identifier == nil)
    {
        NSArray *values = [updaters allValues];
        if([values count] == 1)
        {
            return values[0];
        } else
        {
            @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Unable to determine which updater to use! If you have more than one ExpoOTA, make sure you provide native packages manually with ids!" userInfo:nil];
        }
    } else
    {
        EXOtaUpdater *updater = updaters[identifier];
        if(updater == nil)
        {
            updater = [[EXOtaUpdater alloc] initWithConfig:config withPersistance:persistance withId:identifier];
            [updaters setValue:updater forKey:identifier];
        }
        return updater;
    }
}

@end
