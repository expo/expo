#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

typedef void (^SampleBufferCallback)(AudioBuffer *audioBuffer, long frameCount, double timestamp);

@interface AudioTapProcessor : NSObject

@property (nonatomic, copy) SampleBufferCallback sampleBufferCallback;
@property (nonatomic, strong) AVPlayerItem *playerItem;

- (instancetype)initWithPlayerItem:(AVPlayerItem *)playerItem;
- (bool)installTap;
- (void)uninstallTap;

@end
