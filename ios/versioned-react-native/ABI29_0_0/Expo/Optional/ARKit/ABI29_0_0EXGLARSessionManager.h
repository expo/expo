#import "ABI29_0_0EXGLView.h"
#import <ARKit/ARKit.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI29_0_0RCTConvert (ARPlaneDetection)

+ (ARPlaneDetection)ARPlaneDetection:(id)json API_AVAILABLE(ios(11.0));

@end

@interface ABI29_0_0RCTConvert (ARHitTestResultType)

+ (ARHitTestResultType)ARHitTestResultType:(id)json API_AVAILABLE(ios(11.0));

@end

@interface ABI29_0_0RCTConvert (ARWorldAlignment)

+ (ARWorldAlignment)ARWorldAlignment:(id)json API_AVAILABLE(ios(11.0));

@end

@protocol ABI29_0_0EXGLARSessionManagerDelegate <NSObject>

- (void)didUpdateWithEvent:(NSString *)name payload:(NSDictionary *)payload;

@end

API_AVAILABLE(ios(11.3))
@interface ABI29_0_0EXGLARSessionManager : NSObject

@property (nonatomic, weak) id<ABI29_0_0EXGLARSessionManagerDelegate> delegate;
@property (nonatomic, assign) ARPlaneDetection planeDetection;
@property (nonatomic, assign) ARWorldAlignment worldAlignment;

@property (nonatomic, assign) BOOL shouldAttemptRelocalization;
@property (nonatomic, assign) BOOL providesAudioData;
@property (nonatomic, assign) BOOL lightEstimationEnabled;
@property (nonatomic, assign) BOOL autoFocusEnabled;
@property (nonatomic, assign) NSArray* detectionImages;
@property (nonatomic, assign) ARVideoFormat *videoFormat;
@property (nonatomic, assign) matrix_float4x4 worldOrigin;
@property (nonatomic, readonly) int cameraTexture;

- (NSDictionary *)startWithGLView:(ABI29_0_0EXGLView *)glView trackingConfiguration:(NSString *) trackingConfiguration;
- (NSDictionary *)arMatricesWithZNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (nullable NSError *)startConfiguration:(NSString *)configuration;
- (nonnull NSDictionary *)getCurrentFrameWithAttributes:(NSDictionary *)attributes;
- (NSDictionary *)performHitTest:(CGPoint)point types:(ARHitTestResultType)types;

- (void)pause;
- (void)resume;
- (void)reset;
- (void)stop;

@end

NS_ASSUME_NONNULL_END
