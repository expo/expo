#import "EXGLView.h"
#import <ARKit/ARKit.h>
#import <React/RCTConvert.h>


@interface RCTConvert (ARPlaneDetection)

+ (ARPlaneDetection)ARPlaneDetection:(id)json;

@end

@interface RCTConvert (ARHitTestResultType)

+ (ARHitTestResultType)ARHitTestResultType:(id)json;

@end

@interface RCTConvert (ARWorldAlignment)

+ (ARWorldAlignment)ARWorldAlignment:(id)json;

@end

@protocol EXGLARSessionManagerDelegate <NSObject>

- (void)didUpdateWithEvent:(NSString *)name payload:(NSDictionary *)payload;

@end

@interface EXGLARSessionManager : NSObject

@property (nonatomic, weak) id<EXGLARSessionManagerDelegate> delegate;
@property (nonatomic, assign) ARPlaneDetection planeDetection;
@property (nonatomic, assign) ARPlaneDetection worldAlignment;

@property (nonatomic, assign) BOOL shouldAttemptRelocalization;
@property (nonatomic, assign) BOOL providesAudioData;
@property (nonatomic, assign) BOOL lightEstimationEnabled;
@property (nonatomic, assign) BOOL autoFocusEnabled;
@property (nonatomic, assign) NSArray* detectionImages;
@property (nonatomic, assign) ARVideoFormat *videoFormat;
@property (nonatomic, assign) matrix_float4x4 worldOrigin;
@property (nonatomic, readonly) int cameraTexture;

- (NSDictionary *)startWithGLView:(EXGLView *)glView trackingConfiguration:(NSString *) trackingConfiguration;
- (NSDictionary *)arMatricesWithZNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (nullable NSError *)startConfiguration:(NSString *)configuration;
- (nonnull NSDictionary *)getCurrentFrameWithAttributes:(NSDictionary *)attributes;
- (NSDictionary *)performHitTest:(CGPoint)point types:(ARHitTestResultType)types;

- (void)pause;
- (void)resume;
- (void)reset;
- (void)stop;

@end

