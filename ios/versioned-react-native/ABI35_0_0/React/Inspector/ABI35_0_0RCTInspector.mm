// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import "ABI35_0_0RCTInspector.h"

#if ABI35_0_0RCT_DEV

#include <ABI35_0_0jsinspector/ABI35_0_0InspectorInterfaces.h>

#import "ABI35_0_0RCTDefines.h"
#import "ABI35_0_0RCTInspectorPackagerConnection.h"
#import "ABI35_0_0RCTLog.h"
#import "ABI35_0_0RCTSRWebSocket.h"
#import "ABI35_0_0RCTUtils.h"

using namespace ABI35_0_0facebook::ReactABI35_0_0;

// This is a port of the Android impl, at
// ReactABI35_0_0-native-github/ReactABI35_0_0Android/src/main/java/com/facebook/ReactABI35_0_0/bridge/Inspector.java
// ReactABI35_0_0-native-github/ReactABI35_0_0Android/src/main/jni/ReactABI35_0_0/jni/JInspector.cpp
// please keep consistent :)

class RemoteConnection : public IRemoteConnection {
public:
RemoteConnection(ABI35_0_0RCTInspectorRemoteConnection *connection) :
  _connection(connection) {}

  virtual void onMessage(std::string message) override {
    [_connection onMessage:@(message.c_str())];
  }

  virtual void onDisconnect() override {
    [_connection onDisconnect];
  }
private:
  const ABI35_0_0RCTInspectorRemoteConnection *_connection;
};

@interface ABI35_0_0RCTInspectorPage () {
  NSInteger _id;
  NSString *_title;
  NSString *_vm;
}
- (instancetype)initWithId:(NSInteger)id
                     title:(NSString *)title
                     vm:(NSString *)vm;
@end

@interface ABI35_0_0RCTInspectorLocalConnection () {
  std::unique_ptr<ILocalConnection> _connection;
}
- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection;
@end

static IInspector *getInstance()
{
  return &ABI35_0_0facebook::ReactABI35_0_0::getInspectorInstance();
}

@implementation ABI35_0_0RCTInspector

ABI35_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (NSArray<ABI35_0_0RCTInspectorPage *> *)pages
{
  std::vector<InspectorPage> pages = getInstance()->getPages();
  NSMutableArray<ABI35_0_0RCTInspectorPage *> *array = [NSMutableArray arrayWithCapacity:pages.size()];
  for (size_t i = 0; i < pages.size(); i++) {
    ABI35_0_0RCTInspectorPage *pageWrapper = [[ABI35_0_0RCTInspectorPage alloc] initWithId:pages[i].id
                                                                   title:@(pages[i].title.c_str())
                                                                   vm:@(pages[i].vm.c_str())];
    [array addObject:pageWrapper];

  }
  return array;
}

+ (ABI35_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI35_0_0RCTInspectorRemoteConnection *)remote
{
  auto localConnection = getInstance()->connect(pageId, std::make_unique<RemoteConnection>(remote));
  return [[ABI35_0_0RCTInspectorLocalConnection alloc] initWithConnection:std::move(localConnection)];
}

@end

@implementation ABI35_0_0RCTInspectorPage

ABI35_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithId:(NSInteger)id
                     title:(NSString *)title
                        vm:(NSString *)vm
{
  if (self = [super init]) {
    _id = id;
    _title = title;
    _vm = vm;
  }
  return self;
}

@end

@implementation ABI35_0_0RCTInspectorLocalConnection

ABI35_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection
{
  if (self = [super init]) {
    _connection = std::move(connection);
  }
  return self;
}

- (void)sendMessage:(NSString *)message
{
  _connection->sendMessage([message UTF8String]);
}

- (void)disconnect
{
  _connection->disconnect();
}

@end

#endif
