/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_SYNTHTRACE_H
#define HERMES_SYNTHTRACE_H

#include "hermes/Public/RuntimeConfig.h"
#include "hermes/Support/JSONEmitter.h"
#include "hermes/Support/SHA1.h"
#include "hermes/Support/StringSetVector.h"
#include "hermes/VM/GCExecTrace.h"

#include "jsi/jsi.h"

#include <chrono>
#include <cstdlib>
#include <memory>
#include <optional>
#include <string>
#include <vector>

namespace llvh {
// Forward declaration to avoid including llvm headers.
class raw_ostream;
} // namespace llvh

namespace facebook {
namespace hermes {
namespace tracing {

/// A SynthTrace is a list of events that occur in a run of a JS file by a
/// runtime that uses JSI.
/// It can be serialized into JSON and written to a llvh::raw_ostream.
class SynthTrace {
 public:
  using ObjectID = uint64_t;

  /// A tagged union representing different types available in the trace.
  /// We use a an API very similar to HermesValue, but:
  ///   a) also represent the JSI type PropNameID, and
  ///   b) the "payloads" for some the types (Objects, Strings, BigInts, Symbols
  ///   and PropNameIDs) are unique ObjectIDs, rather than actual values.
  /// (This could probably become a std::variant when we could use C++17.)
  class TraceValue {
   public:
    bool isUndefined() const {
      return tag_ == Tag::Undefined;
    }

    bool isNull() const {
      return tag_ == Tag::Null;
    }

    bool isNumber() const {
      return tag_ == Tag::Number;
    }

    bool isBool() const {
      return tag_ == Tag::Bool;
    }

    bool isObject() const {
      return tag_ == Tag::Object;
    }

    bool isBigInt() const {
      return tag_ == Tag::BigInt;
    }

    bool isString() const {
      return tag_ == Tag::String;
    }

    bool isPropNameID() const {
      return tag_ == Tag::PropNameID;
    }

    bool isSymbol() const {
      return tag_ == Tag::Symbol;
    }

    bool isUID() const {
      return isObject() || isBigInt() || isString() || isPropNameID() ||
          isSymbol();
    }

    static TraceValue encodeUndefinedValue() {
      return TraceValue(Tag::Undefined);
    }

    static TraceValue encodeNullValue() {
      return TraceValue(Tag::Null);
    }

    static TraceValue encodeBoolValue(bool value) {
      return TraceValue(value);
    }

    static TraceValue encodeNumberValue(double value) {
      return TraceValue(value);
    }

    static TraceValue encodeObjectValue(uint64_t uid) {
      return TraceValue(Tag::Object, uid);
    }

    static TraceValue encodeBigIntValue(uint64_t uid) {
      return TraceValue(Tag::BigInt, uid);
    }

    static TraceValue encodeStringValue(uint64_t uid) {
      return TraceValue(Tag::String, uid);
    }

    static TraceValue encodePropNameIDValue(uint64_t uid) {
      return TraceValue(Tag::PropNameID, uid);
    }

    static TraceValue encodeSymbolValue(uint64_t uid) {
      return TraceValue(Tag::Symbol, uid);
    }

    bool operator==(const TraceValue &that) const;

    ObjectID getUID() const {
      assert(isUID());
      return val_.uid;
    }

    bool getBool() const {
      assert(isBool());
      return val_.b;
    }

    double getNumber() const {
      assert(isNumber());
      return val_.n;
    }

   private:
    enum class Tag {
      Undefined,
      Null,
      Bool,
      Number,
      Object,
      String,
      PropNameID,
      Symbol,
      BigInt,
    };

    explicit TraceValue(Tag tag) : tag_(tag) {}
    TraceValue(bool b) : tag_(Tag::Bool) {
      val_.b = b;
    }
    TraceValue(double n) : tag_(Tag::Number) {
      val_.n = n;
    }
    TraceValue(Tag tag, uint64_t uid) : tag_(tag) {
      val_.uid = uid;
    }

    Tag tag_;
    union {
      bool b;
      double n;
      ObjectID uid;
    } val_;
  };

  /// Represents the encoding type of a String or PropNameId
  enum class StringEncodingType { ASCII, UTF8, UTF16 };

  /// A TimePoint is a time when some event occurred.
  using TimePoint = std::chrono::steady_clock::time_point;
  using TimeSinceStart = std::chrono::milliseconds;

#define SYNTH_TRACE_RECORD_TYPES(RECORD) \
  RECORD(BeginExecJS)                    \
  RECORD(EndExecJS)                      \
  RECORD(Marker)                         \
  RECORD(CreateObject)                   \
  RECORD(CreateObjectWithPrototype)      \
  RECORD(CreateString)                   \
  RECORD(CreatePropNameID)               \
  RECORD(CreatePropNameIDWithValue)      \
  RECORD(CreateHostObject)               \
  RECORD(CreateHostFunction)             \
  RECORD(QueueMicrotask)                 \
  RECORD(DrainMicrotasks)                \
  RECORD(GetProperty)                    \
  RECORD(SetProperty)                    \
  RECORD(HasProperty)                    \
  RECORD(GetPropertyNames)               \
  RECORD(CreateArray)                    \
  RECORD(ArrayRead)                      \
  RECORD(ArrayWrite)                     \
  RECORD(CallFromNative)                 \
  RECORD(ConstructFromNative)            \
  RECORD(ReturnFromNative)               \
  RECORD(ReturnToNative)                 \
  RECORD(CallToNative)                   \
  RECORD(GetPropertyNative)              \
  RECORD(GetPropertyNativeReturn)        \
  RECORD(SetPropertyNative)              \
  RECORD(SetPropertyNativeReturn)        \
  RECORD(GetNativePropertyNames)         \
  RECORD(GetNativePropertyNamesReturn)   \
  RECORD(CreateBigInt)                   \
  RECORD(BigIntToString)                 \
  RECORD(SetExternalMemoryPressure)      \
  RECORD(Utf8)                           \
  RECORD(Utf16)                          \
  RECORD(GetStringData)                  \
  RECORD(GetPrototype)                   \
  RECORD(SetPrototype)                   \
  RECORD(DeleteProperty)                 \
  RECORD(Global)

  /// RecordType is a tag used to differentiate which type of record it is.
  /// There should be a unique tag for each record type.
  enum class RecordType {
#define RECORD(name) name,
    SYNTH_TRACE_RECORD_TYPES(RECORD)
#undef RECORD
  };

  /// A Record is one element of a trace.
  struct Record {
    /// The time at which this event occurred with respect to the start of
    /// execution.
    /// NOTE: This is not compared in the \c operator= in order for tests to
    /// pass.
    const TimeSinceStart time_;
    explicit Record() = delete;
    explicit Record(TimeSinceStart time) : time_(time) {}
    virtual ~Record() = default;

    /// Write out a serialization of this Record.
    /// \param json An emitter connected to an ostream which will write out
    ///   JSON.
    void toJSON(::hermes::JSONEmitter &json) const;
    virtual RecordType getType() const = 0;

    // If \p val is an object (that is,  an Object or String), push its
    // decoding onto objs.
    static void pushIfTrackedValue(
        const TraceValue &val,
        std::vector<ObjectID> &objs) {
      if (val.isUID()) {
        objs.push_back(val.getUID());
      }
    }

    /// \return A list of object ids that are defined by this record.
    /// Defined means that the record would produce that object,
    /// string, or PropNameID as a locally accessible value if it were
    /// executed.
    virtual std::vector<ObjectID> defs() const {
      return {};
    }

    /// \return A list of object ids that are used by this record.
    /// Used means that the record would use that object, string, or
    /// PropNameID as a value if it were executed.
    /// If a record uses an object id, then some preceding record
    /// (either in the same function invocation, or somewhere
    /// globally) must provide a definition.
    virtual std::vector<ObjectID> uses() const {
      return {};
    }

   protected:
    /// Emit JSON fields into \p os, excluding the closing curly brace.
    /// NOTE: This is overridable, and non-abstract children should call the
    /// parent.
    virtual void toJSONInternal(::hermes::JSONEmitter &json) const;
  };

  /// If \p traceStream is non-null, the trace will be written to that
  /// stream.  Otherwise, no trace is written.
  explicit SynthTrace(
      const ::hermes::vm::RuntimeConfig &conf,
      std::unique_ptr<llvh::raw_ostream> traceStream = nullptr,
      std::optional<ObjectID> = {});

  template <typename T, typename... Args>
  void emplace_back(Args &&...args) {
    records_.emplace_back(new T(std::forward<Args>(args)...));
    flushRecordsIfNecessary();
  }

  const std::vector<std::unique_ptr<Record>> &records() const {
    return records_;
  }

  std::optional<ObjectID> globalObjID() const {
    return globalObjID_;
  }

  /// Given a trace value, turn it into its typed string.
  static std::string encode(TraceValue value);
  /// Encode an undefined JS value for the trace.
  static TraceValue encodeUndefined();
  /// Encode a null JS value for the trace.
  static TraceValue encodeNull();
  /// Encode a boolean JS value for the trace.
  static TraceValue encodeBool(bool value);
  /// Encodes a numeric value for the trace.
  static TraceValue encodeNumber(double value);
  /// Encodes an object for the trace as a unique id.
  static TraceValue encodeObject(ObjectID objID);
  /// Encodes a bigint for the trace as a unique id.
  static TraceValue encodeBigInt(ObjectID objID);
  /// Encodes a string for the trace as a unique id.
  static TraceValue encodeString(ObjectID objID);
  /// Encodes a PropNameID for the trace as a unique id.
  static TraceValue encodePropNameID(ObjectID objID);
  /// Encodes a Symbol for the trace as a unique id.
  static TraceValue encodeSymbol(ObjectID objID);

  /// Decodes a string into a trace value.
  static TraceValue decode(const std::string &);

#ifdef HERMESVM_API_TRACE_DEBUG
  /// Given a Value, return a descriptive string. This should only be used to
  /// provide more debugging info when creating records.
  static std::string getDescriptiveString(
      jsi::Runtime &runtime,
      const jsi::Value &value);
#endif

  /// The version of the Synth Benchmark
  constexpr static uint32_t synthVersion() {
    return 5;
  }

  static const char *nameFromReleaseUnused(::hermes::vm::ReleaseUnused ru);
  static ::hermes::vm::ReleaseUnused releaseUnusedFromName(const char *name);

 private:
  llvh::raw_ostream &os() const {
    return (*traceStream_);
  }

  /// If we're tracing to a file, and the number of accumulated
  /// records has reached the limit kTraceRecordsToFlush, below,
  /// flush the records to the file, and reset the accumulated records
  /// to be empty.
  void flushRecordsIfNecessary();

  /// Assumes we're tracing to a file; flush accumulated records to
  /// the file, and reset the accumulated records to be empty.
  void flushRecords();

  static constexpr unsigned kTraceRecordsToFlush = 100;

  /// If we're tracing to a file, pointer to a stream onto
  /// traceFilename_.  Null otherwise.
  std::unique_ptr<llvh::raw_ostream> traceStream_;
  /// If we're tracing to a file, pointer to a JSONEmitter writting
  /// into *traceStream_.  Null otherwise.
  std::unique_ptr<::hermes::JSONEmitter> json_;
  /// The records currently being accumulated in the trace.  If we are
  /// tracing to a file, these will be only the records not yet
  /// written to the file.
  std::vector<std::unique_ptr<Record>> records_;
  /// The id of the global object.
  /// Note: Keeping this as optional to support replaying the older trace
  /// records before the change of TracingRuntime's PointerValue based ObjectID.
  /// We can remove this once we remove old traces.
  /// TODO: T189113203
  const std::optional<ObjectID> globalObjID_;

 public:
  /// @name Record classes
  /// @{

  /// A MarkerRecord is an event that simply records an interesting event that
  /// is not necessarily meaningful to the interpreter. It comes with a tag that
  /// says what type of marker it was.
  struct MarkerRecord : public Record {
    static constexpr RecordType type{RecordType::Marker};
    const std::string tag_;
    explicit MarkerRecord(TimeSinceStart time, const std::string &tag)
        : Record(time), tag_(tag) {}
    RecordType getType() const override {
      return type;
    }

   protected:
    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A BeginExecJSRecord is an event where execution begins of JS source
  /// code. This is not necessarily the first record, since native code can
  /// inject values into the VM before any source code is run.
  struct BeginExecJSRecord final : public Record {
    static constexpr RecordType type{RecordType::BeginExecJS};
    explicit BeginExecJSRecord(
        TimeSinceStart time,
        std::string sourceURL,
        ::hermes::SHA1 sourceHash,
        bool sourceIsBytecode)
        : Record(time),
          sourceURL_(std::move(sourceURL)),
          sourceHash_(std::move(sourceHash)),
          sourceIsBytecode_(sourceIsBytecode) {}

    RecordType getType() const override {
      return type;
    }

    const std::string &sourceURL() const {
      return sourceURL_;
    }

    const ::hermes::SHA1 &sourceHash() const {
      return sourceHash_;
    }

   private:
    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    /// The URL providing the source file mapping for the file being executed.
    /// Can be empty.
    std::string sourceURL_;

    /// A hash of the source that was executed. The source hash must match up
    /// when the file is replayed.
    /// The hash is optional, and will be all zeros if not provided.
    ::hermes::SHA1 sourceHash_;

    /// Whether the input file was source or bytecode.
    bool sourceIsBytecode_;
  };

  struct ReturnMixin {
    const TraceValue retVal_;

    explicit ReturnMixin(TraceValue value) : retVal_(value) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const;
  };

  /// A EndExecJSRecord is an event where execution of JS source code stops.
  /// This does not mean that the source code will never be entered again, just
  /// that it has an entered a phase where it is waiting for native code to call
  /// into the JS. This event is not guaranteed to be the last event, for the
  /// aforementioned reason. The logged retVal is the result of the evaluation
  /// ("undefined" in the majority of cases).
  struct EndExecJSRecord final : public MarkerRecord, public ReturnMixin {
    static constexpr RecordType type{RecordType::EndExecJS};
    EndExecJSRecord(TimeSinceStart time, TraceValue retVal)
        : MarkerRecord(time, "end_global_code"), ReturnMixin(retVal) {}

    RecordType getType() const override {
      return type;
    }
    virtual void toJSONInternal(::hermes::JSONEmitter &json) const final;
    std::vector<ObjectID> defs() const override {
      auto defs = MarkerRecord::defs();
      pushIfTrackedValue(retVal_, defs);
      return defs;
    }
  };

  /// A CreateObjectRecord is an event where an empty object is created by the
  /// native code.
  struct CreateObjectRecord : public Record {
    static constexpr RecordType type{RecordType::CreateObject};
    /// The ObjectID of the object that was created by native function calls
    /// like Runtime::createObject().
    const ObjectID objID_;

    explicit CreateObjectRecord(TimeSinceStart time, ObjectID objID)
        : Record(time), objID_(objID) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {objID_};
    }

    std::vector<ObjectID> uses() const override {
      return {};
    }
  };

  /// A CreateBigIntRecord is an event where a jsi::BigInt (and thus a
  /// Hermes BigIntPrimitive) is created by the native code.
  struct CreateBigIntRecord : public Record {
    static constexpr RecordType type{RecordType::CreateBigInt};
    /// The ObjectID of the BigInt that was created by
    /// Runtime::createBigIntFromInt64() or Runtime::createBigIntFromUint64().
    const ObjectID objID_;
    enum class Method {
      FromInt64,
      FromUint64,
    };
    /// The method used for creating the BigInt.
    Method method_;
    /// The value used for creating the BigInt.
    uint64_t bits_;

    CreateBigIntRecord(
        TimeSinceStart time,
        ObjectID objID,
        Method m,
        uint64_t bits)
        : Record(time), objID_(objID), method_(m), bits_(bits) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {objID_};
    }

    std::vector<ObjectID> uses() const override {
      return {};
    }
  };

  /// A BigIntToStringRecord is an event where a jsi::BigInt is converted to a
  /// string by native code
  struct BigIntToStringRecord : public Record {
    static constexpr RecordType type{RecordType::BigIntToString};
    /// The ObjectID of the string that was returned from
    /// Runtime::bigintToString().
    const ObjectID strID_;
    /// The ObjectID of the BigInt that was passed to Runtime::bigintToString().
    const ObjectID bigintID_;
    /// The radix used for converting the BigInt to a string.
    int radix_;

    BigIntToStringRecord(
        TimeSinceStart time,
        ObjectID strID,
        ObjectID bigintID,
        int radix)
        : Record(time), strID_(strID), bigintID_(bigintID), radix_(radix) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {strID_};
    }

    std::vector<ObjectID> uses() const override {
      return {bigintID_};
    }
  };

  /// A CreateStringRecord is an event where a jsi::String (and thus a
  /// Hermes StringPrimitive) is created by the native code.
  struct CreateStringRecord : public Record {
    static constexpr RecordType type{RecordType::CreateString};
    /// The ObjectID of the string that was created by
    /// Runtime::createStringFromAscii() or Runtime::createStringFromUtf8().
    const ObjectID objID_;
    /// The string that was passed to Runtime::createStringFromAscii() or
    /// Runtime::createStringFromUtf8() when the string was created.
    std::string chars_;
    /// The string that was passed to Runtime::createStringFromUtf16()
    std::u16string chars16_;
    /// Whether the String was created from ASCII, UTF-8 or UTF-16
    StringEncodingType encodingType_;

    // General UTF-8.
    CreateStringRecord(
        TimeSinceStart time,
        ObjectID objID,
        const uint8_t *chars,
        size_t length)
        : Record(time),
          objID_(objID),
          chars_(reinterpret_cast<const char *>(chars), length),
          encodingType_(StringEncodingType::UTF8) {}
    // Ascii.
    CreateStringRecord(
        TimeSinceStart time,
        ObjectID objID,
        const char *chars,
        size_t length)
        : Record(time),
          objID_(objID),
          chars_(chars, length),
          encodingType_(StringEncodingType::ASCII) {}
    // UTF-16.
    CreateStringRecord(
        TimeSinceStart time,
        ObjectID objID,
        const char16_t *chars,
        size_t length)
        : Record(time),
          objID_(objID),
          chars16_(chars, length),
          encodingType_(StringEncodingType::UTF16) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {objID_};
    }

    std::vector<ObjectID> uses() const override {
      return {};
    }
  };

  /// A CreatePropNameIDRecord is an event where a jsi::PropNameID is
  /// created by the native code.
  struct CreatePropNameIDRecord : public Record {
    static constexpr RecordType type{RecordType::CreatePropNameID};
    /// The ObjectID of the PropNameID that was created.
    const ObjectID propNameID_;
    /// The string that was passed to Runtime::createPropNameIDFromAscii() or
    /// Runtime::createPropNameIDFromUtf8().
    std::string chars_;
    /// The string that was passed to Runtime::createPropNameIDFromUtf16()
    std::u16string chars16_;
    /// Whether the PropNameID was created from ASCII, UTF-8, or UTF-16
    StringEncodingType encodingType_;

    // General UTF-8.
    CreatePropNameIDRecord(
        TimeSinceStart time,
        ObjectID propNameID,
        const uint8_t *chars,
        size_t length)
        : Record(time),
          propNameID_(propNameID),
          chars_(reinterpret_cast<const char *>(chars), length),
          encodingType_(StringEncodingType::UTF8) {}
    // Ascii.
    CreatePropNameIDRecord(
        TimeSinceStart time,
        ObjectID propNameID,
        const char *chars,
        size_t length)
        : Record(time),
          propNameID_(propNameID),
          chars_(chars, length),
          encodingType_(StringEncodingType::ASCII) {}
    // UTF16
    CreatePropNameIDRecord(
        TimeSinceStart time,
        ObjectID propNameID,
        const char16_t *chars,
        size_t length)
        : Record(time),
          propNameID_(propNameID),
          chars16_(chars, length),
          encodingType_(StringEncodingType::UTF16) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {propNameID_};
    }

    std::vector<ObjectID> uses() const override {
      return {};
    }
  };

  /// A CreatePropNameIDWithValueRecord is an event where a jsi::PropNameID is
  /// created by the native code from JSI Value
  struct CreatePropNameIDWithValueRecord : public Record {
    static constexpr RecordType type{RecordType::CreatePropNameIDWithValue};
    /// The ObjectID of the PropNameID that was created.
    const ObjectID propNameID_;
    /// The String or Symbol that was passed to
    /// Runtime::createPropNameIDFromString() or
    /// Runtime::createPropNameIDFromSymbol().
    const TraceValue traceValue_;

    // jsi::String or jsi::Symbol.
    CreatePropNameIDWithValueRecord(
        TimeSinceStart time,
        ObjectID propNameID,
        TraceValue traceValue)
        : Record(time), propNameID_(propNameID), traceValue_(traceValue) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {propNameID_};
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> vec;
      pushIfTrackedValue(traceValue_, vec);
      return vec;
    }
  };

  struct CreateObjectWithPrototypeRecord : public Record {
    static constexpr RecordType type{RecordType::CreateObjectWithPrototype};
    const ObjectID objID_;
    /// The prototype being assigned
    const TraceValue prototype_;

    CreateObjectWithPrototypeRecord(
        TimeSinceStart time,
        ObjectID objID,
        TraceValue prototype)
        : Record(time), objID_(objID), prototype_(prototype) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> uses{objID_};
      pushIfTrackedValue(prototype_, uses);
      return uses;
    }
  };

  struct CreateHostObjectRecord final : public CreateObjectRecord {
    static constexpr RecordType type{RecordType::CreateHostObject};
    using CreateObjectRecord::CreateObjectRecord;
    RecordType getType() const override {
      return type;
    }
  };

  struct CreateHostFunctionRecord final : public CreateObjectRecord {
    static constexpr RecordType type{RecordType::CreateHostFunction};
    /// The ObjectID of the PropNameID that was passed to
    /// Runtime::createFromHostFunction().
    uint32_t propNameID_;
#ifdef HERMESVM_API_TRACE_DEBUG
    const std::string functionName_;
#endif
    /// The number of parameters that the created host function takes.
    const unsigned paramCount_;

    CreateHostFunctionRecord(
        TimeSinceStart time,
        ObjectID objID,
        ObjectID propNameID,
#ifdef HERMESVM_API_TRACE_DEBUG
        std::string functionName,
#endif
        unsigned paramCount)
        : CreateObjectRecord(time, objID),
          propNameID_(propNameID),
#ifdef HERMESVM_API_TRACE_DEBUG
          functionName_(std::move(functionName)),
#endif
          paramCount_(paramCount) {
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      return {propNameID_};
    }
  };

  struct QueueMicrotaskRecord : public Record {
    static constexpr RecordType type{RecordType::QueueMicrotask};
    /// The ObjectID of the callback function that was queued.
    const ObjectID callbackID_;

    QueueMicrotaskRecord(TimeSinceStart time, ObjectID callbackID)
        : Record(time), callbackID_(callbackID) {}

    RecordType getType() const override {
      return type;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    std::vector<ObjectID> uses() const override {
      return {callbackID_};
    }
  };

  struct DrainMicrotasksRecord : public Record {
    static constexpr RecordType type{RecordType::DrainMicrotasks};
    /// maxMicrotasksHint value passed to Runtime::drainMicrotasks() call.
    int maxMicrotasksHint_;

    DrainMicrotasksRecord(TimeSinceStart time, int tasksHint = -1)
        : Record(time), maxMicrotasksHint_(tasksHint) {}

    RecordType getType() const override {
      return type;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A GetPropertyRecord is an event where native code accesses the property
  /// of a JS object.
  struct GetPropertyRecord : public Record {
    /// The ObjectID of the object that was accessed for its property.
    const ObjectID objID_;
    /// String or PropNameID or Value passed to getProperty.
    const TraceValue propID_;
#ifdef HERMESVM_API_TRACE_DEBUG
    std::string propNameDbg_;
#endif

    GetPropertyRecord(
        TimeSinceStart time,
        ObjectID objID,
        TraceValue propID
#ifdef HERMESVM_API_TRACE_DEBUG
        ,
        const std::string &propNameDbg
#endif
        )
        : Record(time),
          objID_(objID),
          propID_(propID)
#ifdef HERMESVM_API_TRACE_DEBUG
          ,
          propNameDbg_(propNameDbg)
#endif
    {
    }

    static constexpr RecordType type{RecordType::GetProperty};
    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> uses{objID_};
      pushIfTrackedValue(propID_, uses);
      return uses;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A SetPropertyRecord is an event where native code writes to the property
  /// of a JS object.
  struct SetPropertyRecord : public Record {
    /// The ObjectID of the object that was accessed for its property.
    const ObjectID objID_;
    /// String or PropNameID or Value passed to setProperty.
    const TraceValue propID_;
#ifdef HERMESVM_API_TRACE_DEBUG
    std::string propNameDbg_;
#endif
    /// The value being assigned.
    const TraceValue value_;

    SetPropertyRecord(
        TimeSinceStart time,
        ObjectID objID,
        TraceValue propID,
#ifdef HERMESVM_API_TRACE_DEBUG
        const std::string &propNameDbg,
#endif
        TraceValue value)
        : Record(time),
          objID_(objID),
          propID_(propID),
#ifdef HERMESVM_API_TRACE_DEBUG
          propNameDbg_(propNameDbg),
#endif
          value_(value) {
    }

    static constexpr RecordType type{RecordType::SetProperty};
    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> uses{objID_};
      pushIfTrackedValue(propID_, uses);
      pushIfTrackedValue(value_, uses);
      return uses;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A HasPropertyRecord is an event where native code queries whether a
  /// property exists on an object.  (We don't care about the result because
  /// it cannot influence the trace.)
  struct HasPropertyRecord final : public Record {
    static constexpr RecordType type{RecordType::HasProperty};
    /// The ObjectID of the object that was accessed for its property.
    const ObjectID objID_;
#ifdef HERMESVM_API_TRACE_DEBUG
    std::string propNameDbg_;
#endif
    /// The property name that was passed to hasProperty().
    const TraceValue propID_;

    HasPropertyRecord(
        TimeSinceStart time,
        ObjectID objID,
        TraceValue propID
#ifdef HERMESVM_API_TRACE_DEBUG
        ,
        const std::string &propNameDbg
#endif
        )
        : Record(time),
          objID_(objID),
#ifdef HERMESVM_API_TRACE_DEBUG
          propNameDbg_(propNameDbg),
#endif
          propID_(propID) {
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> vec{objID_};
      pushIfTrackedValue(propID_, vec);
      return vec;
    }
  };

  struct GetPropertyNamesRecord final : public Record {
    static constexpr RecordType type{RecordType::GetPropertyNames};
    /// The ObjectID of the object that was accessed for its property.
    const ObjectID objID_;

    explicit GetPropertyNamesRecord(TimeSinceStart time, ObjectID objID)
        : Record(time), objID_(objID) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      return {objID_};
    }
  };

  /// A SetPrototypeRecord is an event where native code sets the prototype of a
  /// JS Object
  struct SetPrototypeRecord : public Record {
    static constexpr RecordType type{RecordType::SetPrototype};
    /// The ObjectID of the object that was accessed for its prototype.
    const ObjectID objID_;
    /// The custom prototype being assigned
    const TraceValue value_;
    SetPrototypeRecord(TimeSinceStart time, ObjectID objID, TraceValue value)
        : Record(time), objID_(objID), value_(value) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> uses{objID_};
      pushIfTrackedValue(value_, uses);
      return uses;
    }
  };

  struct DeletePropertyRecord final : public Record {
    static constexpr RecordType type{RecordType::DeleteProperty};
    /// The object ID of the object that was accessed for its property
    const ObjectID objID_;
    /// The name of the property being deleted
    const TraceValue propID_;

    DeletePropertyRecord(TimeSinceStart time, ObjectID objID, TraceValue propID)
        : Record(time), objID_(objID), propID_(propID) {}

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> uses{objID_};
      pushIfTrackedValue(propID_, uses);
      return uses;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A GetPrototypeRecord is an event where native code gets the prototype of a
  /// JS Object
  struct GetPrototypeRecord : public Record {
    static constexpr RecordType type{RecordType::GetPrototype};
    /// The ObjectID of the object that was accessed for its prototype.
    const ObjectID objID_;
    GetPrototypeRecord(TimeSinceStart time, ObjectID objID)
        : Record(time), objID_(objID) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      return {objID_};
    }
  };

  /// A CreateArrayRecord is an event where a new array is created of a specific
  /// length.
  struct CreateArrayRecord final : public Record {
    static constexpr RecordType type{RecordType::CreateArray};
    /// The ObjectID of the array that was created by the createArray().
    const ObjectID objID_;
    /// The length of the array that was passed to createArray().
    const size_t length_;

    explicit CreateArrayRecord(
        TimeSinceStart time,
        ObjectID objID,
        size_t length)
        : Record(time), objID_(objID), length_(length) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> defs() const override {
      return {objID_};
    }
  };

  /// An ArrayReadRecord is an event where a value was read from an index
  /// of an array.
  /// It is modeled separately from GetProperty because it is more efficient to
  /// read from a numeric index on an array than a string.
  struct ArrayReadRecord final : public Record {
    /// The ObjectID of the array that was accessed.
    const ObjectID objID_;
    /// The index of the element that was accessed in the array.
    const size_t index_;

    explicit ArrayReadRecord(TimeSinceStart time, ObjectID objID, size_t index)
        : Record(time), objID_(objID), index_(index) {}

    static constexpr RecordType type{RecordType::ArrayRead};
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      return {objID_};
    }
    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// An ArrayWriteRecord is an event where a value was written into an index
  /// of an array.
  struct ArrayWriteRecord final : public Record {
    /// The ObjectID of the array that was accessed.
    const ObjectID objID_;
    /// The index of the element that was accessed in the array.
    const size_t index_;
    /// The value that was written to the array.
    const TraceValue value_;

    explicit ArrayWriteRecord(
        TimeSinceStart time,
        ObjectID objID,
        size_t index,
        TraceValue value)
        : Record(time), objID_(objID), index_(index), value_(value) {}

    static constexpr RecordType type{RecordType::ArrayWrite};
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> uses{objID_};
      pushIfTrackedValue(value_, uses);
      return uses;
    }
    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  struct CallRecord : public Record {
    /// The ObjectID of the function JS object that was called from
    /// JS or native.
    const ObjectID functionID_;
    /// The value of the this argument passed to the function call.
    const TraceValue thisArg_;
    /// The arguments given to a call (excluding the this parameter),
    /// already JSON stringified.
    const std::vector<TraceValue> args_;

    explicit CallRecord(
        TimeSinceStart time,
        ObjectID functionID,
        TraceValue thisArg,
        const std::vector<TraceValue> &args)
        : Record(time),
          functionID_(functionID),
          thisArg_(thisArg),
          args_(args) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    std::vector<ObjectID> uses() const override {
      // The function is used regardless of direction.
      return {functionID_};
    }

   protected:
    std::vector<ObjectID> getArgTrackedIDs() const {
      std::vector<ObjectID> objs;
      pushIfTrackedValue(thisArg_, objs);
      for (const auto &arg : args_) {
        pushIfTrackedValue(arg, objs);
      }
      return objs;
    }
  };

  /// A CallFromNativeRecord is an event where native code calls into a JS
  /// function.
  struct CallFromNativeRecord : public CallRecord {
    static constexpr RecordType type{RecordType::CallFromNative};
    using CallRecord::CallRecord;
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      auto uses = CallRecord::uses();
      auto objs = CallRecord::getArgTrackedIDs();
      uses.insert(uses.end(), objs.begin(), objs.end());
      return uses;
    }
  };

  /// A ConstructFromNativeRecord is the same as \c CallFromNativeRecord, except
  /// the function is called with the new operator.
  struct ConstructFromNativeRecord final : public CallFromNativeRecord {
    static constexpr RecordType type{RecordType::ConstructFromNative};
    using CallFromNativeRecord::CallFromNativeRecord;
    RecordType getType() const override {
      return type;
    }
  };

  /// A ReturnFromNativeRecord is an event where a native function returns to a
  /// JS caller.
  /// It pairs with \c CallToNativeRecord.
  struct ReturnFromNativeRecord final : public Record, public ReturnMixin {
    static constexpr RecordType type{RecordType::ReturnFromNative};
    ReturnFromNativeRecord(TimeSinceStart time, TraceValue retVal)
        : Record(time), ReturnMixin(retVal) {}
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      auto uses = Record::uses();
      pushIfTrackedValue(retVal_, uses);
      return uses;
    }
    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A ReturnToNativeRecord is an event where a JS function returns to a native
  /// caller.
  /// It pairs with \c CallFromNativeRecord.
  struct ReturnToNativeRecord final : public Record, public ReturnMixin {
    static constexpr RecordType type{RecordType::ReturnToNative};
    ReturnToNativeRecord(TimeSinceStart time, TraceValue retVal)
        : Record(time), ReturnMixin(retVal) {}
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> defs() const override {
      auto defs = Record::defs();
      pushIfTrackedValue(retVal_, defs);
      return defs;
    }
    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A CallToNativeRecord is an event where JS code calls into a natively
  /// defined function.
  struct CallToNativeRecord final : public CallRecord {
    static constexpr RecordType type{RecordType::CallToNative};
    using CallRecord::CallRecord;
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> defs() const override {
      auto defs = CallRecord::defs();
      auto objs = CallRecord::getArgTrackedIDs();
      defs.insert(defs.end(), objs.begin(), objs.end());
      return defs;
    }
  };

  struct GetOrSetPropertyNativeRecord : public Record {
    /// The ObjectID of the host object that was being accessed for its
    /// property.
    const ObjectID hostObjectID_;
    /// The ObjectID of the PropNameID that was passed to HostObject::get()
    /// or HostObject::set().
    const ObjectID propNameID_;
    /// The UTF-8 string of the PropNameID that was passed to HostObject::get()
    /// or HostObject::set().
    const std::string propName_;

    GetOrSetPropertyNativeRecord(
        TimeSinceStart time,
        ObjectID hostObjectID,
        ObjectID propNameID,
        const std::string &propName)
        : Record(time),
          hostObjectID_(hostObjectID),
          propNameID_(propNameID),
          propName_(propName) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    std::vector<ObjectID> defs() const override {
      return {propNameID_};
    }
    std::vector<ObjectID> uses() const override {
      return {hostObjectID_};
    }

   protected:
  };

  /// A GetPropertyNativeRecord is an event where JS tries to access a property
  /// on a native object.
  /// This needs to be modeled as a call with no arguments, since native code
  /// can arbitrarily affect the JS heap during the accessor.
  struct GetPropertyNativeRecord final : public GetOrSetPropertyNativeRecord {
    static constexpr RecordType type{RecordType::GetPropertyNative};
    using GetOrSetPropertyNativeRecord::GetOrSetPropertyNativeRecord;
    RecordType getType() const override {
      return type;
    }
  };

  struct GetPropertyNativeReturnRecord final : public Record,
                                               public ReturnMixin {
    static constexpr RecordType type{RecordType::GetPropertyNativeReturn};
    GetPropertyNativeReturnRecord(TimeSinceStart time, TraceValue retVal)
        : Record(time), ReturnMixin(retVal) {}
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> uses() const override {
      auto uses = Record::uses();
      pushIfTrackedValue(retVal_, uses);
      return uses;
    }

   protected:
    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A SetPropertyNativeRecord is an event where JS code writes to the property
  /// of a Native object.
  /// This needs to be modeled as a call with one argument, since native code
  /// can arbitrarily affect the JS heap during the accessor.
  struct SetPropertyNativeRecord final : public GetOrSetPropertyNativeRecord {
    static constexpr RecordType type{RecordType::SetPropertyNative};
    /// The value that was passed to HostObject::set() call.
    TraceValue value_;

    SetPropertyNativeRecord(
        TimeSinceStart time,
        ObjectID hostObjectID,
        ObjectID propNameID,
        const std::string &propName,
        TraceValue value)
        : GetOrSetPropertyNativeRecord(
              time,
              hostObjectID,
              propNameID,
              propName),
          value_(value) {}

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
    RecordType getType() const override {
      return type;
    }
    std::vector<ObjectID> defs() const override {
      auto defs = GetOrSetPropertyNativeRecord::defs();
      pushIfTrackedValue(value_, defs);
      return defs;
    }
  };

  /// A SetPropertyNativeReturnRecord needs to record no extra information
  struct SetPropertyNativeReturnRecord final : public Record {
    static constexpr RecordType type{RecordType::SetPropertyNativeReturn};
    using Record::Record;
    RecordType getType() const override {
      return type;
    }
  };

  /// A GetNativePropertyNamesRecord records an event where JS asked for a list
  /// of property names available on a host object. It records the object, and
  /// the returned list of property names.
  struct GetNativePropertyNamesRecord : public Record {
    static constexpr RecordType type{RecordType::GetNativePropertyNames};
    /// The ObjectID of the host object that was being accessed for
    /// HostObjet::getPropertyNames() call.
    const ObjectID hostObjectID_;

    explicit GetNativePropertyNamesRecord(
        TimeSinceStart time,
        ObjectID hostObjectID)
        : Record(time), hostObjectID_(hostObjectID) {}

    RecordType getType() const override {
      return type;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    std::vector<ObjectID> uses() const override {
      return {hostObjectID_};
    }
  };

  /// A GetNativePropertyNamesReturnRecord records what property names were
  /// returned by the GetNativePropertyNames query.
  struct GetNativePropertyNamesReturnRecord final : public Record {
    static constexpr RecordType type{RecordType::GetNativePropertyNamesReturn};

    /// Returned list of property names
    const std::vector<TraceValue> propNameIDs_;

    explicit GetNativePropertyNamesReturnRecord(
        TimeSinceStart time,
        const std::vector<TraceValue> &propNameIDs)
        : Record(time), propNameIDs_(propNameIDs) {}

    RecordType getType() const override {
      return type;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;

    std::vector<ObjectID> uses() const override {
      auto uses = Record::uses();
      for (const auto &val : propNameIDs_) {
        pushIfTrackedValue(val, uses);
      }
      return uses;
    }
  };

  struct SetExternalMemoryPressureRecord final : public Record {
    static constexpr RecordType type{RecordType::SetExternalMemoryPressure};
    /// The ObjectID of the object that was passed to
    /// Runtime::setExternalMemoryPressure() call.
    const ObjectID objID_;
    /// The value passed to Runtime::setExternalMemoryPressure() call.
    const size_t amount_;

    explicit SetExternalMemoryPressureRecord(
        TimeSinceStart time,
        const ObjectID objID,
        const size_t amount)
        : Record(time), objID_(objID), amount_(amount) {}

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      return {objID_};
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// An Utf8Record is an event where a PropNameID or String or Symbol was
  /// converted to utf8.
  struct Utf8Record final : public Record {
    static constexpr RecordType type{RecordType::Utf8};
    /// PropNameID, String or Symbol passed to utf8() or symbolToString() as an
    /// argument
    const TraceValue objID_;
    /// Returned string from utf8() or symbolToString()
    const std::string retVal_;

    explicit Utf8Record(
        TimeSinceStart time,
        const TraceValue objID,
        std::string retval)
        : Record(time), objID_(objID), retVal_(std::move(retval)) {}

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> vec;
      pushIfTrackedValue(objID_, vec);
      return vec;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A Utf16Record is an event where a PropNameID or String was converted to
  /// UTF-16.
  struct Utf16Record final : public Record {
    static constexpr RecordType type{RecordType::Utf16};
    /// PropNameID, String passed to utf16() as an argument
    const TraceValue objID_;
    /// Returned string from utf16().
    const std::u16string retVal_;

    explicit Utf16Record(
        TimeSinceStart time,
        const TraceValue objID,
        std::u16string retval)
        : Record(time), objID_(objID), retVal_(std::move(retval)) {}

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> vec;
      pushIfTrackedValue(objID_, vec);
      return vec;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// A GetStringData is an event where getStringData or getPropNameIdData was
  /// invoked.
  struct GetStringDataRecord final : public Record {
    static constexpr RecordType type{RecordType::GetStringData};
    /// The String or PropNameID passed into getStringData or getPropNameIdData
    const TraceValue objID_;
    /// The string content in the String or PropNameID that was passed into the
    /// callback
    const std::u16string strData_;

    explicit GetStringDataRecord(
        TimeSinceStart time,
        const TraceValue objID,
        std::u16string strData)
        : Record(time), objID_(objID), strData_(std::move(strData)) {}

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> uses() const override {
      std::vector<ObjectID> vec;
      pushIfTrackedValue(objID_, vec);
      return vec;
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  struct GlobalRecord final : public Record {
    static constexpr RecordType type{RecordType::Global};
    const ObjectID objID_; // global's ObjectID returned from Runtime::global().

    explicit GlobalRecord(TimeSinceStart time, ObjectID objID)
        : Record(time), objID_(objID) {}

    RecordType getType() const override {
      return type;
    }

    std::vector<ObjectID> defs() const override {
      return {objID_};
    }

    void toJSONInternal(::hermes::JSONEmitter &json) const override;
  };

  /// Completes writing of the trace to the trace stream.  If writing
  /// to a file, disables further writing to the file, or accumulation
  /// of data.
  void flushAndDisable(const ::hermes::vm::GCExecTrace &gcTrace);
};

} // namespace tracing
} // namespace hermes
} // namespace facebook

#endif // HERMES_SYNTHTRACE_H
