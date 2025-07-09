
#import "EXReactAppManager.h"
#import "EXReactAppExceptionHandler.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXReactAppManager ()

@property (nonatomic, strong) NSDictionary *extraParams;

// versioned
@property (nonatomic, strong) id versionManager;
@property (nonatomic, assign) BOOL hasHostEverLoaded; // has the host ever succeeded at loading?

@property (nonatomic, strong) EXReactAppExceptionHandler *exceptionHandler;

- (NSDictionary *)launchOptionsForHost;

@end

NS_ASSUME_NONNULL_END
