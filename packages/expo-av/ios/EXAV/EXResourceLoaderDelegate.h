#import <AVFoundation/AVFoundation.h>

@interface EXResourceLoaderDelegate : NSObject <AVAssetResourceLoaderDelegate>

- (instancetype)initWithCertificateData:(NSURL *)certURL keyServerURL:(NSURL *)keyServerURL base64Cert:(BOOL) base64Cert;

extern NSString * const DRMErrorDomain;

typedef NS_ENUM(NSInteger, DRMError) {
    DRMErrorNoURLFound,
    DRMErrorNoSPCFound,
    DRMErrorNoContentIdFound,
    DRMErrorCannotEncodeCKCData,
    DRMErrorUnableToGeneratePersistentKey,
    DRMErrorUnableToFetchKey
};

@end
