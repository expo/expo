#import "EXEnvironment.h"
#import <Foundation/Foundation.h>

@interface EXEnvironment (Tests)

- (void)_resetAndLoadIsDebugXCodeScheme:(BOOL)isDebugScheme;
- (void)_loadDefaultConfig;

@end
