// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Result of one on-device transform: the finished module code and the
/// require specifiers it references, in first-appearance order.
@interface EXOnDeviceTransformResult : NSObject
@property (nonatomic, readonly, copy) NSString *code;
@property (nonatomic, readonly, copy) NSArray<NSString *> *dependencyNames;
@end

/// Runs the bundled babel payload (device-transformer.js) inside a standalone
/// Hermes runtime — Expo Go is Hermes-only, so the transformer must not link
/// JavaScriptCore. The payload is plain JS source, so Hermes keeps its
/// compiler in-process and eval-based babel paths work.
@interface EXOnDeviceTransformer : NSObject

/// Loads `device-transformer.js` from `bundle`, creates a Hermes runtime, and
/// evaluates the payload. Returns nil and sets `error` if the resource is
/// missing or fails to evaluate. Bridges to Swift `init(bundle:) throws`; the
/// bundle parameter keeps it distinct from NSObject's `init()`, which is
/// unavailable so Swift can't pick it by mistake.
- (nullable instancetype)initWithBundle:(NSBundle *)bundle
                                  error:(NSError *_Nullable *_Nullable)error NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/// Calls `transformModule(source, filename, moduleId, deps)` in Hermes.
/// Returns nil and sets `error` on a JS exception or unexpected result shape.
- (nullable EXOnDeviceTransformResult *)transformSource:(NSString *)source
                                               filename:(NSString *)filename
                                               moduleId:(NSInteger)moduleId
                                          dependencyIds:(NSArray<NSNumber *> *)dependencyIds
                                                  error:(NSError *_Nullable *_Nullable)error
    NS_SWIFT_NAME(transform(source:filename:moduleId:dependencyIds:));

@end

NS_ASSUME_NONNULL_END
