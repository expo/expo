
#import "EXReactAppManager.h"
#import "EXReactAppExceptionHandler.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXReactAppManager ()

// versioned
@property (nonatomic, strong) id versionManager;
@property (nonatomic, assign) BOOL hasBridgeEverLoaded; // has the bridge ever succeeded at loading?

@property (nonatomic, strong) NSString *versionSymbolPrefix;
@property (nonatomic, strong, nullable) NSString *validatedVersion;

@property (nonatomic, strong) EXReactAppExceptionHandler *exceptionHandler;

- (NSDictionary *)launchOptionsForBridge;

@end

NS_ASSUME_NONNULL_END
