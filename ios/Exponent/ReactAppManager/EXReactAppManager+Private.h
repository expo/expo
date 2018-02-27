
#import "EXReactAppManager.h"

@interface EXReactAppManager ()

// versioned
@property (nonatomic, strong) id versionManager;

@property (nonatomic, strong) NSString *versionSymbolPrefix;
@property (nonatomic, strong, nullable) NSString *validatedVersion;

@end
