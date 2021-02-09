/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "SKDescriptorMapper.h"
#import "SKNamed.h"
#import "SKTouch.h"

typedef void (^SKNodeUpdateData)(id value);

/**
 A SKNodeDescriptor is an object which know how to expose an Object of type T
 to SonarKitLayoutPlugin. This class is the extension point for
 SonarKitLayoutPlugin and is how custom objects or data can be exposed to Sonar.
 */
@interface SKNodeDescriptor<__covariant T> : NSObject

/**
 If the descriptor class is dependent on some set-up, use this.
 This is invoked once Sonar connects.
 */
- (void)setUp;

/**
 Initializes the node-descriptor with a SKDescriptorMapper which contains
 mappings between Class -> SKNodeDescriptor<Class>.
 */
- (instancetype)initWithDescriptorMapper:(SKDescriptorMapper*)mapper;

/**
 Gets the node-descriptor registered for a specific class.
 */
- (SKNodeDescriptor*)descriptorForClass:(Class)cls;

/**
  A globally unique ID used to identify a node in the hierarchy. This is used
  in the communication between SonarKitLayoutPlugin and the Sonar desktop
  application in order to identify nodes.
 */
- (NSString*)identifierForNode:(T)node;

/**
  When the setData command is received from Flipper to change a node's data,
  an "invalidateWithData" command is sent back to signal that the node has
  changed. However sometimes you may want to invalidate some other node,
  not the node that had its data actually modified; usually some ancestor.
  This method allows you to substitute another node's identifier.
  If you do not override it, the default behavior is to simply return
  the node's identifier.
*/
- (NSString*)identifierForInvalidation:(T)node;

/**
  The name used to identify this node in the Sonar desktop application. This is
  what will be visible in the hierarchy.
 */
- (NSString*)nameForNode:(T)node;

/**
  The number of children this node exposes in the layout hierarchy.
 */
- (NSUInteger)childCountForNode:(T)node;

/**
  Get the child for a specific node at a specified index.
 */
- (id)childForNode:(T)node atIndex:(NSUInteger)index;

/**
 Get the data to show for this node in the sidebar of the Sonar application. The
 objects will be shown in order by SKNamed.name as their header.
 */
- (NSArray<SKNamed<NSDictionary*>*>*)dataForNode:(T)node;

/**
 Get the extra info to pass it back to Sonar application without showing them in
 the sidebar.
 */
- (NSArray<SKNamed<NSDictionary*>*>*)extraInfoForNode:(T)node;

/**
 Get the attributes for this node. Attributes will be showed in the Sonar
 application right next to the name of the node.
 */
- (NSArray<SKNamed<NSString*>*>*)attributesForNode:(T)node;

/**
 A mapping of the path for a specific value, and a block responsible for
 updating its corresponding value for a specific node.

 The paths (string) is dependent on what `dataForNode` returns (e.g
 "SKNodeDescriptor.name").
 */
- (NSDictionary<NSString*, SKNodeUpdateData>*)dataMutationsForNode:(T)node;

/**
 This is used in order to highlight any specific node which is currently
 selected in the Sonar application. The plugin automatically takes care of
 de-selecting the previously highlighted node.
 */
- (void)setHighlighted:(BOOL)highlighted forNode:(T)node;

/**
 Perform hit testing on the given node. Either continue the search in
 one of the children of the node, or finish the hit testing on this
 node.
 */
- (void)hitTest:(SKTouch*)point forNode:(T)node;

/**
 Invalidate a specific node. This is called once a node is removed or added
 from or to the layout hierarchy.
 */
- (void)invalidateNode:(T)node;

/**
 The decoration for this node. Valid values are defined in the Sonar
 applictation.
 */
- (NSString*)decorationForNode:(T)node;

/**
 Whether the node matches the given query.
 Used for layout search.
 */
- (BOOL)matchesQuery:(NSString*)query forNode:(T)node;

@end
