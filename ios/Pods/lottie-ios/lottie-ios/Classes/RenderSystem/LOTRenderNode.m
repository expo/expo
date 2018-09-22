//
//  LOTRenderNode.m
//  Pods
//
//  Created by brandon_withrow on 6/27/17.
//
//

#import "LOTRenderNode.h"

@implementation LOTRenderNode

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                                    keyName:(NSString * _Nullable)keyname {
  self = [super initWithInputNode:inputNode keyName:keyname];
  if (self) {
    _outputLayer = [CAShapeLayer new];
    _outputLayer.actions = [self actionsForRenderLayer];
  }
  return self;
}

/// Layer Properties that need to disable implicit animations
- (NSDictionary * _Nonnull)actionsForRenderLayer {
  return @{@"path": [NSNull null]};
}

/// Local interpolatores have changed. Update layer specific properties.
- (void)performLocalUpdate {
  
}

/// The path for rendering has changed. Do any rendering required.
- (void)rebuildOutputs {
  
}

- (LOTBezierPath *)localPath {
  return self.inputNode.localPath;
}

/// Forwards its input node's output path forwards downstream
- (LOTBezierPath *)outputPath {
  return self.inputNode.outputPath;
}

@end
