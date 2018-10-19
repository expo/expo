// Copyright 2015-present 650 Industries. All rights reserved.

#import <ARKit/ARKit.h>
#import <EXAR/EXARModule.h>

API_AVAILABLE(ios(11.0))
@interface EXARModule (Serialization)

+ (nullable NSArray *)encodeMatrixFloat4x4:(matrix_float4x4)matrix;
+ (nullable NSArray *)encodeMatrixFloat3x3:(matrix_float3x3)matrix;
+ (nullable NSArray *)encodeMatrixFloat4x3:(matrix_float4x3)matrix;
+ (nullable NSDictionary *)encodeCGPoint:(CGPoint)point;
+ (nullable NSDictionary *)encodeVectorFloat3:(vector_float3)vec;
+ (nullable NSMutableArray *)encodeARVideoFormats:(NSArray<ARVideoFormat *>* _Nonnull)videoFormats;
+ (nullable NSDictionary *)encodeARVideoFormat:(ARVideoFormat *)videoFormat;
+ (nullable NSArray *)encodeARAnchors:(NSArray *)anchors props:(NSDictionary * _Nonnull)props;
+ (nullable NSDictionary *)encodeUnknownAnchor:(id)anchor props:(NSDictionary * _Nonnull) props;
+ (nullable NSDictionary *)encodeARImageAnchor:(ARImageAnchor * _Nonnull)anchor;
+ (nullable NSDictionary *)encodeARPlaneAnchor:(ARPlaneAnchor * _Nonnull)anchor;
+ (nullable NSDictionary *)encodeARAnchor:(id)anchor props:(NSDictionary * _Nonnull)props;
+ (nullable NSDictionary *)encodeCGSize:(CGSize)size;
+ (nullable NSDictionary *)encodeVectorFloat2:(vector_float2)vec;

+ (ARPlaneDetection)decodeARPlaneDetection:(NSString * _Nonnull)input;
+ (ARHitTestResultType)decodeARHitTestResultType:(NSString * _Nonnull)input;
+ (ARWorldAlignment)decodeARWorldAlignment:(NSString * _Nonnull)input;

@end
