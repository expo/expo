/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "FlipperKitLayoutPlugin.h"

#import <FlipperKit/FlipperClient.h>
#import <FlipperKit/FlipperConnection.h>
#import <FlipperKit/FlipperResponder.h>
#import <FlipperKit/SKMacros.h>
#import <mutex>
#import "SKDescriptorMapper.h"
#import "SKNodeDescriptor.h"
#import "SKSearchResultNode.h"
#import "SKTapListener.h"
#import "SKTapListenerImpl.h"

NSObject* parseLayoutEditorMessage(NSObject* message);
NSObject* flattenLayoutEditorMessage(NSObject* field);

@implementation FlipperKitLayoutPlugin {
  NSMapTable<NSString*, id>* _trackedObjects;
  NSString* _lastHighlightedNode;
  NSMutableSet* _invalidObjects;
  BOOL _invalidateMessageQueued;
  std::mutex _invalidObjectsMutex;

  id<NSObject> _rootNode;
  id<SKTapListener> _tapListener;

  id<FlipperConnection> _connection;

  NSMutableSet* _registeredDelegates;
}

- (instancetype)initWithRootNode:(id<NSObject>)rootNode
            withDescriptorMapper:(SKDescriptorMapper*)mapper {
  return [self initWithRootNode:rootNode
                withTapListener:[SKTapListenerImpl new]
           withDescriptorMapper:mapper];
}

- (instancetype)initWithRootNode:(id<NSObject>)rootNode
                 withTapListener:(id<SKTapListener>)tapListener
            withDescriptorMapper:(SKDescriptorMapper*)mapper {
  if (self = [super init]) {
    _descriptorMapper = mapper;
    _trackedObjects = [NSMapTable strongToWeakObjectsMapTable];
    _invalidObjects = [NSMutableSet new];
    _rootNode = rootNode;
    _tapListener = tapListener;

    _registeredDelegates = [NSMutableSet new];
    [SKInvalidation sharedInstance].delegate = self;
  }

  return self;
}

- (NSString*)identifier {
  return @"Inspector";
}

- (void)didConnect:(id<FlipperConnection>)connection {
  _connection = connection;

  if (!_rootNode) {
    // TODO: T61384369 get rid off this if condition.
    _rootNode = [UIApplication sharedApplication];
  }

  [SKInvalidation enableInvalidations];

  // Run setup logic for each descriptor
  for (SKNodeDescriptor* descriptor in _descriptorMapper.allDescriptors) {
    [descriptor setUp];
  }

  // In order to avoid a retain cycle (Connection -> Block ->
  // FlipperKitLayoutPlugin -> Connection ...)
  __weak FlipperKitLayoutPlugin* weakSelf = self;

  [connection receive:@"getRoot"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf onCallGetRoot:responder];
                  },
                  responder);
            }];

  [connection receive:@"getNodes"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf onCallGetNodes:params[@"ids"]
                               withResponder:responder];
                  },
                  responder);
            }];

  [connection receive:@"setData"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf onCallSetData:params[@"id"]
                                   withPath:params[@"path"]
                                    toValue:params[@"value"]
                             withConnection:connection];
                  },
                  responder);
            }];

  [connection receive:@"setHighlighted"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf onCallSetHighlighted:params[@"id"]
                                     withResponder:responder];
                  },
                  responder);
            }];

  [connection receive:@"setSearchActive"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf
                        onCallSetSearchActive:[params[@"active"] boolValue]
                               withConnection:connection];
                  },
                  responder);
            }];

  [connection receive:@"isSearchActive"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf onCallIsSearchActiveWithConnection:responder];
                  },
                  responder);
            }];

  [connection receive:@"isConsoleEnabled"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [responder success:@{@"isEnabled" : @NO}];
                  },
                  responder);
            }];

  [connection receive:@"getSearchResults"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              FlipperPerformBlockOnMainThread(
                  ^{
                    [weakSelf onCallGetSearchResults:params[@"query"]
                                       withResponder:responder];
                  },
                  responder);
            }];
}

- (void)didDisconnect {
  // removeFromSuperlayer (SKHighlightOverlay) needs to be called on main thread
  FlipperPerformBlockOnMainThread(
      ^{
        // Clear the last highlight if there is any
        [self onCallSetHighlighted:nil withResponder:nil];
        // Disable search if it is active
        [self onCallSetSearchActive:NO withConnection:nil];
      },
      nil);
}

- (void)onCallGetRoot:(id<FlipperResponder>)responder {
  const auto rootNode = [self getNode:[self trackObject:_rootNode]];

  [responder success:rootNode];
}

- (void)populateAllNodesFromNode:(nonnull NSString*)identifier
                         inArray:(nonnull NSMutableArray<NSDictionary*>*)
                                     mutableArray {
  NSDictionary* nodeDict = [self getNode:identifier];
  if (nodeDict == nil) {
    return;
  }
  [mutableArray addObject:nodeDict];
  NSArray* children = nodeDict[@"children"];
  for (NSString* childIdentifier in children) {
    [self populateAllNodesFromNode:childIdentifier inArray:mutableArray];
  }
}

- (NSMutableArray*)getChildrenForNode:(id)node
                       withDescriptor:(SKNodeDescriptor*)descriptor {
  NSMutableArray* children = [NSMutableArray new];
  for (NSUInteger i = 0; i < [descriptor childCountForNode:node]; i++) {
    id childNode = [descriptor childForNode:node atIndex:i];

    NSString* childIdentifier = [self trackObject:childNode];
    if (childIdentifier) {
      [children addObject:childIdentifier];
    }
  }
  return children;
}

- (void)onCallGetNodes:(NSArray<NSDictionary*>*)nodeIds
         withResponder:(id<FlipperResponder>)responder {
  NSMutableArray<NSDictionary*>* elements = [NSMutableArray new];

  for (id nodeId in nodeIds) {
    const auto node = [self getNode:nodeId];
    if (node == nil) {
      continue;
    }
    [elements addObject:node];
  }

  // Converting to folly::dynamic is expensive, do it on a bg queue:
  dispatch_async(SKLayoutPluginSerialBackgroundQueue(), ^{
    [responder success:@{@"elements" : elements}];
  });
}

- (void)onCallSetData:(NSString*)objectId
             withPath:(NSArray<NSString*>*)path
              toValue:(id<NSObject>)value
       withConnection:(id<FlipperConnection>)connection {
  id node = [_trackedObjects objectForKey:objectId];
  if (node == nil) {
    SKLog(@"node is nil, trying to setData: \
          objectId: %@ \
          path: %@ \
          value: %@", objectId, path, value);
    return;
  }

  // Sonar sends nil/NSNull on some values when the text-field
  // is empty, disregard these changes otherwise we'll crash.
  if (value == nil || [value isKindOfClass:[NSNull class]]) {
    return;
  }

  value = parseLayoutEditorMessage(value);

  SKNodeDescriptor* descriptor =
      [_descriptorMapper descriptorForClass:[node class]];

  NSString* dotJoinedPath = [path componentsJoinedByString:@"."];
  SKNodeUpdateData updateDataForPath =
      [[descriptor dataMutationsForNode:node] objectForKey:dotJoinedPath];
  if (updateDataForPath != nil) {
    const auto identifierForInvalidation =
        [descriptor identifierForInvalidation:node];
    id nodeForInvalidation =
        [_trackedObjects objectForKey:identifierForInvalidation];
    SKNodeDescriptor* descriptorForInvalidation =
        [_descriptorMapper descriptorForClass:[nodeForInvalidation class]];
    updateDataForPath(value);

    NSMutableArray* nodesForInvalidation = [NSMutableArray new];
    [self populateAllNodesFromNode:[descriptorForInvalidation
                                       identifierForNode:nodeForInvalidation]
                           inArray:nodesForInvalidation];
    [connection send:@"invalidateWithData"
          withParams:@{@"nodes" : nodesForInvalidation}];
  }
}

/**
 Layout editor messages are tagged with the types they contain, allowing for
 heterogeneous NSArray and NSDictionary supported by Android and iOS. The method
 parseLayoutEditorMessage traverses the message and flattens the messages to
 their original types.
 */
NSObject* parseLayoutEditorMessage(NSObject* message) {
  if ([message isKindOfClass:[NSDictionary class]]) {
    NSDictionary* wrapper = (NSDictionary*)message;
    if (wrapper[@"kind"]) {
      NSObject* newData = wrapper[@"data"];
      return flattenLayoutEditorMessage(newData);
    }
  }
  return message;
}

NSObject* flattenLayoutEditorMessage(NSObject* field) {
  if ([field isKindOfClass:[NSDictionary class]]) {
    NSDictionary* wrapper = (NSDictionary*)field;
    NSMutableDictionary* dictionary =
        [[NSMutableDictionary alloc] initWithCapacity:[wrapper count]];
    for (NSString* key in wrapper) {
      NSObject* value = wrapper[key];
      dictionary[key] = parseLayoutEditorMessage(value);
    }
    return dictionary;
  } else if ([field isKindOfClass:[NSArray class]]) {
    NSArray* wrapper = (NSArray*)field;
    NSMutableArray* array =
        [[NSMutableArray alloc] initWithCapacity:[wrapper count]];
    for (NSObject* value in wrapper) {
      [array addObject:parseLayoutEditorMessage(value)];
    }
    return array;
  }
  return field;
}

- (void)onCallGetSearchResults:(NSString*)query
                 withResponder:(id<FlipperResponder>)responder {
  const auto alreadyAddedElements = [NSMutableSet<NSString*> new];
  SKSearchResultNode* matchTree =
      [self searchForQuery:(NSString*)[query lowercaseString]
                          fromNode:(id)_rootNode
          withElementsAlreadyAdded:alreadyAddedElements];

  [responder success:@{
    @"results" : [matchTree toNSDictionary] ?: [NSNull null],
    @"query" : query
  }];
  return;
}

- (void)onCallSetHighlighted:(NSString*)objectId
               withResponder:(id<FlipperResponder>)responder {
  if (_lastHighlightedNode != nil) {
    id lastHighlightedObject =
        [_trackedObjects objectForKey:_lastHighlightedNode];
    if (lastHighlightedObject == nil) {
      [responder error:@{@"error" : @"unable to get last highlighted object"}];
      return;
    }

    SKNodeDescriptor* descriptor = [self->_descriptorMapper
        descriptorForClass:[lastHighlightedObject class]];
    [descriptor setHighlighted:NO forNode:lastHighlightedObject];

    _lastHighlightedNode = nil;
  }

  if (objectId == nil || [objectId isKindOfClass:[NSNull class]]) {
    return;
  }

  id object = [_trackedObjects objectForKey:objectId];
  if (object == nil) {
    SKLog(@"tried to setHighlighted for untracked id, objectId: %@", objectId);
    return;
  }

  SKNodeDescriptor* descriptor =
      [self->_descriptorMapper descriptorForClass:[object class]];
  [descriptor setHighlighted:YES forNode:object];

  _lastHighlightedNode = objectId;
}

- (void)onCallSetSearchActive:(BOOL)active
               withConnection:(id<FlipperConnection>)connection {
  if (active) {
    [_tapListener mountWithFrame:[[UIScreen mainScreen] bounds]];
    __block id<NSObject> rootNode = _rootNode;

    [_tapListener listenForTapWithBlock:^(CGPoint touchPoint) {
      SKTouch* touch =
          [[SKTouch alloc] initWithTouchPoint:touchPoint
                                 withRootNode:rootNode
                         withDescriptorMapper:self->_descriptorMapper
                              finishWithBlock:^(id<NSObject> node) {
                                [self updateNodeReference:node];
                              }];

      SKNodeDescriptor* descriptor =
          [self->_descriptorMapper descriptorForClass:[rootNode class]];
      [descriptor hitTest:touch forNode:rootNode];
      [touch retrieveSelectTree:^(NSDictionary* tree) {
        NSMutableArray* path = [NSMutableArray new];
        NSDictionary* subtree = tree;
        NSEnumerator* enumerator = [tree keyEnumerator];
        id nodeId;
        while ((nodeId = [enumerator nextObject])) {
          subtree = subtree[nodeId];
          [path addObject:nodeId];
          enumerator = [subtree keyEnumerator];
        }
        [connection send:@"select"
              withParams:@{@"path" : path, @"tree" : tree}];
      }];
    }];
  } else {
    [_tapListener unmount];
  }
}

- (void)onCallIsSearchActiveWithConnection:(id<FlipperResponder>)responder {
  [responder success:@{@"isSearchActive" : @NO}];
}

- (void)invalidateNode:(id<NSObject>)node {
  SKNodeDescriptor* descriptor =
      [_descriptorMapper descriptorForClass:[node class]];
  if (descriptor == nil) {
    return;
  }

  NSString* nodeId = [descriptor identifierForNode:node];
  if (![_trackedObjects objectForKey:nodeId]) {
    return;
  }
  [descriptor invalidateNode:node];

  // Collect invalidate messages before sending in a batch
  std::lock_guard<std::mutex> lock(_invalidObjectsMutex);
  [_invalidObjects addObject:nodeId];
  if (_invalidateMessageQueued) {
    return;
  }
  _invalidateMessageQueued = YES;

  dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, 500 * NSEC_PER_MSEC),
      dispatch_get_main_queue(),
      ^{
        [self _reportInvalidatedObjects];
      });
}

- (void)_reportInvalidatedObjects {
  NSMutableArray* nodes = [NSMutableArray new];
  { // scope mutex acquisition
    std::lock_guard<std::mutex> lock(_invalidObjectsMutex);
    for (NSString* nodeId in _invalidObjects) {
      [nodes addObject:@{@"id" : nodeId}];
    }
    _invalidObjects = [NSMutableSet new];
    _invalidateMessageQueued = NO;
  } // release mutex before calling out to other code

  [_connection send:@"invalidate" withParams:@{@"nodes" : nodes}];
}

- (void)updateNodeReference:(id<NSObject>)node {
  SKNodeDescriptor* descriptor =
      [_descriptorMapper descriptorForClass:[node class]];
  if (descriptor == nil) {
    return;
  }

  NSString* nodeId = [descriptor identifierForNode:node];
  [_trackedObjects setObject:node forKey:nodeId];
}

- (SKSearchResultNode*)searchForQuery:(NSString*)query
                             fromNode:(id)node
             withElementsAlreadyAdded:(NSMutableSet<NSString*>*)alreadyAdded {
  SKNodeDescriptor* descriptor =
      [_descriptorMapper descriptorForClass:[node class]];
  if (node == nil || descriptor == nil) {
    return nil;
  }

  NSMutableArray<SKSearchResultNode*>* childTrees = nil;
  BOOL isMatch = [descriptor matchesQuery:query forNode:node];

  NSString* nodeId = [self trackObject:node];

  for (auto i = 0; i < [descriptor childCountForNode:node]; i++) {
    id child = [descriptor childForNode:node atIndex:i];
    if (child) {
      SKSearchResultNode* childTree = [self searchForQuery:query
                                                  fromNode:child
                                  withElementsAlreadyAdded:alreadyAdded];
      if (childTree != nil) {
        if (childTrees == nil) {
          childTrees = [NSMutableArray new];
        }
        [childTrees addObject:childTree];
      }
    }
  }

  if (isMatch || childTrees != nil) {
    NSDictionary* element = [self getNode:nodeId];
    if (nodeId == nil || element == nil) {
      return nil;
    }
    NSMutableArray<NSString*>* descriptorChildElements =
        [element objectForKey:@"children"];
    NSMutableDictionary* newElement = [element mutableCopy];

    NSMutableArray<NSString*>* childElementsToReturn = [NSMutableArray new];
    for (NSString* child in descriptorChildElements) {
      if (![alreadyAdded containsObject:child]) {
        [alreadyAdded addObject:child]; // todo add all at end
        [childElementsToReturn addObject:child];
      }
    }
    [newElement setObject:childElementsToReturn forKey:@"children"];
    return [[SKSearchResultNode alloc] initWithNode:nodeId
                                            asMatch:isMatch
                                        withElement:newElement
                                        andChildren:childTrees];
  }
  return nil;
}

- (NSDictionary*)getNode:(NSString*)nodeId {
  id<NSObject> node = [_trackedObjects objectForKey:nodeId];
  if (node == nil) {
    SKLog(@"node is nil, no tracked node found for nodeId: %@", nodeId);
    return nil;
  }

  SKNodeDescriptor* nodeDescriptor =
      [_descriptorMapper descriptorForClass:[node class]];
  if (nodeDescriptor == nil) {
    SKLog(@"No registered descriptor for class: %@", [node class]);
    return nil;
  }

  NSMutableArray* attributes = [NSMutableArray new];
  NSMutableDictionary* data = [NSMutableDictionary new];
  NSMutableDictionary* extraInfo = [NSMutableDictionary new];

  const auto* nodeAttributes = [nodeDescriptor attributesForNode:node];
  for (const SKNamed<NSString*>* namedPair in nodeAttributes) {
    const auto name = namedPair.name;
    if (name) {
      const NSDictionary* attribute = @{
        @"name" : name,
        @"value" : namedPair.value ?: [NSNull null],
      };
      [attributes addObject:attribute];
    }
  }

  const auto* nodeData = [nodeDescriptor dataForNode:node];
  for (const SKNamed<NSDictionary*>* namedPair in nodeData) {
    data[namedPair.name] = namedPair.value;
  }

  const auto* nodeExtraInfo = [nodeDescriptor extraInfoForNode:node];
  for (const SKNamed<NSDictionary*>* namedPair in nodeExtraInfo) {
    extraInfo[namedPair.name] = namedPair.value;
  }

  NSMutableArray* children = [self getChildrenForNode:node
                                       withDescriptor:nodeDescriptor];

  NSDictionary* nodeDic = @{
    // We shouldn't get nil for id/name/decoration, but let's not crash if we
    // do.
    @"id" : [nodeDescriptor identifierForNode:node] ?: @"(unknown)",
    @"name" : [nodeDescriptor nameForNode:node] ?: @"(unknown)",
    @"children" : children,
    @"attributes" : attributes,
    @"data" : data,
    @"decoration" : [nodeDescriptor decorationForNode:node] ?: @"(unknown)",
    @"extraInfo" : extraInfo,
  };

  return nodeDic;
}

- (NSString*)trackObject:(id)object {
  const SKNodeDescriptor* descriptor =
      [_descriptorMapper descriptorForClass:[object class]];
  NSString* objectIdentifier = [descriptor identifierForNode:object];

  if (objectIdentifier == nil) {
    return nil;
  }

  [_trackedObjects setObject:object forKey:objectIdentifier];

  return objectIdentifier;
}

- (BOOL)runInBackground {
  return true;
}

@end

/**
 Operations like converting NSDictionary to folly::dynamic can be expensive.
 Do them on this serial background queue to avoid blocking the main thread.
 (Of course, ideally we wouldn't bother with building NSDictionary objects
 in the first place, in favor of just using folly::dynamic directly...)
 */
dispatch_queue_t SKLayoutPluginSerialBackgroundQueue(void) {
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("flipper.layout.bg", DISPATCH_QUEUE_SERIAL);
    // This should be relatively high priority, to prevent Flipper lag.
    dispatch_set_target_queue(
        queue, dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0));
  });
  return queue;
}

#endif
