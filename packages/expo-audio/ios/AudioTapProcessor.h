#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

typedef void (^SampleBufferCallback)(AudioBuffer *audioBuffer, long frameCount, double timestamp);

@interface AudioTapProcessor : NSObject

@property (nonatomic, copy) SampleBufferCallback sampleBufferCallback;
@property (nonatomic, strong) AVPlayer *player;

- (instancetype)initWithPlayer:(AVPlayer *)player;
- (bool)installTap;
- (void)uninstallTap;

@end
