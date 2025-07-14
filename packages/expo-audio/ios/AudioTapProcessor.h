#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

typedef void (^SampleBufferCallback)(AudioBuffer *audioBuffer, long frameCount, double timestamp);

@interface AudioTapProcessor : NSObject

@property (nonatomic, copy, nullable) SampleBufferCallback sampleBufferCallback;
@property (nonatomic, strong, readonly) AVPlayer *player;
@property (nonatomic, readonly) BOOL isTapInstalled;

- (instancetype)initWithPlayer:(AVPlayer *)player;
- (BOOL)installTap;
- (void)uninstallTap;
- (void)invalidate;

@end
