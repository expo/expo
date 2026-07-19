#import <WebKit/WebKit.h>

#import <React/RCTConvert.h>

#if TARGET_OS_IPHONE
@interface RCTConvert (WKDataDetectorTypes)

+ (WKDataDetectorTypes)WKDataDetectorTypes:(id)json;

@end
#endif // TARGET_OS_IPHONE