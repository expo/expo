
#import "ABI30_0_0RCTInspector.h"

#if ABI30_0_0RCT_DEV

#include <ABI30_0_0jschelpers/ABI30_0_0JavaScriptCore.h>
#include <ABI30_0_0jsinspector/ABI30_0_0InspectorInterfaces.h>

#import "ABI30_0_0RCTDefines.h"
#import "ABI30_0_0RCTInspectorPackagerConnection.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTSRWebSocket.h"
#import "ABI30_0_0RCTUtils.h"

using namespace facebook::ReactABI30_0_0;

// This is a port of the Android impl, at
// ReactABI30_0_0-native-github/ReactABI30_0_0Android/src/main/java/com/facebook/ReactABI30_0_0/bridge/Inspector.java
// ReactABI30_0_0-native-github/ReactABI30_0_0Android/src/main/jni/ReactABI30_0_0/jni/JInspector.cpp
// please keep consistent :)

class RemoteConnection : public IRemoteConnection {
public:
RemoteConnection(ABI30_0_0RCTInspectorRemoteConnection *connection) :
  _connection(connection) {}

  virtual void onMessage(std::string message) override {
    [_connection onMessage:@(message.c_str())];
  }

  virtual void onDisconnect() override {
    [_connection onDisconnect];
  }
private:
  const ABI30_0_0RCTInspectorRemoteConnection *_connection;
};

@interface ABI30_0_0RCTInspectorPage () {
  NSInteger _id;
  NSString *_title;
  NSString *_vm;
}
- (instancetype)initWithId:(NSInteger)id
                     title:(NSString *)title
                     vm:(NSString *)vm;
@end

@interface ABI30_0_0RCTInspectorLocalConnection () {
  std::unique_ptr<ILocalConnection> _connection;
}
- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection;
@end

static IInspector *getInstance()
{
  return &facebook::ReactABI30_0_0::getInspectorInstance();
}

@implementation ABI30_0_0RCTInspector

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (NSArray<ABI30_0_0RCTInspectorPage *> *)pages
{
  std::vector<InspectorPage> pages = getInstance()->getPages();
  NSMutableArray<ABI30_0_0RCTInspectorPage *> *array = [NSMutableArray arrayWithCapacity:pages.size()];
  for (size_t i = 0; i < pages.size(); i++) {
    ABI30_0_0RCTInspectorPage *pageWrapper = [[ABI30_0_0RCTInspectorPage alloc] initWithId:pages[i].id
                                                                   title:@(pages[i].title.c_str())
                                                                   vm:@(pages[i].vm.c_str())];
    [array addObject:pageWrapper];

  }
  return array;
}

+ (ABI30_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI30_0_0RCTInspectorRemoteConnection *)remote
{
  auto localConnection = getInstance()->connect(pageId, std::make_unique<RemoteConnection>(remote));
  return [[ABI30_0_0RCTInspectorLocalConnection alloc] initWithConnection:std::move(localConnection)];
}

@end

@implementation ABI30_0_0RCTInspectorPage

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

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

@implementation ABI30_0_0RCTInspectorLocalConnection

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

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
