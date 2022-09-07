/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI46_0_0hermes/ABI46_0_0inspector/chrome/MessageTypes.h>

#include <iostream>

#include <folly/dynamic.h>
#include <folly/json.h>
#include <gtest/gtest.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace chrome {
namespace message {

using folly::dynamic;

TEST(MessageTests, testSerializeSomeFieldsInRequest) {
  debugger::SetBreakpointByUrlRequest req;
  // req.id should default to 0
  req.lineNumber = 2;
  req.url = "http://example.com/example.js";

  dynamic result = req.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "id": 0,
    "method": "Debugger.setBreakpointByUrl",
    "params": {
      "lineNumber": 2,
      "url": "http://example.com/example.js"
    }
  })");
  ABI46_0_0EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeSomeFieldsInRequest) {
  dynamic message = folly::parseJson(R"(
    {
      "id": 10,
      "method": "Debugger.setBreakpointByUrl",
      "params": {
        "lineNumber": 42,
        "url": "http://example.com"
      }
    }
  )");
  debugger::SetBreakpointByUrlRequest req(message);

  ABI46_0_0EXPECT_EQ(req.toDynamic(), message);
  ABI46_0_0EXPECT_EQ(req.id, 10);
  ABI46_0_0EXPECT_EQ(req.method, "Debugger.setBreakpointByUrl");
  ABI46_0_0EXPECT_EQ(req.lineNumber, 42);
  ABI46_0_0EXPECT_FALSE(req.columnNumber.hasValue());
  ABI46_0_0EXPECT_FALSE(req.condition.hasValue());
  ABI46_0_0EXPECT_EQ(req.url, "http://example.com");
  ABI46_0_0EXPECT_FALSE(req.urlRegex.hasValue());
}

TEST(MessageTests, testSerializeAllFieldsInRequest) {
  debugger::SetBreakpointByUrlRequest req;
  req.id = 1;
  req.lineNumber = 2;
  req.columnNumber = 3;
  req.condition = "foo == 42";
  req.url = "http://example.com/example.js";
  req.urlRegex = "http://example.com/.*";

  dynamic result = req.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "id": 1,
    "method": "Debugger.setBreakpointByUrl",
    "params": {
      "lineNumber": 2,
      "columnNumber": 3,
      "condition": "foo == 42",
      "url": "http://example.com/example.js",
      "urlRegex": "http://example.com/.*"
    }
  })");
  ABI46_0_0EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeAllFieldsInRequest) {
  dynamic message = folly::parseJson(R"({
    "id": 1,
    "method": "Debugger.setBreakpointByUrl",
    "params": {
      "lineNumber": 2,
      "columnNumber": 3,
      "condition": "foo == 42",
      "url": "http://example.com/example.js",
      "urlRegex": "http://example.com/.*"
    }
  })");
  debugger::SetBreakpointByUrlRequest req(message);

  ABI46_0_0EXPECT_EQ(req.id, 1);
  ABI46_0_0EXPECT_EQ(req.method, "Debugger.setBreakpointByUrl");
  ABI46_0_0EXPECT_EQ(req.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(req.columnNumber, 3);
  ABI46_0_0EXPECT_EQ(req.condition, "foo == 42");
  ABI46_0_0EXPECT_EQ(req.url, "http://example.com/example.js");
  ABI46_0_0EXPECT_EQ(req.urlRegex, "http://example.com/.*");
}

TEST(MessageTests, testSerializeResponse) {
  debugger::Location location;
  location.scriptId = "myScriptId";
  location.lineNumber = 2;
  location.columnNumber = 3;

  debugger::SetBreakpointByUrlResponse resp;
  resp.id = 1;
  resp.breakpointId = "myBreakpointId";
  resp.locations = {location};

  dynamic result = resp.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "id": 1,
    "result": {
      "breakpointId": "myBreakpointId",
      "locations": [
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      ]
    }
  })");
  ABI46_0_0EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeResponse) {
  dynamic message = folly::parseJson(R"({
    "id": 1,
    "result": {
      "breakpointId": "myBreakpointId",
      "locations": [
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      ]
    }
  })");
  debugger::SetBreakpointByUrlResponse resp(message);
  ABI46_0_0EXPECT_EQ(resp.toDynamic(), message);
  ABI46_0_0EXPECT_EQ(resp.id, 1);
  ABI46_0_0EXPECT_EQ(resp.breakpointId, "myBreakpointId");
  ABI46_0_0EXPECT_EQ(resp.locations.size(), 1);
  ABI46_0_0EXPECT_EQ(resp.locations[0].lineNumber, 2);
  ABI46_0_0EXPECT_EQ(resp.locations[0].columnNumber, 3);
  ABI46_0_0EXPECT_EQ(resp.locations[0].scriptId, "myScriptId");
}

TEST(MessageTests, testSerializeNotification) {
  debugger::Location startLocation;
  startLocation.lineNumber = 1;
  startLocation.scriptId = "script1";

  debugger::Location endLocation;
  endLocation.lineNumber = 2;
  endLocation.scriptId = "script2";

  debugger::Scope scope;
  scope.type = "closure";
  scope.object.type = "object";
  scope.object.subtype = "regexp";
  scope.object.className = "RegExp";
  scope.object.value = dynamic::object("foo", "bar");
  scope.object.unserializableValue = "nope";
  scope.object.description = "myDesc";
  scope.object.objectId = "id1";
  scope.name = "myScope";
  scope.startLocation = startLocation;
  scope.endLocation = endLocation;

  debugger::CallFrame frame;
  frame.callFrameId = "callFrame1";
  frame.functionName = "foo1";
  frame.location.scriptId = "script1";
  frame.location.lineNumber = 3;
  frame.location.columnNumber = 4;
  frame.url = "foo.js";
  frame.scopeChain = std::vector<debugger::Scope>{scope};
  frame.thisObj.type = "function";

  debugger::PausedNotification note;
  note.callFrames = std::vector<debugger::CallFrame>{frame};
  note.reason = "debugCommand";
  note.data = dynamic::object("foo", "bar");
  note.hitBreakpoints = std::vector<std::string>{"a", "b"};

  dynamic result = note.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "method": "Debugger.paused",
    "params": {
      "callFrames": [
        {
          "callFrameId": "callFrame1",
          "functionName": "foo1",
          "location": {
            "scriptId": "script1",
            "lineNumber": 3,
            "columnNumber": 4
          },
          "url": "foo.js",
          "scopeChain": [
            {
              "type": "closure",
              "object": {
                "type": "object",
                "subtype": "regexp",
                "className": "RegExp",
                "value": { "foo": "bar" },
                "unserializableValue": "nope",
                "description": "myDesc",
                "objectId": "id1"
              },
              "name": "myScope",
              "startLocation": {
                "lineNumber": 1,
                "scriptId": "script1"
              },
              "endLocation": {
                "lineNumber": 2,
                "scriptId": "script2"
              }
            }
          ],
          "this": { "type": "function" }
        }
      ],
      "reason": "debugCommand",
      "data": {
        "foo": "bar"
      },
      "hitBreakpoints": [ "a", "b" ]
    }
  })");
  ABI46_0_0EXPECT_EQ(result, expected);
}

TEST(MessageTests, testDeserializeNotification) {
  dynamic message = folly::parseJson(R"({
    "method": "Debugger.paused",
    "params": {
      "callFrames": [
        {
          "callFrameId": "callFrame1",
          "functionName": "foo1",
          "location": {
            "scriptId": "script1",
            "lineNumber": 3,
            "columnNumber": 4
          },
          "url": "foo.js",
          "scopeChain": [
            {
              "type": "closure",
              "object": {
                "type": "object",
                "subtype": "regexp",
                "className": "RegExp",
                "value": { "foo": "bar" },
                "unserializableValue": "nope",
                "description": "myDesc",
                "objectId": "id1"
              },
              "name": "myScope",
              "startLocation": {
                "lineNumber": 1,
                "scriptId": "script1"
              },
              "endLocation": {
                "lineNumber": 2,
                "scriptId": "script2"
              }
            }
          ],
          "this": { "type": "function" }
        }
      ],
      "reason": "debugCommand",
      "data": {
        "foo": "bar"
      },
      "hitBreakpoints": [ "a", "b" ]
    }
  })");
  debugger::PausedNotification note(message);

  ABI46_0_0EXPECT_EQ(note.method, "Debugger.paused");
  ABI46_0_0EXPECT_EQ(note.callFrames.size(), 1);
  ABI46_0_0EXPECT_EQ(note.reason, "debugCommand");
  ABI46_0_0EXPECT_EQ(note.data, static_cast<dynamic>(dynamic::object("foo", "bar")));
  auto expectedHitBreakpoints = std::vector<std::string>{"a", "b"};
  ABI46_0_0EXPECT_EQ(note.hitBreakpoints, expectedHitBreakpoints);

  debugger::CallFrame &callFrame = note.callFrames[0];
  ABI46_0_0EXPECT_EQ(callFrame.callFrameId, "callFrame1");
  ABI46_0_0EXPECT_EQ(callFrame.functionName, "foo1");
  ABI46_0_0EXPECT_EQ(callFrame.location.scriptId, "script1");
  ABI46_0_0EXPECT_EQ(callFrame.location.lineNumber, 3);
  ABI46_0_0EXPECT_EQ(callFrame.location.columnNumber, 4);
  ABI46_0_0EXPECT_EQ(callFrame.url, "foo.js");
  ABI46_0_0EXPECT_EQ(callFrame.scopeChain.size(), 1);
  ABI46_0_0EXPECT_EQ(callFrame.thisObj.type, "function");

  debugger::Scope &scope = callFrame.scopeChain[0];
  ABI46_0_0EXPECT_EQ(scope.type, "closure");
  ABI46_0_0EXPECT_EQ(scope.object.type, "object");
  ABI46_0_0EXPECT_EQ(scope.object.subtype, "regexp");
  ABI46_0_0EXPECT_EQ(scope.object.className, "RegExp");
  ABI46_0_0EXPECT_EQ(
      scope.object.value, static_cast<dynamic>(dynamic::object("foo", "bar")));
  ABI46_0_0EXPECT_EQ(scope.object.unserializableValue, "nope");
  ABI46_0_0EXPECT_EQ(scope.object.description, "myDesc");
  ABI46_0_0EXPECT_EQ(scope.object.objectId, "id1");
  ABI46_0_0EXPECT_EQ(scope.name, "myScope");

  debugger::Location &startLocation = scope.startLocation.value();
  ABI46_0_0EXPECT_EQ(startLocation.lineNumber, 1);
  ABI46_0_0EXPECT_FALSE(startLocation.columnNumber.hasValue());
  ABI46_0_0EXPECT_EQ(startLocation.scriptId, "script1");

  debugger::Location &endLocation = scope.endLocation.value();
  ABI46_0_0EXPECT_EQ(endLocation.lineNumber, 2);
  ABI46_0_0EXPECT_FALSE(endLocation.columnNumber.hasValue());
  ABI46_0_0EXPECT_EQ(endLocation.scriptId, "script2");
}

TEST(MessageTests, TestSerializeAsyncStackTrace) {
  runtime::StackTrace stack;
  stack.description = "childStack";
  stack.parent = std::make_unique<runtime::StackTrace>();
  stack.parent->description = "parentStack";

  dynamic result = stack.toDynamic();
  dynamic expected = folly::parseJson(R"({
    "description": "childStack",
    "callFrames": [],
    "parent": {
      "description": "parentStack",
      "callFrames": []
    }
  })");
  ABI46_0_0EXPECT_EQ(result, expected);
}

TEST(MessageTests, TestDeserializeAsyncStackTrace) {
  dynamic message = folly::parseJson(R"({
    "description": "childStack",
    "callFrames": [],
    "parent": {
      "description": "parentStack",
      "callFrames": []
    }
  })");
  runtime::StackTrace stack(message);

  ABI46_0_0EXPECT_EQ(stack.description, "childStack");
  ABI46_0_0EXPECT_EQ(stack.callFrames.size(), 0);
  ABI46_0_0EXPECT_EQ(stack.parent->description, "parentStack");
  ABI46_0_0EXPECT_EQ(stack.parent->callFrames.size(), 0);
}

TEST(MessageTests, TestRequestFromJson) {
  std::unique_ptr<Request> baseReq1 = Request::fromJsonThrowOnError(R"({
    "id": 1,
    "method": "Debugger.enable"
  })");
  auto req1 = static_cast<debugger::EnableRequest *>(baseReq1.get());
  ABI46_0_0EXPECT_EQ(req1->id, 1);
  ABI46_0_0EXPECT_EQ(req1->method, "Debugger.enable");

  std::unique_ptr<Request> baseReq2 = Request::fromJsonThrowOnError(R"({
    "id": 2,
    "method": "Debugger.removeBreakpoint",
    "params": {
      "breakpointId": "foobar"
    }
  })");
  auto req2 = static_cast<debugger::RemoveBreakpointRequest *>(baseReq2.get());
  ABI46_0_0EXPECT_EQ(req2->id, 2);
  ABI46_0_0EXPECT_EQ(req2->method, "Debugger.removeBreakpoint");
  ABI46_0_0EXPECT_EQ(req2->breakpointId, "foobar");

  folly::Try<std::unique_ptr<Request>> invalidReq =
      Request::fromJson("invalid");
  ABI46_0_0EXPECT_TRUE(invalidReq.hasException());
}

TEST(MessageTests, TestBreakpointRequestFromJSON) {
  std::unique_ptr<Request> baseReq = Request::fromJsonThrowOnError(R"({
    "id": 1,
    "method": "Debugger.setBreakpoint",
    "params": {
      "location": {
        "scriptId": "23",
        "lineNumber": 45,
        "columnNumber": 67
      }
    }
  })");
  auto req = static_cast<debugger::SetBreakpointRequest *>(baseReq.get());
  ABI46_0_0EXPECT_EQ(req->location.scriptId, "23");
  ABI46_0_0EXPECT_EQ(req->location.lineNumber, 45);
  ABI46_0_0EXPECT_EQ(req->location.columnNumber.value(), 67);
}

struct MyHandler : public NoopRequestHandler {
  void handle(const debugger::EnableRequest &req) override {
    enableReq = req;
  }

  void handle(const debugger::RemoveBreakpointRequest &req) override {
    removeReq = req;
  }

  debugger::EnableRequest enableReq;
  debugger::RemoveBreakpointRequest removeReq;
};

TEST(MessageTests, TestRequestHandler) {
  MyHandler handler;

  std::unique_ptr<Request> enableReq = Request::fromJsonThrowOnError(R"({
    "id": 1,
    "method": "Debugger.enable"
  })");
  enableReq->accept(handler);

  ABI46_0_0EXPECT_EQ(handler.enableReq.id, 1);
  ABI46_0_0EXPECT_EQ(handler.enableReq.method, "Debugger.enable");

  std::unique_ptr<Request> removeReq = Request::fromJsonThrowOnError(R"({
    "id": 2,
    "method": "Debugger.removeBreakpoint",
    "params": {
      "breakpointId": "foobar"
    }
  })");
  removeReq->accept(handler);

  ABI46_0_0EXPECT_EQ(handler.removeReq.id, 2);
  ABI46_0_0EXPECT_EQ(handler.removeReq.method, "Debugger.removeBreakpoint");
  ABI46_0_0EXPECT_EQ(handler.removeReq.breakpointId, "foobar");
}

TEST(MessageTests, testEnableRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.enable"
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::EnableRequest *resolvedReq =
      dynamic_cast<debugger::EnableRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::EnableRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.enable");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testDisableRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.disable"
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::DisableRequest *resolvedReq =
      dynamic_cast<debugger::DisableRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::DisableRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.disable");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testEvaluateOnCallFrameRequestMinimal) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.evaluateOnCallFrame",
      "params":{
        "callFrameId" : "42",
        "expression": "Foo Bar"
    }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::EvaluateOnCallFrameRequest *resolvedReq =
      dynamic_cast<debugger::EvaluateOnCallFrameRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::EvaluateOnCallFrameRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.evaluateOnCallFrame");
  ABI46_0_0EXPECT_EQ(resolvedReq->callFrameId, "42");
  ABI46_0_0EXPECT_EQ(resolvedReq->expression, "Foo Bar");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->callFrameId, deserializedReq.callFrameId);
  ABI46_0_0EXPECT_EQ(resolvedReq->expression, deserializedReq.expression);

  ABI46_0_0EXPECT_FALSE(resolvedReq->objectGroup.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->includeCommandLineAPI.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->silent.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->returnByValue.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->throwOnSideEffect.hasValue());
}

TEST(MessageTests, testEvaluateOnCallFrameRequestFull) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.evaluateOnCallFrame",
      "params":{
        "callFrameId" : "42",
        "expression": "Foo Bar",
        "objectGroup" : "FooBarGroup",
        "includeCommandLineAPI" : false,
        "silent" : true,
        "returnByValue" : false,
        "throwOnSideEffect" : true
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::EvaluateOnCallFrameRequest *resolvedReq =
      dynamic_cast<debugger::EvaluateOnCallFrameRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::EvaluateOnCallFrameRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics, resolvedReq is correct
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.evaluateOnCallFrame");
  ABI46_0_0EXPECT_EQ(resolvedReq->callFrameId, "42");
  ABI46_0_0EXPECT_EQ(resolvedReq->expression, "Foo Bar");

  ABI46_0_0EXPECT_TRUE(resolvedReq->objectGroup.hasValue());
  ABI46_0_0EXPECT_TRUE(resolvedReq->includeCommandLineAPI.hasValue());
  ABI46_0_0EXPECT_TRUE(resolvedReq->silent.hasValue());
  ABI46_0_0EXPECT_TRUE(resolvedReq->returnByValue.hasValue());
  ABI46_0_0EXPECT_TRUE(resolvedReq->throwOnSideEffect.hasValue());

  ABI46_0_0EXPECT_TRUE(resolvedReq->objectGroup.value() == "FooBarGroup");
  ABI46_0_0EXPECT_TRUE(resolvedReq->includeCommandLineAPI.value() == false);
  ABI46_0_0EXPECT_TRUE(resolvedReq->silent.value() == true);
  ABI46_0_0EXPECT_TRUE(resolvedReq->returnByValue.value() == false);
  ABI46_0_0EXPECT_TRUE(resolvedReq->throwOnSideEffect.value() == true);

  // Specifics, resolvedReq and deserialized match

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->callFrameId, deserializedReq.callFrameId);
  ABI46_0_0EXPECT_EQ(resolvedReq->expression, deserializedReq.expression);
  ABI46_0_0EXPECT_EQ(
      resolvedReq->objectGroup.value(), deserializedReq.objectGroup.value());
  ABI46_0_0EXPECT_EQ(
      resolvedReq->includeCommandLineAPI.value(),
      deserializedReq.includeCommandLineAPI.value());
  ABI46_0_0EXPECT_EQ(resolvedReq->silent.value(), deserializedReq.silent.value());
  ABI46_0_0EXPECT_EQ(
      resolvedReq->returnByValue.value(),
      deserializedReq.returnByValue.value());
  ABI46_0_0EXPECT_EQ(
      resolvedReq->throwOnSideEffect.value(),
      deserializedReq.throwOnSideEffect.value());
}

TEST(MessageTests, testPauseRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.pause"
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::PauseRequest *resolvedReq =
      dynamic_cast<debugger::PauseRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::PauseRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.pause");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testRemoveBreakpointRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.removeBreakpoint",
      "params":{
        "breakpointId" : "42"
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::RemoveBreakpointRequest *resolvedReq =
      dynamic_cast<debugger::RemoveBreakpointRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::RemoveBreakpointRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.removeBreakpoint");
  ABI46_0_0EXPECT_TRUE(resolvedReq->breakpointId == "42");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->breakpointId, deserializedReq.breakpointId);
}

TEST(MessageTests, testResumeRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.resume",
      "params": {
        "terminateOnResume": false
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::ResumeRequest *resolvedReq =
      dynamic_cast<debugger::ResumeRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::ResumeRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.resume");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testSetBreakpointRequestMinimal) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.setBreakpoint",
      "params":{
        "location" :
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetBreakpointRequest *resolvedReq =
      dynamic_cast<debugger::SetBreakpointRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  debugger::Location location;
  location.scriptId = "myScriptId";
  location.lineNumber = 2;
  location.columnNumber = 3;

  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setBreakpoint");
  ABI46_0_0EXPECT_EQ(resolvedReq->location.scriptId, "myScriptId");
  ABI46_0_0EXPECT_EQ(resolvedReq->location.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(resolvedReq->location.columnNumber, 3);

  ABI46_0_0EXPECT_FALSE(resolvedReq->condition.hasValue());

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->location.scriptId, deserializedReq.location.scriptId);
  ABI46_0_0EXPECT_EQ(
      resolvedReq->location.lineNumber, deserializedReq.location.lineNumber);
  ABI46_0_0EXPECT_EQ(
      resolvedReq->location.columnNumber,
      deserializedReq.location.columnNumber);
}

TEST(MessageTests, testSetBreakpointRequestFull) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.setBreakpoint",
      "params":{
        "location" :
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        },
        "condition": "FooBarCondition"
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetBreakpointRequest *resolvedReq =
      dynamic_cast<debugger::SetBreakpointRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setBreakpoint");
  ABI46_0_0EXPECT_EQ(resolvedReq->location.scriptId, "myScriptId");
  ABI46_0_0EXPECT_EQ(resolvedReq->location.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(resolvedReq->location.columnNumber, 3);

  ABI46_0_0EXPECT_TRUE(resolvedReq->condition.hasValue());
  ABI46_0_0EXPECT_EQ(resolvedReq->condition.value(), "FooBarCondition");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->location.scriptId, deserializedReq.location.scriptId);
  ABI46_0_0EXPECT_EQ(
      resolvedReq->location.lineNumber, deserializedReq.location.lineNumber);
  ABI46_0_0EXPECT_EQ(
      resolvedReq->location.columnNumber,
      deserializedReq.location.columnNumber);
  ABI46_0_0EXPECT_EQ(resolvedReq->condition.value(), deserializedReq.condition.value());
}

TEST(MessageTests, testSetBreakpointByUrlRequestMinimal) {
  std::string message = R"(
    {
      "id": 1,
      "method": "Debugger.setBreakpointByUrl",
      "params": {
        "lineNumber": 2
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetBreakpointByUrlRequest *resolvedReq =
      dynamic_cast<debugger::SetBreakpointByUrlRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointByUrlRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 1);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setBreakpointByUrl");
  ABI46_0_0EXPECT_EQ(resolvedReq->lineNumber, 2);

  ABI46_0_0EXPECT_FALSE(resolvedReq->condition.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->columnNumber.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->url.hasValue());
  ABI46_0_0EXPECT_FALSE(resolvedReq->urlRegex.hasValue());

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->lineNumber, deserializedReq.lineNumber);
}

TEST(MessageTests, testSetBreakpointByUrlRequestFull) {
  std::string message = R"(
    {
      "id": 1,
      "method": "Debugger.setBreakpointByUrl",
      "params": {
        "lineNumber": 2,
        "columnNumber": 3,
        "condition": "foo == 42",
        "url": "http://example.com/example.js",
        "urlRegex": "http://example.com/.*"
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetBreakpointByUrlRequest *resolvedReq =
      dynamic_cast<debugger::SetBreakpointByUrlRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointByUrlRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 1);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setBreakpointByUrl");
  ABI46_0_0EXPECT_EQ(resolvedReq->lineNumber, 2);

  ABI46_0_0EXPECT_TRUE(resolvedReq->condition.hasValue());
  ABI46_0_0EXPECT_EQ(resolvedReq->condition.value(), "foo == 42");
  ABI46_0_0EXPECT_TRUE(resolvedReq->columnNumber.hasValue());
  ABI46_0_0EXPECT_EQ(resolvedReq->columnNumber.value(), 3);
  ABI46_0_0EXPECT_TRUE(resolvedReq->url.hasValue());
  ABI46_0_0EXPECT_EQ(resolvedReq->url.value(), "http://example.com/example.js");
  ABI46_0_0EXPECT_TRUE(resolvedReq->urlRegex.hasValue());
  ABI46_0_0EXPECT_EQ(resolvedReq->urlRegex.value(), "http://example.com/.*");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->lineNumber, deserializedReq.lineNumber);
  ABI46_0_0EXPECT_EQ(resolvedReq->condition.value(), deserializedReq.condition.value());
  ABI46_0_0EXPECT_EQ(
      resolvedReq->columnNumber.value(), deserializedReq.columnNumber.value());
  ABI46_0_0EXPECT_EQ(resolvedReq->url.value(), deserializedReq.url.value());
  ABI46_0_0EXPECT_EQ(resolvedReq->urlRegex.value(), deserializedReq.urlRegex.value());
}

TEST(MessageTests, testSetBreakpointsActiveRequest) {
  std::string message = R"(
    {
      "id": 1,
      "method": "Debugger.setBreakpointsActive",
      "params": {
        "active": true
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetBreakpointsActiveRequest *resolvedReq =
      dynamic_cast<debugger::SetBreakpointsActiveRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointsActiveRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 1);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setBreakpointsActive");
  ABI46_0_0EXPECT_EQ(resolvedReq->active, true);

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->active, deserializedReq.active);
}

TEST(MessageTests, testSetInstrumentationBreakpointRequest) {
  std::string message = R"(
    {
      "id": 1,
      "method": "Debugger.setInstrumentationBreakpoint",
      "params": {
        "instrumentation": "TODO: THIS SHOUD NOT BE ACCEPTED BY ENUM"
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetInstrumentationBreakpointRequest *resolvedReq =
      dynamic_cast<debugger::SetInstrumentationBreakpointRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetInstrumentationBreakpointRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 1);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setInstrumentationBreakpoint");
  ABI46_0_0EXPECT_EQ(
      resolvedReq->instrumentation, "TODO: THIS SHOUD NOT BE ACCEPTED BY ENUM");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->instrumentation, deserializedReq.instrumentation);
}

TEST(MessageTests, testSetPauseOnExceptionsRequest) {
  std::string message = R"(
    {
      "id": 1,
      "method": "Debugger.setPauseOnExceptions",
      "params": {
        "state": "TODO: THIS SHOUD NOT BE ACCEPTED BY ENUM"
      }
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::SetPauseOnExceptionsRequest *resolvedReq =
      dynamic_cast<debugger::SetPauseOnExceptionsRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetPauseOnExceptionsRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 1);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.setPauseOnExceptions");
  ABI46_0_0EXPECT_EQ(resolvedReq->state, "TODO: THIS SHOUD NOT BE ACCEPTED BY ENUM");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
  ABI46_0_0EXPECT_EQ(resolvedReq->state, deserializedReq.state);
}

TEST(MessageTests, testStepIntoRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.stepInto"
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::StepIntoRequest *resolvedReq =
      dynamic_cast<debugger::StepIntoRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::StepIntoRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.stepInto");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testStepOutRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.stepOut"
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::StepOutRequest *resolvedReq =
      dynamic_cast<debugger::StepOutRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::StepOutRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.stepOut");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testStepOverRequest) {
  std::string message = R"(
    {
      "id": 10,
      "method": "Debugger.stepOver"
    }
  )";

  // Builder does not throw
  auto req = Request::fromJsonThrowOnError(message);
  debugger::StepOverRequest *resolvedReq =
      dynamic_cast<debugger::StepOverRequest *>(req.get());

  // Builder returns correct type
  ABI46_0_0EXPECT_FALSE(resolvedReq == nullptr);

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::StepOverRequest deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(resolvedReq->id, 10);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, "Debugger.stepOver");

  ABI46_0_0EXPECT_EQ(resolvedReq->id, deserializedReq.id);
  ABI46_0_0EXPECT_EQ(resolvedReq->method, deserializedReq.method);
}

TEST(MessageTests, testEvaluateOnCallFrameResponseMinimal) {
  std::string message = R"(
    {
      "result":
        {
          "result":{
            "type": "string"
          }
        },
      "id":2
    }
  )";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::EvaluateOnCallFrameResponse deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  ABI46_0_0EXPECT_FALSE(deserializedReq.result.subtype.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.result.value.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.result.unserializableValue.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.result.description.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.result.objectId.hasValue());

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.id, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.result.type, "string");
}

TEST(MessageTests, testEvaluateOnCallFrameResponseFull) {
  std::string message = R"(
    {
      "result":
        {
          "result":{
            "type": "string",
            "subtype": "SuperString",
            "value": {"foobarkey": "foobarval"},
            "unserializableValue": "unserializableValueVal",
            "description": "A Wonderful desc",
            "objectId": "AnObjectID"
          }
        },
      "id":2
    }
  )";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::EvaluateOnCallFrameResponse deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  ABI46_0_0EXPECT_TRUE(deserializedReq.result.subtype.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.result.value.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.result.unserializableValue.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.result.description.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.result.objectId.hasValue());

  ABI46_0_0EXPECT_EQ(deserializedReq.result.subtype.value(), "SuperString");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.result.value.value(),
      folly::parseJson(R"({"foobarkey": "foobarval"})"));
  ABI46_0_0EXPECT_EQ(
      deserializedReq.result.unserializableValue.value(),
      "unserializableValueVal");
  ABI46_0_0EXPECT_EQ(deserializedReq.result.description.value(), "A Wonderful desc");
  ABI46_0_0EXPECT_EQ(deserializedReq.result.objectId.value(), "AnObjectID");

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.id, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.result.type, "string");
}

TEST(MessageTests, testSetBreakpointByUrlResponse) {
  std::string message = R"({
    "id": 1,
    "result":{
      "breakpointId": "myBreakpointId",
      "locations": [
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      ]
    }
  })";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointByUrlResponse deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.id, 1);
  ABI46_0_0EXPECT_EQ(deserializedReq.breakpointId, "myBreakpointId");
  ABI46_0_0EXPECT_EQ(deserializedReq.locations.size(), 1);
  ABI46_0_0EXPECT_EQ(deserializedReq.locations[0].lineNumber, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.locations[0].columnNumber, 3);
  ABI46_0_0EXPECT_EQ(deserializedReq.locations[0].scriptId, "myScriptId");
}

TEST(MessageTests, testSetBreakpointResponse) {
  std::string message = R"({
    "id": 1,
    "result":{
      "breakpointId": "myBreakpointId",
      "actualLocation":
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
    }
  })";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetBreakpointResponse deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.breakpointId, "myBreakpointId");
  ABI46_0_0EXPECT_EQ(deserializedReq.actualLocation.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.actualLocation.columnNumber, 3);
  ABI46_0_0EXPECT_EQ(deserializedReq.actualLocation.scriptId, "myScriptId");
  ABI46_0_0EXPECT_EQ(deserializedReq.id, 1);
}

TEST(MessageTests, testSetInstrumentationBreakpointResponse) {
  std::string message = R"({
    "id": 1,
    "result":{
      "breakpointId": "myBreakpointId"
    }
  })";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::SetInstrumentationBreakpointResponse deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.breakpointId, "myBreakpointId");
  ABI46_0_0EXPECT_EQ(deserializedReq.id, 1);
}

TEST(MessageTests, testBreakpointResolvedNotification) {
  std::string message = R"(
    {
      "method": "Debugger.breakpointResolved",
      "params":{
        "breakpointId" : "42",
        "location":
        {
          "lineNumber": 2,
          "columnNumber": 3,
          "scriptId": "myScriptId"
        }
      }
    }
  )";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::BreakpointResolvedNotification deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.method, "Debugger.breakpointResolved");
  ABI46_0_0EXPECT_EQ(deserializedReq.breakpointId, "42");
  ABI46_0_0EXPECT_EQ(deserializedReq.location.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.location.columnNumber, 3);
  ABI46_0_0EXPECT_EQ(deserializedReq.location.scriptId, "myScriptId");
}

TEST(MessageTests, testPauseNotificationMinimal) {
  std::string message = R"(
    {
      "method": "Debugger.paused",
      "params":{
        "reason": "Some Valid Reason",
        "callFrames":[
          {
            "callFrameId": "aCallFrameId",
            "functionName": "aFunctionName",
            "location":{
              "lineNumber": 2,
              "columnNumber": 3,
              "scriptId": "myScriptId"
            },
            "url": "aURL",
            "scopeChain": [
              {
                "type": "aType",
                "object": {
                  "type": "aRemoteObjectType"
                }
              }
            ],
            "this": {
              "type": "aType"
            }
          }
        ]
      }
    }
  )";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::PausedNotification deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  ABI46_0_0EXPECT_FALSE(deserializedReq.callFrames[0].functionLocation.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.callFrames[0].returnValue.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.asyncStackTrace.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.hitBreakpoints.hasValue());
  ABI46_0_0EXPECT_FALSE(deserializedReq.data.hasValue());

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.method, "Debugger.paused");
  ABI46_0_0EXPECT_EQ(deserializedReq.reason, "Some Valid Reason");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].functionName, "aFunctionName");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].callFrameId, "aCallFrameId");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].url, "aURL");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].location.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].location.columnNumber, 3);
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].location.scriptId, "myScriptId");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].scopeChain[0].type, "aType");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].scopeChain[0].object.type,
      "aRemoteObjectType");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].thisObj.type, "aType");
}

TEST(MessageTests, testPauseNotificationFull) {
  std::string message = R"(
    {
      "method": "Debugger.paused",
      "params":{
        "reason": "Some Valid Reason",
        "callFrames":[
          {
            "functionLocation": {
              "lineNumber": 2,
              "columnNumber": 3,
              "scriptId": "myScriptId"
            },
            "returnValue" : {
              "type": "aRemoteObjectType",
              "subtype": "subtype",
              "className":"className",
              "value": "value",
              "unserializableValue": "unserializableValue",
              "description": "description",
              "objectId": "objectId"
            },
            "callFrameId": "aCallFrameId",
            "functionName": "aFunctionName",
            "location":{
              "lineNumber": 2,
              "columnNumber": 3,
              "scriptId": "myScriptId"
            },
            "url": "aURL",
            "scopeChain": [
              {
                "type": "aType",
                "object": {
                  "type": "aRemoteObjectType"
                }
              }
            ],
            "this": {
              "type": "aType"
            }
          }
        ],
        "data": {"dataKey": "dataVal"},
        "hitBreakpoints": [
          "foo","bar"
        ],
        "asyncStackTrace":{
          "description": "an asyncStackTrace Desc",
          "callFrames":[
          {
            "functionName": "aFunctionName",
            "lineNumber": 2,
            "columnNumber": 3,
            "scriptId": "myScriptId",
            "url": "aURL"
          }
        ]
      }
      }
    }
  )";

  folly::Optional<debugger::Location> functionLocation;
  folly::Optional<runtime::RemoteObject> returnValue;
  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::PausedNotification deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Check optionnals
  // ----------------
  ABI46_0_0EXPECT_TRUE(deserializedReq.callFrames[0].functionLocation.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.callFrames[0].returnValue.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.asyncStackTrace.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.hitBreakpoints.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.data.hasValue());

  ABI46_0_0EXPECT_TRUE(
      deserializedReq.callFrames[0].returnValue.value().subtype.hasValue());
  ABI46_0_0EXPECT_TRUE(
      deserializedReq.callFrames[0].returnValue.value().className.hasValue());
  ABI46_0_0EXPECT_TRUE(deserializedReq.callFrames[0]
                  .returnValue.value()
                  .unserializableValue.hasValue());
  ABI46_0_0EXPECT_TRUE(
      deserializedReq.callFrames[0].returnValue.value().value.hasValue());
  ABI46_0_0EXPECT_TRUE(
      deserializedReq.callFrames[0].returnValue.value().description.hasValue());
  ABI46_0_0EXPECT_TRUE(
      deserializedReq.callFrames[0].returnValue.value().objectId.hasValue());

  // Check optionnals Values
  // -----------------------
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].functionLocation.value().lineNumber, 2);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].functionLocation.value().columnNumber, 3);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].functionLocation.value().scriptId,
      "myScriptId");

  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().type,
      "aRemoteObjectType");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().subtype.hasValue(),
      true);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().subtype.value(),
      "subtype");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().className.hasValue(),
      true);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().className.value(),
      "className");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().value.hasValue(), true);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().value.value(), "value");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0]
          .returnValue.value()
          .unserializableValue.hasValue(),
      true);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0]
          .returnValue.value()
          .unserializableValue.value(),
      "unserializableValue");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().description.hasValue(),
      true);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().description.value(),
      "description");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().objectId.hasValue(),
      true);
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].returnValue.value().objectId.value(),
      "objectId");

  ABI46_0_0EXPECT_EQ(deserializedReq.hitBreakpoints.value()[0], "foo");
  ABI46_0_0EXPECT_EQ(deserializedReq.hitBreakpoints.value()[1], "bar");

  ABI46_0_0EXPECT_EQ(
      deserializedReq.data.value(),
      folly::parseJson(R"({"dataKey": "dataVal"})"));

  // Check Compulsory
  // ----------------
  ABI46_0_0EXPECT_EQ(deserializedReq.method, "Debugger.paused");
  ABI46_0_0EXPECT_EQ(deserializedReq.reason, "Some Valid Reason");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].functionName, "aFunctionName");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].callFrameId, "aCallFrameId");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].url, "aURL");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].location.lineNumber, 2);
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].location.columnNumber, 3);
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].location.scriptId, "myScriptId");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].scopeChain[0].type, "aType");
  ABI46_0_0EXPECT_EQ(
      deserializedReq.callFrames[0].scopeChain[0].object.type,
      "aRemoteObjectType");
  ABI46_0_0EXPECT_EQ(deserializedReq.callFrames[0].thisObj.type, "aType");
}

TEST(MessageTests, testResumedNotification) {
  std::string message = R"(
    {
      "method": "Debugger.resumed"
    }
  )";

  // Serialize and Deserialize are inverse functions
  dynamic messageJSON = folly::parseJson(message);
  debugger::ResumedNotification deserializedReq(messageJSON);
  ABI46_0_0EXPECT_EQ(deserializedReq.toDynamic(), messageJSON);

  // Specifics
  ABI46_0_0EXPECT_EQ(deserializedReq.method, "Debugger.resumed");
}

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
