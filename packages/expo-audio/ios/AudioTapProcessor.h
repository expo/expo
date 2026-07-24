#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

typedef void (^SampleBufferCallback)(AudioBuffer *audioBuffer, long frameCount, double timestamp);

@interface AudioTapProcessor : NSObject

@property (nonatomic, copy, nullable) SampleBufferCallback sampleBufferCallback;
@property (nonatomic, strong, readonly) AVPlayer *player;
@property (nonatomic, readonly) BOOL isTapInstalled;

// POC: independent pitch shift, in cents (100 cents = 1 semitone). 0 = bypass (no processing).
@property (nonatomic) float pitchCents;

- (instancetype)initWithPlayer:(AVPlayer *)player;
- (BOOL)installTap;
- (void)uninstallTap;
- (void)invalidate;
// POC: flush the pitch unit's buffered samples after a discontinuity (e.g. seek).
- (void)reset;

@end
