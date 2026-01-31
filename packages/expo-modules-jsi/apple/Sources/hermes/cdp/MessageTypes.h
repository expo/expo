// Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
// @generated SignedSource<<1284c402aedd087ebdf70e9e76596f1c>>

#pragma once

#include <hermes/cdp/JSONValueInterfaces.h>
#include <hermes/cdp/MessageInterfaces.h>

#include <optional>
#include <vector>

namespace facebook {
namespace hermes {
namespace cdp {
namespace message {

template <typename T>
void deleter(T *p);
using JSONBlob = std::string;
struct UnknownRequest;

namespace debugger {
using BreakpointId = std::string;
struct BreakpointResolvedNotification;
struct CallFrame;
using CallFrameId = std::string;
struct DisableRequest;
struct EnableRequest;
struct EvaluateOnCallFrameRequest;
struct EvaluateOnCallFrameResponse;
struct Location;
struct PauseRequest;
struct PausedNotification;
struct RemoveBreakpointRequest;
struct ResumeRequest;
struct ResumedNotification;
struct Scope;
using ScriptLanguage = std::string;
struct ScriptParsedNotification;
struct ScriptPosition;
struct SetBlackboxPatternsRequest;
struct SetBlackboxedRangesRequest;
struct SetBreakpointByUrlRequest;
struct SetBreakpointByUrlResponse;
struct SetBreakpointRequest;
struct SetBreakpointResponse;
struct SetBreakpointsActiveRequest;
struct SetInstrumentationBreakpointRequest;
struct SetInstrumentationBreakpointResponse;
struct SetPauseOnExceptionsRequest;
struct StepIntoRequest;
struct StepOutRequest;
struct StepOverRequest;
} // namespace debugger

namespace runtime {
struct CallArgument;
struct CallFrame;
struct CallFunctionOnRequest;
struct CallFunctionOnResponse;
struct CompileScriptRequest;
struct CompileScriptResponse;
struct ConsoleAPICalledNotification;
struct CustomPreview;
struct DisableRequest;
struct DiscardConsoleEntriesRequest;
struct EnableRequest;
struct EntryPreview;
struct EvaluateRequest;
struct EvaluateResponse;
struct ExceptionDetails;
struct ExecutionContextCreatedNotification;
struct ExecutionContextDescription;
using ExecutionContextId = long long;
struct GetHeapUsageRequest;
struct GetHeapUsageResponse;
struct GetPropertiesRequest;
struct GetPropertiesResponse;
struct GlobalLexicalScopeNamesRequest;
struct GlobalLexicalScopeNamesResponse;
struct InspectRequestedNotification;
struct InternalPropertyDescriptor;
struct ObjectPreview;
struct PropertyDescriptor;
struct PropertyPreview;
struct ReleaseObjectGroupRequest;
struct ReleaseObjectRequest;
struct RemoteObject;
using RemoteObjectId = std::string;
struct RunIfWaitingForDebuggerRequest;
using ScriptId = std::string;
struct StackTrace;
using Timestamp = double;
using UnserializableValue = std::string;
} // namespace runtime

namespace heapProfiler {
struct AddHeapSnapshotChunkNotification;
struct CollectGarbageRequest;
struct GetHeapObjectIdRequest;
struct GetHeapObjectIdResponse;
struct GetObjectByHeapObjectIdRequest;
struct GetObjectByHeapObjectIdResponse;
using HeapSnapshotObjectId = std::string;
struct HeapStatsUpdateNotification;
struct LastSeenObjectIdNotification;
struct ReportHeapSnapshotProgressNotification;
struct SamplingHeapProfile;
struct SamplingHeapProfileNode;
struct SamplingHeapProfileSample;
struct StartSamplingRequest;
struct StartTrackingHeapObjectsRequest;
struct StopSamplingRequest;
struct StopSamplingResponse;
struct StopTrackingHeapObjectsRequest;
struct TakeHeapSnapshotRequest;
} // namespace heapProfiler

namespace profiler {
struct PositionTickInfo;
struct Profile;
struct ProfileNode;
struct StartRequest;
struct StopRequest;
struct StopResponse;
} // namespace profiler

/// RequestHandler handles requests via the visitor pattern.
struct RequestHandler {
  virtual ~RequestHandler() = default;

  virtual void handle(const UnknownRequest &req) = 0;
  virtual void handle(const debugger::DisableRequest &req) = 0;
  virtual void handle(const debugger::EnableRequest &req) = 0;
  virtual void handle(const debugger::EvaluateOnCallFrameRequest &req) = 0;
  virtual void handle(const debugger::PauseRequest &req) = 0;
  virtual void handle(const debugger::RemoveBreakpointRequest &req) = 0;
  virtual void handle(const debugger::ResumeRequest &req) = 0;
  virtual void handle(const debugger::SetBlackboxPatternsRequest &req) = 0;
  virtual void handle(const debugger::SetBlackboxedRangesRequest &req) = 0;
  virtual void handle(const debugger::SetBreakpointRequest &req) = 0;
  virtual void handle(const debugger::SetBreakpointByUrlRequest &req) = 0;
  virtual void handle(const debugger::SetBreakpointsActiveRequest &req) = 0;
  virtual void handle(
      const debugger::SetInstrumentationBreakpointRequest &req) = 0;
  virtual void handle(const debugger::SetPauseOnExceptionsRequest &req) = 0;
  virtual void handle(const debugger::StepIntoRequest &req) = 0;
  virtual void handle(const debugger::StepOutRequest &req) = 0;
  virtual void handle(const debugger::StepOverRequest &req) = 0;
  virtual void handle(const heapProfiler::CollectGarbageRequest &req) = 0;
  virtual void handle(const heapProfiler::GetHeapObjectIdRequest &req) = 0;
  virtual void handle(
      const heapProfiler::GetObjectByHeapObjectIdRequest &req) = 0;
  virtual void handle(const heapProfiler::StartSamplingRequest &req) = 0;
  virtual void handle(
      const heapProfiler::StartTrackingHeapObjectsRequest &req) = 0;
  virtual void handle(const heapProfiler::StopSamplingRequest &req) = 0;
  virtual void handle(
      const heapProfiler::StopTrackingHeapObjectsRequest &req) = 0;
  virtual void handle(const heapProfiler::TakeHeapSnapshotRequest &req) = 0;
  virtual void handle(const profiler::StartRequest &req) = 0;
  virtual void handle(const profiler::StopRequest &req) = 0;
  virtual void handle(const runtime::CallFunctionOnRequest &req) = 0;
  virtual void handle(const runtime::CompileScriptRequest &req) = 0;
  virtual void handle(const runtime::DisableRequest &req) = 0;
  virtual void handle(const runtime::DiscardConsoleEntriesRequest &req) = 0;
  virtual void handle(const runtime::EnableRequest &req) = 0;
  virtual void handle(const runtime::EvaluateRequest &req) = 0;
  virtual void handle(const runtime::GetHeapUsageRequest &req) = 0;
  virtual void handle(const runtime::GetPropertiesRequest &req) = 0;
  virtual void handle(const runtime::GlobalLexicalScopeNamesRequest &req) = 0;
  virtual void handle(const runtime::ReleaseObjectRequest &req) = 0;
  virtual void handle(const runtime::ReleaseObjectGroupRequest &req) = 0;
  virtual void handle(const runtime::RunIfWaitingForDebuggerRequest &req) = 0;
};

/// NoopRequestHandler can be subclassed to only handle some requests.
struct NoopRequestHandler : public RequestHandler {
  void handle(const UnknownRequest &req) override {}
  void handle(const debugger::DisableRequest &req) override {}
  void handle(const debugger::EnableRequest &req) override {}
  void handle(const debugger::EvaluateOnCallFrameRequest &req) override {}
  void handle(const debugger::PauseRequest &req) override {}
  void handle(const debugger::RemoveBreakpointRequest &req) override {}
  void handle(const debugger::ResumeRequest &req) override {}
  void handle(const debugger::SetBlackboxPatternsRequest &req) override {}
  void handle(const debugger::SetBlackboxedRangesRequest &req) override {}
  void handle(const debugger::SetBreakpointRequest &req) override {}
  void handle(const debugger::SetBreakpointByUrlRequest &req) override {}
  void handle(const debugger::SetBreakpointsActiveRequest &req) override {}
  void handle(
      const debugger::SetInstrumentationBreakpointRequest &req) override {}
  void handle(const debugger::SetPauseOnExceptionsRequest &req) override {}
  void handle(const debugger::StepIntoRequest &req) override {}
  void handle(const debugger::StepOutRequest &req) override {}
  void handle(const debugger::StepOverRequest &req) override {}
  void handle(const heapProfiler::CollectGarbageRequest &req) override {}
  void handle(const heapProfiler::GetHeapObjectIdRequest &req) override {}
  void handle(
      const heapProfiler::GetObjectByHeapObjectIdRequest &req) override {}
  void handle(const heapProfiler::StartSamplingRequest &req) override {}
  void handle(
      const heapProfiler::StartTrackingHeapObjectsRequest &req) override {}
  void handle(const heapProfiler::StopSamplingRequest &req) override {}
  void handle(
      const heapProfiler::StopTrackingHeapObjectsRequest &req) override {}
  void handle(const heapProfiler::TakeHeapSnapshotRequest &req) override {}
  void handle(const profiler::StartRequest &req) override {}
  void handle(const profiler::StopRequest &req) override {}
  void handle(const runtime::CallFunctionOnRequest &req) override {}
  void handle(const runtime::CompileScriptRequest &req) override {}
  void handle(const runtime::DisableRequest &req) override {}
  void handle(const runtime::DiscardConsoleEntriesRequest &req) override {}
  void handle(const runtime::EnableRequest &req) override {}
  void handle(const runtime::EvaluateRequest &req) override {}
  void handle(const runtime::GetHeapUsageRequest &req) override {}
  void handle(const runtime::GetPropertiesRequest &req) override {}
  void handle(const runtime::GlobalLexicalScopeNamesRequest &req) override {}
  void handle(const runtime::ReleaseObjectRequest &req) override {}
  void handle(const runtime::ReleaseObjectGroupRequest &req) override {}
  void handle(const runtime::RunIfWaitingForDebuggerRequest &req) override {}
};

/// Types
struct debugger::Location : public Serializable {
  Location() = default;
  Location(Location &&) = default;
  Location(const Location &) = delete;
  static std::unique_ptr<Location> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  Location &operator=(const Location &) = delete;
  Location &operator=(Location &&) = default;

  runtime::ScriptId scriptId{};
  long long lineNumber{};
  std::optional<long long> columnNumber;
};

struct runtime::PropertyPreview : public Serializable {
  PropertyPreview() = default;
  PropertyPreview(PropertyPreview &&) = default;
  PropertyPreview(const PropertyPreview &) = delete;
  static std::unique_ptr<PropertyPreview> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  PropertyPreview &operator=(const PropertyPreview &) = delete;
  PropertyPreview &operator=(PropertyPreview &&) = default;

  std::string name;
  std::string type;
  std::optional<std::string> value;
  std::unique_ptr<
      runtime::ObjectPreview,
      std::function<void(runtime::ObjectPreview *)>>
      valuePreview{nullptr, deleter<runtime::ObjectPreview>};
  std::optional<std::string> subtype;
};

struct runtime::EntryPreview : public Serializable {
  EntryPreview() = default;
  EntryPreview(EntryPreview &&) = default;
  EntryPreview(const EntryPreview &) = delete;
  static std::unique_ptr<EntryPreview> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  EntryPreview &operator=(const EntryPreview &) = delete;
  EntryPreview &operator=(EntryPreview &&) = default;

  std::unique_ptr<
      runtime::ObjectPreview,
      std::function<void(runtime::ObjectPreview *)>>
      key{nullptr, deleter<runtime::ObjectPreview>};
  std::unique_ptr<
      runtime::ObjectPreview,
      std::function<void(runtime::ObjectPreview *)>>
      value{nullptr, deleter<runtime::ObjectPreview>};
};

struct runtime::ObjectPreview : public Serializable {
  ObjectPreview() = default;
  ObjectPreview(ObjectPreview &&) = default;
  ObjectPreview(const ObjectPreview &) = delete;
  static std::unique_ptr<ObjectPreview> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  ObjectPreview &operator=(const ObjectPreview &) = delete;
  ObjectPreview &operator=(ObjectPreview &&) = default;

  std::string type;
  std::optional<std::string> subtype;
  std::optional<std::string> description;
  bool overflow{};
  std::vector<runtime::PropertyPreview> properties;
  std::optional<std::vector<runtime::EntryPreview>> entries;
};

struct runtime::CustomPreview : public Serializable {
  CustomPreview() = default;
  CustomPreview(CustomPreview &&) = default;
  CustomPreview(const CustomPreview &) = delete;
  static std::unique_ptr<CustomPreview> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  CustomPreview &operator=(const CustomPreview &) = delete;
  CustomPreview &operator=(CustomPreview &&) = default;

  std::string header;
  std::optional<runtime::RemoteObjectId> bodyGetterId;
};

struct runtime::RemoteObject : public Serializable {
  RemoteObject() = default;
  RemoteObject(RemoteObject &&) = default;
  RemoteObject(const RemoteObject &) = delete;
  static std::unique_ptr<RemoteObject> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  RemoteObject &operator=(const RemoteObject &) = delete;
  RemoteObject &operator=(RemoteObject &&) = default;

  std::string type;
  std::optional<std::string> subtype;
  std::optional<std::string> className;
  std::optional<JSONBlob> value;
  std::optional<runtime::UnserializableValue> unserializableValue;
  std::optional<std::string> description;
  std::optional<runtime::RemoteObjectId> objectId;
  std::optional<runtime::ObjectPreview> preview;
  std::optional<runtime::CustomPreview> customPreview;
};

struct runtime::CallFrame : public Serializable {
  CallFrame() = default;
  CallFrame(CallFrame &&) = default;
  CallFrame(const CallFrame &) = delete;
  static std::unique_ptr<CallFrame> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  CallFrame &operator=(const CallFrame &) = delete;
  CallFrame &operator=(CallFrame &&) = default;

  std::string functionName;
  runtime::ScriptId scriptId{};
  std::string url;
  long long lineNumber{};
  long long columnNumber{};
};

struct runtime::StackTrace : public Serializable {
  StackTrace() = default;
  StackTrace(StackTrace &&) = default;
  StackTrace(const StackTrace &) = delete;
  static std::unique_ptr<StackTrace> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  StackTrace &operator=(const StackTrace &) = delete;
  StackTrace &operator=(StackTrace &&) = default;

  std::optional<std::string> description;
  std::vector<runtime::CallFrame> callFrames;
  std::unique_ptr<runtime::StackTrace> parent;
};

struct runtime::ExceptionDetails : public Serializable {
  ExceptionDetails() = default;
  ExceptionDetails(ExceptionDetails &&) = default;
  ExceptionDetails(const ExceptionDetails &) = delete;
  static std::unique_ptr<ExceptionDetails> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  ExceptionDetails &operator=(const ExceptionDetails &) = delete;
  ExceptionDetails &operator=(ExceptionDetails &&) = default;

  long long exceptionId{};
  std::string text;
  long long lineNumber{};
  long long columnNumber{};
  std::optional<runtime::ScriptId> scriptId;
  std::optional<std::string> url;
  std::optional<runtime::StackTrace> stackTrace;
  std::optional<runtime::RemoteObject> exception;
  std::optional<runtime::ExecutionContextId> executionContextId;
};

struct debugger::Scope : public Serializable {
  Scope() = default;
  Scope(Scope &&) = default;
  Scope(const Scope &) = delete;
  static std::unique_ptr<Scope> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  Scope &operator=(const Scope &) = delete;
  Scope &operator=(Scope &&) = default;

  std::string type;
  runtime::RemoteObject object{};
  std::optional<std::string> name;
  std::optional<debugger::Location> startLocation;
  std::optional<debugger::Location> endLocation;
};

struct debugger::CallFrame : public Serializable {
  CallFrame() = default;
  CallFrame(CallFrame &&) = default;
  CallFrame(const CallFrame &) = delete;
  static std::unique_ptr<CallFrame> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  CallFrame &operator=(const CallFrame &) = delete;
  CallFrame &operator=(CallFrame &&) = default;

  debugger::CallFrameId callFrameId{};
  std::string functionName;
  std::optional<debugger::Location> functionLocation;
  debugger::Location location{};
  std::string url;
  std::vector<debugger::Scope> scopeChain;
  runtime::RemoteObject thisObj{};
  std::optional<runtime::RemoteObject> returnValue;
};

struct debugger::ScriptPosition : public Serializable {
  ScriptPosition() = default;
  ScriptPosition(ScriptPosition &&) = default;
  ScriptPosition(const ScriptPosition &) = delete;
  static std::unique_ptr<ScriptPosition> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  ScriptPosition &operator=(const ScriptPosition &) = delete;
  ScriptPosition &operator=(ScriptPosition &&) = default;

  long long lineNumber{};
  long long columnNumber{};
};

struct heapProfiler::SamplingHeapProfileNode : public Serializable {
  SamplingHeapProfileNode() = default;
  SamplingHeapProfileNode(SamplingHeapProfileNode &&) = default;
  SamplingHeapProfileNode(const SamplingHeapProfileNode &) = delete;
  static std::unique_ptr<SamplingHeapProfileNode> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  SamplingHeapProfileNode &operator=(const SamplingHeapProfileNode &) = delete;
  SamplingHeapProfileNode &operator=(SamplingHeapProfileNode &&) = default;

  runtime::CallFrame callFrame{};
  double selfSize{};
  long long id{};
  std::vector<heapProfiler::SamplingHeapProfileNode> children;
};

struct heapProfiler::SamplingHeapProfileSample : public Serializable {
  SamplingHeapProfileSample() = default;
  SamplingHeapProfileSample(SamplingHeapProfileSample &&) = default;
  SamplingHeapProfileSample(const SamplingHeapProfileSample &) = delete;
  static std::unique_ptr<SamplingHeapProfileSample> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  SamplingHeapProfileSample &operator=(const SamplingHeapProfileSample &) =
      delete;
  SamplingHeapProfileSample &operator=(SamplingHeapProfileSample &&) = default;

  double size{};
  long long nodeId{};
  double ordinal{};
};

struct heapProfiler::SamplingHeapProfile : public Serializable {
  SamplingHeapProfile() = default;
  SamplingHeapProfile(SamplingHeapProfile &&) = default;
  SamplingHeapProfile(const SamplingHeapProfile &) = delete;
  static std::unique_ptr<SamplingHeapProfile> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  SamplingHeapProfile &operator=(const SamplingHeapProfile &) = delete;
  SamplingHeapProfile &operator=(SamplingHeapProfile &&) = default;

  heapProfiler::SamplingHeapProfileNode head{};
  std::vector<heapProfiler::SamplingHeapProfileSample> samples;
};

struct profiler::PositionTickInfo : public Serializable {
  PositionTickInfo() = default;
  PositionTickInfo(PositionTickInfo &&) = default;
  PositionTickInfo(const PositionTickInfo &) = delete;
  static std::unique_ptr<PositionTickInfo> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  PositionTickInfo &operator=(const PositionTickInfo &) = delete;
  PositionTickInfo &operator=(PositionTickInfo &&) = default;

  long long line{};
  long long ticks{};
};

struct profiler::ProfileNode : public Serializable {
  ProfileNode() = default;
  ProfileNode(ProfileNode &&) = default;
  ProfileNode(const ProfileNode &) = delete;
  static std::unique_ptr<ProfileNode> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  ProfileNode &operator=(const ProfileNode &) = delete;
  ProfileNode &operator=(ProfileNode &&) = default;

  long long id{};
  runtime::CallFrame callFrame{};
  std::optional<long long> hitCount;
  std::optional<std::vector<long long>> children;
  std::optional<std::string> deoptReason;
  std::optional<std::vector<profiler::PositionTickInfo>> positionTicks;
};

struct profiler::Profile : public Serializable {
  Profile() = default;
  Profile(Profile &&) = default;
  Profile(const Profile &) = delete;
  static std::unique_ptr<Profile> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  Profile &operator=(const Profile &) = delete;
  Profile &operator=(Profile &&) = default;

  std::vector<profiler::ProfileNode> nodes;
  double startTime{};
  double endTime{};
  std::optional<std::vector<long long>> samples;
  std::optional<std::vector<long long>> timeDeltas;
};

struct runtime::CallArgument : public Serializable {
  CallArgument() = default;
  CallArgument(CallArgument &&) = default;
  CallArgument(const CallArgument &) = delete;
  static std::unique_ptr<CallArgument> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  CallArgument &operator=(const CallArgument &) = delete;
  CallArgument &operator=(CallArgument &&) = default;

  std::optional<JSONBlob> value;
  std::optional<runtime::UnserializableValue> unserializableValue;
  std::optional<runtime::RemoteObjectId> objectId;
};

struct runtime::ExecutionContextDescription : public Serializable {
  ExecutionContextDescription() = default;
  ExecutionContextDescription(ExecutionContextDescription &&) = default;
  ExecutionContextDescription(const ExecutionContextDescription &) = delete;
  static std::unique_ptr<ExecutionContextDescription> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  ExecutionContextDescription &operator=(const ExecutionContextDescription &) =
      delete;
  ExecutionContextDescription &operator=(ExecutionContextDescription &&) =
      default;

  runtime::ExecutionContextId id{};
  std::string origin;
  std::string name;
  std::optional<JSONBlob> auxData;
};

struct runtime::PropertyDescriptor : public Serializable {
  PropertyDescriptor() = default;
  PropertyDescriptor(PropertyDescriptor &&) = default;
  PropertyDescriptor(const PropertyDescriptor &) = delete;
  static std::unique_ptr<PropertyDescriptor> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  PropertyDescriptor &operator=(const PropertyDescriptor &) = delete;
  PropertyDescriptor &operator=(PropertyDescriptor &&) = default;

  std::string name;
  std::optional<runtime::RemoteObject> value;
  std::optional<bool> writable;
  std::optional<runtime::RemoteObject> get;
  std::optional<runtime::RemoteObject> set;
  bool configurable{};
  bool enumerable{};
  std::optional<bool> wasThrown;
  std::optional<bool> isOwn;
  std::optional<runtime::RemoteObject> symbol;
};

struct runtime::InternalPropertyDescriptor : public Serializable {
  InternalPropertyDescriptor() = default;
  InternalPropertyDescriptor(InternalPropertyDescriptor &&) = default;
  InternalPropertyDescriptor(const InternalPropertyDescriptor &) = delete;
  static std::unique_ptr<InternalPropertyDescriptor> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
  InternalPropertyDescriptor &operator=(const InternalPropertyDescriptor &) =
      delete;
  InternalPropertyDescriptor &operator=(InternalPropertyDescriptor &&) =
      default;

  std::string name;
  std::optional<runtime::RemoteObject> value;
};

/// Requests
struct UnknownRequest : public Request {
  UnknownRequest();
  static std::unique_ptr<UnknownRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<JSONBlob> params;
};

struct debugger::DisableRequest : public Request {
  DisableRequest();
  static std::unique_ptr<DisableRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::EnableRequest : public Request {
  EnableRequest();
  static std::unique_ptr<EnableRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::EvaluateOnCallFrameRequest : public Request {
  EvaluateOnCallFrameRequest();
  static std::unique_ptr<EvaluateOnCallFrameRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  debugger::CallFrameId callFrameId{};
  std::string expression;
  std::optional<std::string> objectGroup;
  std::optional<bool> includeCommandLineAPI;
  std::optional<bool> silent;
  std::optional<bool> returnByValue;
  std::optional<bool> generatePreview;
  std::optional<bool> throwOnSideEffect;
};

struct debugger::PauseRequest : public Request {
  PauseRequest();
  static std::unique_ptr<PauseRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::RemoveBreakpointRequest : public Request {
  RemoveBreakpointRequest();
  static std::unique_ptr<RemoveBreakpointRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  debugger::BreakpointId breakpointId{};
};

struct debugger::ResumeRequest : public Request {
  ResumeRequest();
  static std::unique_ptr<ResumeRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> terminateOnResume;
};

struct debugger::SetBlackboxPatternsRequest : public Request {
  SetBlackboxPatternsRequest();
  static std::unique_ptr<SetBlackboxPatternsRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::vector<std::string> patterns;
  std::optional<bool> skipAnonymous;
};

struct debugger::SetBlackboxedRangesRequest : public Request {
  SetBlackboxedRangesRequest();
  static std::unique_ptr<SetBlackboxedRangesRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  runtime::ScriptId scriptId{};
  std::vector<debugger::ScriptPosition> positions;
};

struct debugger::SetBreakpointRequest : public Request {
  SetBreakpointRequest();
  static std::unique_ptr<SetBreakpointRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  debugger::Location location{};
  std::optional<std::string> condition;
};

struct debugger::SetBreakpointByUrlRequest : public Request {
  SetBreakpointByUrlRequest();
  static std::unique_ptr<SetBreakpointByUrlRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  long long lineNumber{};
  std::optional<std::string> url;
  std::optional<std::string> urlRegex;
  std::optional<std::string> scriptHash;
  std::optional<long long> columnNumber;
  std::optional<std::string> condition;
};

struct debugger::SetBreakpointsActiveRequest : public Request {
  SetBreakpointsActiveRequest();
  static std::unique_ptr<SetBreakpointsActiveRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  bool active{};
};

struct debugger::SetInstrumentationBreakpointRequest : public Request {
  SetInstrumentationBreakpointRequest();
  static std::unique_ptr<SetInstrumentationBreakpointRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::string instrumentation;
};

struct debugger::SetPauseOnExceptionsRequest : public Request {
  SetPauseOnExceptionsRequest();
  static std::unique_ptr<SetPauseOnExceptionsRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::string state;
};

struct debugger::StepIntoRequest : public Request {
  StepIntoRequest();
  static std::unique_ptr<StepIntoRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::StepOutRequest : public Request {
  StepOutRequest();
  static std::unique_ptr<StepOutRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct debugger::StepOverRequest : public Request {
  StepOverRequest();
  static std::unique_ptr<StepOverRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct heapProfiler::CollectGarbageRequest : public Request {
  CollectGarbageRequest();
  static std::unique_ptr<CollectGarbageRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct heapProfiler::GetHeapObjectIdRequest : public Request {
  GetHeapObjectIdRequest();
  static std::unique_ptr<GetHeapObjectIdRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  runtime::RemoteObjectId objectId{};
};

struct heapProfiler::GetObjectByHeapObjectIdRequest : public Request {
  GetObjectByHeapObjectIdRequest();
  static std::unique_ptr<GetObjectByHeapObjectIdRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  heapProfiler::HeapSnapshotObjectId objectId{};
  std::optional<std::string> objectGroup;
};

struct heapProfiler::StartSamplingRequest : public Request {
  StartSamplingRequest();
  static std::unique_ptr<StartSamplingRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<double> samplingInterval;
  std::optional<bool> includeObjectsCollectedByMajorGC;
  std::optional<bool> includeObjectsCollectedByMinorGC;
};

struct heapProfiler::StartTrackingHeapObjectsRequest : public Request {
  StartTrackingHeapObjectsRequest();
  static std::unique_ptr<StartTrackingHeapObjectsRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> trackAllocations;
};

struct heapProfiler::StopSamplingRequest : public Request {
  StopSamplingRequest();
  static std::unique_ptr<StopSamplingRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct heapProfiler::StopTrackingHeapObjectsRequest : public Request {
  StopTrackingHeapObjectsRequest();
  static std::unique_ptr<StopTrackingHeapObjectsRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> reportProgress;
  std::optional<bool> treatGlobalObjectsAsRoots;
  std::optional<bool> captureNumericValue;
};

struct heapProfiler::TakeHeapSnapshotRequest : public Request {
  TakeHeapSnapshotRequest();
  static std::unique_ptr<TakeHeapSnapshotRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<bool> reportProgress;
  std::optional<bool> treatGlobalObjectsAsRoots;
  std::optional<bool> captureNumericValue;
};

struct profiler::StartRequest : public Request {
  StartRequest();
  static std::unique_ptr<StartRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct profiler::StopRequest : public Request {
  StopRequest();
  static std::unique_ptr<StopRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::CallFunctionOnRequest : public Request {
  CallFunctionOnRequest();
  static std::unique_ptr<CallFunctionOnRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::string functionDeclaration;
  std::optional<runtime::RemoteObjectId> objectId;
  std::optional<std::vector<runtime::CallArgument>> arguments;
  std::optional<bool> silent;
  std::optional<bool> returnByValue;
  std::optional<bool> generatePreview;
  std::optional<bool> userGesture;
  std::optional<bool> awaitPromise;
  std::optional<runtime::ExecutionContextId> executionContextId;
  std::optional<std::string> objectGroup;
};

struct runtime::CompileScriptRequest : public Request {
  CompileScriptRequest();
  static std::unique_ptr<CompileScriptRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::string expression;
  std::string sourceURL;
  bool persistScript{};
  std::optional<runtime::ExecutionContextId> executionContextId;
};

struct runtime::DisableRequest : public Request {
  DisableRequest();
  static std::unique_ptr<DisableRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::DiscardConsoleEntriesRequest : public Request {
  DiscardConsoleEntriesRequest();
  static std::unique_ptr<DiscardConsoleEntriesRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::EnableRequest : public Request {
  EnableRequest();
  static std::unique_ptr<EnableRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::EvaluateRequest : public Request {
  EvaluateRequest();
  static std::unique_ptr<EvaluateRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::string expression;
  std::optional<std::string> objectGroup;
  std::optional<bool> includeCommandLineAPI;
  std::optional<bool> silent;
  std::optional<runtime::ExecutionContextId> contextId;
  std::optional<bool> returnByValue;
  std::optional<bool> generatePreview;
  std::optional<bool> userGesture;
  std::optional<bool> awaitPromise;
};

struct runtime::GetHeapUsageRequest : public Request {
  GetHeapUsageRequest();
  static std::unique_ptr<GetHeapUsageRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

struct runtime::GetPropertiesRequest : public Request {
  GetPropertiesRequest();
  static std::unique_ptr<GetPropertiesRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  runtime::RemoteObjectId objectId{};
  std::optional<bool> ownProperties;
  std::optional<bool> accessorPropertiesOnly;
  std::optional<bool> generatePreview;
};

struct runtime::GlobalLexicalScopeNamesRequest : public Request {
  GlobalLexicalScopeNamesRequest();
  static std::unique_ptr<GlobalLexicalScopeNamesRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::optional<runtime::ExecutionContextId> executionContextId;
};

struct runtime::ReleaseObjectRequest : public Request {
  ReleaseObjectRequest();
  static std::unique_ptr<ReleaseObjectRequest> tryMake(const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  runtime::RemoteObjectId objectId{};
};

struct runtime::ReleaseObjectGroupRequest : public Request {
  ReleaseObjectGroupRequest();
  static std::unique_ptr<ReleaseObjectGroupRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;

  std::string objectGroup;
};

struct runtime::RunIfWaitingForDebuggerRequest : public Request {
  RunIfWaitingForDebuggerRequest();
  static std::unique_ptr<RunIfWaitingForDebuggerRequest> tryMake(
      const JSONObject *obj);

  JSONValue *toJsonVal(JSONFactory &factory) const override;
  void accept(RequestHandler &handler) const override;
};

/// Responses
struct ErrorResponse : public Response {
  ErrorResponse() = default;
  static std::unique_ptr<ErrorResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  long long code;
  std::string message;
  std::optional<JSONBlob> data;
};

struct OkResponse : public Response {
  OkResponse() = default;
  static std::unique_ptr<OkResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
};

struct debugger::EvaluateOnCallFrameResponse : public Response {
  EvaluateOnCallFrameResponse() = default;
  static std::unique_ptr<EvaluateOnCallFrameResponse> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::RemoteObject result{};
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct debugger::SetBreakpointResponse : public Response {
  SetBreakpointResponse() = default;
  static std::unique_ptr<SetBreakpointResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  debugger::BreakpointId breakpointId{};
  debugger::Location actualLocation{};
};

struct debugger::SetBreakpointByUrlResponse : public Response {
  SetBreakpointByUrlResponse() = default;
  static std::unique_ptr<SetBreakpointByUrlResponse> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  debugger::BreakpointId breakpointId{};
  std::vector<debugger::Location> locations;
};

struct debugger::SetInstrumentationBreakpointResponse : public Response {
  SetInstrumentationBreakpointResponse() = default;
  static std::unique_ptr<SetInstrumentationBreakpointResponse> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  debugger::BreakpointId breakpointId{};
};

struct heapProfiler::GetHeapObjectIdResponse : public Response {
  GetHeapObjectIdResponse() = default;
  static std::unique_ptr<GetHeapObjectIdResponse> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  heapProfiler::HeapSnapshotObjectId heapSnapshotObjectId{};
};

struct heapProfiler::GetObjectByHeapObjectIdResponse : public Response {
  GetObjectByHeapObjectIdResponse() = default;
  static std::unique_ptr<GetObjectByHeapObjectIdResponse> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::RemoteObject result{};
};

struct heapProfiler::StopSamplingResponse : public Response {
  StopSamplingResponse() = default;
  static std::unique_ptr<StopSamplingResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  heapProfiler::SamplingHeapProfile profile{};
};

struct profiler::StopResponse : public Response {
  StopResponse() = default;
  static std::unique_ptr<StopResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  profiler::Profile profile{};
};

struct runtime::CallFunctionOnResponse : public Response {
  CallFunctionOnResponse() = default;
  static std::unique_ptr<CallFunctionOnResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::RemoteObject result{};
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::CompileScriptResponse : public Response {
  CompileScriptResponse() = default;
  static std::unique_ptr<CompileScriptResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::optional<runtime::ScriptId> scriptId;
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::EvaluateResponse : public Response {
  EvaluateResponse() = default;
  static std::unique_ptr<EvaluateResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::RemoteObject result{};
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::GetHeapUsageResponse : public Response {
  GetHeapUsageResponse() = default;
  static std::unique_ptr<GetHeapUsageResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  double usedSize{};
  double totalSize{};
};

struct runtime::GetPropertiesResponse : public Response {
  GetPropertiesResponse() = default;
  static std::unique_ptr<GetPropertiesResponse> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::vector<runtime::PropertyDescriptor> result;
  std::optional<std::vector<runtime::InternalPropertyDescriptor>>
      internalProperties;
  std::optional<runtime::ExceptionDetails> exceptionDetails;
};

struct runtime::GlobalLexicalScopeNamesResponse : public Response {
  GlobalLexicalScopeNamesResponse() = default;
  static std::unique_ptr<GlobalLexicalScopeNamesResponse> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::vector<std::string> names;
};

/// Notifications
struct debugger::BreakpointResolvedNotification : public Notification {
  BreakpointResolvedNotification();
  static std::unique_ptr<BreakpointResolvedNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  debugger::BreakpointId breakpointId{};
  debugger::Location location{};
};

struct debugger::PausedNotification : public Notification {
  PausedNotification();
  static std::unique_ptr<PausedNotification> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::vector<debugger::CallFrame> callFrames;
  std::string reason;
  std::optional<JSONBlob> data;
  std::optional<std::vector<std::string>> hitBreakpoints;
  std::optional<runtime::StackTrace> asyncStackTrace;
};

struct debugger::ResumedNotification : public Notification {
  ResumedNotification();
  static std::unique_ptr<ResumedNotification> tryMake(const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;
};

struct debugger::ScriptParsedNotification : public Notification {
  ScriptParsedNotification();
  static std::unique_ptr<ScriptParsedNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::ScriptId scriptId{};
  std::string url;
  long long startLine{};
  long long startColumn{};
  long long endLine{};
  long long endColumn{};
  runtime::ExecutionContextId executionContextId{};
  std::string hash;
  std::optional<JSONBlob> executionContextAuxData;
  std::optional<std::string> sourceMapURL;
  std::optional<bool> hasSourceURL;
  std::optional<bool> isModule;
  std::optional<long long> length;
  std::optional<debugger::ScriptLanguage> scriptLanguage;
};

struct heapProfiler::AddHeapSnapshotChunkNotification : public Notification {
  AddHeapSnapshotChunkNotification();
  static std::unique_ptr<AddHeapSnapshotChunkNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::string chunk;
};

struct heapProfiler::HeapStatsUpdateNotification : public Notification {
  HeapStatsUpdateNotification();
  static std::unique_ptr<HeapStatsUpdateNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::vector<long long> statsUpdate;
};

struct heapProfiler::LastSeenObjectIdNotification : public Notification {
  LastSeenObjectIdNotification();
  static std::unique_ptr<LastSeenObjectIdNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  long long lastSeenObjectId{};
  double timestamp{};
};

struct heapProfiler::ReportHeapSnapshotProgressNotification
    : public Notification {
  ReportHeapSnapshotProgressNotification();
  static std::unique_ptr<ReportHeapSnapshotProgressNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  long long done{};
  long long total{};
  std::optional<bool> finished;
};

struct runtime::ConsoleAPICalledNotification : public Notification {
  ConsoleAPICalledNotification();
  static std::unique_ptr<ConsoleAPICalledNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  std::string type;
  std::vector<runtime::RemoteObject> args;
  runtime::ExecutionContextId executionContextId{};
  runtime::Timestamp timestamp{};
  std::optional<runtime::StackTrace> stackTrace;
};

struct runtime::ExecutionContextCreatedNotification : public Notification {
  ExecutionContextCreatedNotification();
  static std::unique_ptr<ExecutionContextCreatedNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::ExecutionContextDescription context{};
};

struct runtime::InspectRequestedNotification : public Notification {
  InspectRequestedNotification();
  static std::unique_ptr<InspectRequestedNotification> tryMake(
      const JSONObject *obj);
  JSONValue *toJsonVal(JSONFactory &factory) const override;

  runtime::RemoteObject object{};
  JSONBlob hints;
  std::optional<runtime::ExecutionContextId> executionContextId;
};

} // namespace message
} // namespace cdp
} // namespace hermes
} // namespace facebook
