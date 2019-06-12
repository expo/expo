//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#include "ABI33_0_0JSCRuntime.h"

#include <JavaScriptCore/JavaScript.h>
#include <atomic>
#include <condition_variable>
#include <cstdlib>
#include <mutex>
#include <queue>
#include <sstream>
#include <thread>

namespace facebook {
namespace ABI33_0_0jsc {

namespace detail {
class ArgsConverter;
} // namespace detail

class ABI33_0_0JSCRuntime;

struct Lock {
  void lock(const ABI33_0_0jsc::ABI33_0_0JSCRuntime&) const {}
  void unlock(const ABI33_0_0jsc::ABI33_0_0JSCRuntime&) const {}
};

class ABI33_0_0JSCRuntime : public ABI33_0_0jsi::Runtime {
 public:
  // Creates new context in new context group
  ABI33_0_0JSCRuntime();
  // Retains ctx
  ABI33_0_0JSCRuntime(JSGlobalContextRef ctx);
  ~ABI33_0_0JSCRuntime();

  void evaluateJavaScript(
      std::unique_ptr<const ABI33_0_0jsi::Buffer> buffer,
      const std::string& sourceURL) override;
  ABI33_0_0jsi::Object global() override;

  std::string description() override;

  bool isInspectable() override;

  void setDescription(const std::string& desc);

  // Please don't use the following two functions, only exposed for
  // integration efforts.
  JSGlobalContextRef getContext() {
    return ctx_;
  }

  // JSValueRef->JSValue (needs make.*Value so it must be member function)
  ABI33_0_0jsi::Value createValue(JSValueRef value) const;

  // Value->JSValueRef (similar to above)
  JSValueRef valueRef(const ABI33_0_0jsi::Value& value);

 protected:
  friend class detail::ArgsConverter;
  class ABI33_0_0JSCStringValue final : public PointerValue {
#ifndef NDEBUG
    ABI33_0_0JSCStringValue(JSStringRef str, std::atomic<intptr_t>& counter);
#else
    ABI33_0_0JSCStringValue(JSStringRef str);
#endif
    void invalidate() override;

    JSStringRef str_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class ABI33_0_0JSCRuntime;
  };

  class ABI33_0_0JSCObjectValue final : public PointerValue {
    ABI33_0_0JSCObjectValue(
        JSGlobalContextRef ctx,
        const std::atomic<bool>& ctxInvalid,
        JSObjectRef obj
#ifndef NDEBUG
        ,
        std::atomic<intptr_t>& counter
#endif
                   );

    void invalidate() override;

    JSGlobalContextRef ctx_;
    const std::atomic<bool>& ctxInvalid_;
    JSObjectRef obj_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class ABI33_0_0JSCRuntime;
  };

  PointerValue* cloneString(const Runtime::PointerValue* pv) override;
  PointerValue* cloneObject(const Runtime::PointerValue* pv) override;
  PointerValue* clonePropNameID(const Runtime::PointerValue* pv) override;

  ABI33_0_0jsi::PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override;
  ABI33_0_0jsi::PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override;
  ABI33_0_0jsi::PropNameID createPropNameIDFromString(const ABI33_0_0jsi::String& str) override;
  std::string utf8(const ABI33_0_0jsi::PropNameID&) override;
  bool compare(const ABI33_0_0jsi::PropNameID&, const ABI33_0_0jsi::PropNameID&) override;

  ABI33_0_0jsi::String createStringFromAscii(const char* str, size_t length) override;
  ABI33_0_0jsi::String createStringFromUtf8(const uint8_t* utf8, size_t length) override;
  std::string utf8(const ABI33_0_0jsi::String&) override;

  ABI33_0_0jsi::Object createObject() override;
  ABI33_0_0jsi::Object createObject(std::shared_ptr<ABI33_0_0jsi::HostObject> ho) override;
  virtual std::shared_ptr<ABI33_0_0jsi::HostObject> getHostObject(
      const ABI33_0_0jsi::Object&) override;
  ABI33_0_0jsi::HostFunctionType& getHostFunction(const ABI33_0_0jsi::Function&) override;

  ABI33_0_0jsi::Value getProperty(const ABI33_0_0jsi::Object&, const ABI33_0_0jsi::String& name) override;
  ABI33_0_0jsi::Value getProperty(const ABI33_0_0jsi::Object&, const ABI33_0_0jsi::PropNameID& name)
      override;
  bool hasProperty(const ABI33_0_0jsi::Object&, const ABI33_0_0jsi::String& name) override;
  bool hasProperty(const ABI33_0_0jsi::Object&, const ABI33_0_0jsi::PropNameID& name) override;
  void setPropertyValue(
      ABI33_0_0jsi::Object&,
      const ABI33_0_0jsi::String& name,
      const ABI33_0_0jsi::Value& value) override;
  void setPropertyValue(
      ABI33_0_0jsi::Object&,
      const ABI33_0_0jsi::PropNameID& name,
      const ABI33_0_0jsi::Value& value) override;
  bool isArray(const ABI33_0_0jsi::Object&) const override;
  bool isArrayBuffer(const ABI33_0_0jsi::Object&) const override;
  bool isFunction(const ABI33_0_0jsi::Object&) const override;
  bool isHostObject(const ABI33_0_0jsi::Object&) const override;
  bool isHostFunction(const ABI33_0_0jsi::Function&) const override;
  ABI33_0_0jsi::Array getPropertyNames(const ABI33_0_0jsi::Object&) override;

  ABI33_0_0jsi::WeakObject createWeakObject(const ABI33_0_0jsi::Object&) override;
  ABI33_0_0jsi::Value lockWeakObject(const ABI33_0_0jsi::WeakObject&) override;

  ABI33_0_0jsi::Array createArray(size_t length) override;
  size_t size(const ABI33_0_0jsi::Array&) override;
  size_t size(const ABI33_0_0jsi::ArrayBuffer&) override;
  uint8_t* data(const ABI33_0_0jsi::ArrayBuffer&) override;
  ABI33_0_0jsi::Value getValueAtIndex(const ABI33_0_0jsi::Array&, size_t i) override;
  void setValueAtIndexImpl(ABI33_0_0jsi::Array&, size_t i, const ABI33_0_0jsi::Value& value)
      override;

  ABI33_0_0jsi::Function createFunctionFromHostFunction(
      const ABI33_0_0jsi::PropNameID& name,
      unsigned int paramCount,
      ABI33_0_0jsi::HostFunctionType func) override;
  ABI33_0_0jsi::Value call(
      const ABI33_0_0jsi::Function&,
      const ABI33_0_0jsi::Value& jsThis,
      const ABI33_0_0jsi::Value* args,
      size_t count) override;
  ABI33_0_0jsi::Value callAsConstructor(
      const ABI33_0_0jsi::Function&,
      const ABI33_0_0jsi::Value* args,
      size_t count) override;

  bool strictEquals(const ABI33_0_0jsi::String& a, const ABI33_0_0jsi::String& b) const override;
  bool strictEquals(const ABI33_0_0jsi::Object& a, const ABI33_0_0jsi::Object& b) const override;
  bool instanceOf(const ABI33_0_0jsi::Object& o, const ABI33_0_0jsi::Function& f) override;

 private:
  // Basically convenience casts
  static JSStringRef stringRef(const ABI33_0_0jsi::String& str);
  static JSStringRef stringRef(const ABI33_0_0jsi::PropNameID& sym);
  static JSObjectRef objectRef(const ABI33_0_0jsi::Object& obj);

  // Factory methods for creating String/Object
  ABI33_0_0jsi::String createString(JSStringRef stringRef) const;
  ABI33_0_0jsi::PropNameID createPropNameID(JSStringRef stringRef);
  ABI33_0_0jsi::Object createObject(JSObjectRef objectRef) const;

  // Used by factory methods and clone methods
  ABI33_0_0jsi::Runtime::PointerValue* makeStringValue(JSStringRef str) const;
  ABI33_0_0jsi::Runtime::PointerValue* makeObjectValue(JSObjectRef obj) const;

  void checkException(JSValueRef exc);
  void checkException(JSValueRef res, JSValueRef exc);
  void checkException(JSValueRef exc, const char* msg);
  void checkException(JSValueRef res, JSValueRef exc, const char* msg);

  JSGlobalContextRef ctx_;
  std::atomic<bool> ctxInvalid_;
  std::string desc_;
#ifndef NDEBUG
  mutable std::atomic<intptr_t> objectCounter_;
  mutable std::atomic<intptr_t> stringCounter_;
#endif
};

#ifndef __has_builtin
#define __has_builtin(x) 0
#endif

#if __has_builtin(__builtin_expect) || defined(__GNUC__)
#define ABI33_0_0JSC_LIKELY(ABI33_0_0EXPR) __builtin_expect((bool)(ABI33_0_0EXPR), true)
#define ABI33_0_0JSC_UNLIKELY(ABI33_0_0EXPR) __builtin_expect((bool)(ABI33_0_0EXPR), false)
#else
#define ABI33_0_0JSC_LIKELY(ABI33_0_0EXPR) (ABI33_0_0EXPR)
#define ABI33_0_0JSC_UNLIKELY(ABI33_0_0EXPR) (ABI33_0_0EXPR)
#endif

#define ABI33_0_0JSC_ASSERT(x)          \
  do {                         \
    if (ABI33_0_0JSC_UNLIKELY(!!(x))) { \
      abort();                 \
    }                          \
  } while (0)

#if defined(__IPHONE_OS_VERSION_MIN_REQUIRED)
// This takes care of watch and tvos (due to backwards compatibility in
// Availability.h
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_9_0
#define _ABI33_0_0JSC_FAST_IS_ARRAY
#endif
#endif
#if defined(__MAC_OS_X_VERSION_MIN_REQUIRED)
#if __MAC_OS_X_VERSION_MIN_REQUIRED >= __MAC_10_11
// Only one of these should be set for a build.  If somehow that's not
// true, this will be a compile-time error and it can be resolved when
// we understand why.
#define _ABI33_0_0JSC_FAST_IS_ARRAY
#endif
#endif

// JSStringRef utilities
namespace {
std::string JSStringToSTLString(JSStringRef str) {
  size_t maxBytes = JSStringGetMaximumUTF8CStringSize(str);
  std::vector<char> buffer(maxBytes);
  JSStringGetUTF8CString(str, buffer.data(), maxBytes);
  return std::string(buffer.data());
}

JSStringRef getLengthString() {
  static JSStringRef length = JSStringCreateWithUTF8CString("length");
  return length;
}

JSStringRef getNameString() {
  static JSStringRef name = JSStringCreateWithUTF8CString("name");
  return name;
}

JSStringRef getFunctionString() {
  static JSStringRef func = JSStringCreateWithUTF8CString("Function");
  return func;
}

#if !defined(_ABI33_0_0JSC_FAST_IS_ARRAY)
JSStringRef getArrayString() {
  static JSStringRef array = JSStringCreateWithUTF8CString("Array");
  return array;
}

JSStringRef getIsArrayString() {
  static JSStringRef isArray = JSStringCreateWithUTF8CString("isArray");
  return isArray;
}
#endif
} // namespace

// std::string utility
namespace {
std::string to_string(void* value) {
  std::ostringstream ss;
  ss << value;
  return ss.str();
}
} // namespace

ABI33_0_0JSCRuntime::ABI33_0_0JSCRuntime()
    : ABI33_0_0JSCRuntime(JSGlobalContextCreateInGroup(nullptr, nullptr)) {
  JSGlobalContextRelease(ctx_);
}

ABI33_0_0JSCRuntime::ABI33_0_0JSCRuntime(JSGlobalContextRef ctx)
    : ctx_(JSGlobalContextRetain(ctx)),
      ctxInvalid_(false)
#ifndef NDEBUG
      ,
      objectCounter_(0),
      stringCounter_(0)
#endif
{
}

ABI33_0_0JSCRuntime::~ABI33_0_0JSCRuntime() {
  // On shutting down and cleaning up: when ABI33_0_0JSC is actually torn down,
  // it calls ABI33_0_0JSC::Heap::lastChanceToFinalize internally which
  // finalizes anything left over.  But at this point,
  // JSValueUnprotect() can no longer be called.  We use an
  // atomic<bool> to avoid unsafe unprotects happening after shutdown
  // has started.
  ctxInvalid_ = true;
  JSGlobalContextRelease(ctx_);
#ifndef NDEBUG
  assert(
      objectCounter_ == 0 && "ABI33_0_0JSCRuntime destroyed with a dangling API object");
  assert(
      stringCounter_ == 0 && "ABI33_0_0JSCRuntime destroyed with a dangling API string");
#endif
}

void ABI33_0_0JSCRuntime::evaluateJavaScript(
    std::unique_ptr<const ABI33_0_0jsi::Buffer> buffer,
    const std::string& sourceURL) {
  std::string tmp(
      reinterpret_cast<const char*>(buffer->data()), buffer->size());
  JSStringRef sourceRef = JSStringCreateWithUTF8CString(tmp.c_str());
  JSStringRef sourceURLRef = nullptr;
  if (!sourceURL.empty()) {
    sourceURLRef = JSStringCreateWithUTF8CString(sourceURL.c_str());
  }
  JSValueRef exc = nullptr;
  JSValueRef res =
      JSEvaluateScript(ctx_, sourceRef, nullptr, sourceURLRef, 0, &exc);
  JSStringRelease(sourceRef);
  if (sourceURLRef) {
    JSStringRelease(sourceURLRef);
  }
  checkException(res, exc);
}

ABI33_0_0jsi::Object ABI33_0_0JSCRuntime::global() {
  return createObject(JSContextGetGlobalObject(ctx_));
}

std::string ABI33_0_0JSCRuntime::description() {
  if (desc_.empty()) {
    desc_ = std::string("<ABI33_0_0JSCRuntime@") + to_string(this) + ">";
  }
  return desc_;
}

bool ABI33_0_0JSCRuntime::isInspectable() {
  return false;
}

#ifndef NDEBUG
ABI33_0_0JSCRuntime::ABI33_0_0JSCStringValue::ABI33_0_0JSCStringValue(
    JSStringRef str,
    std::atomic<intptr_t>& counter)
    : str_(JSStringRetain(str)), counter_(counter) {
  // Since std::atomic returns a copy instead of a reference when calling
  // operator+= we must do this explicitly in the constructor
  counter_ += 1;
}
#else
ABI33_0_0JSCRuntime::ABI33_0_0JSCStringValue::ABI33_0_0JSCStringValue(JSStringRef str)
    : str_(JSStringRetain(str)) {
}
#endif

void ABI33_0_0JSCRuntime::ABI33_0_0JSCStringValue::invalidate() {
  // These ABI33_0_0JSC{String,Object}Value objects are implicitly owned by the
  // {String,Object} objects, thus when a String/Object is destructed
  // the ABI33_0_0JSC{String,Object}Value should be released.
#ifndef NDEBUG
  counter_ -= 1;
#endif
  JSStringRelease(str_);
  // Angery reaccs only
  delete this;
}

ABI33_0_0JSCRuntime::ABI33_0_0JSCObjectValue::ABI33_0_0JSCObjectValue(
    JSGlobalContextRef ctx,
    const std::atomic<bool>& ctxInvalid,
    JSObjectRef obj
#ifndef NDEBUG
    ,
    std::atomic<intptr_t>& counter
#endif
    )
    : ctx_(ctx),
      ctxInvalid_(ctxInvalid),
      obj_(obj)
#ifndef NDEBUG
      ,
      counter_(counter)
#endif
{
  JSValueProtect(ctx_, obj_);
#ifndef NDEBUG
  counter_ += 1;
#endif
}

void ABI33_0_0JSCRuntime::ABI33_0_0JSCObjectValue::invalidate() {
#ifndef NDEBUG
  counter_ -= 1;
#endif
  // When shutting down the VM, if there is a HostObject which
  // contains or otherwise owns a ABI33_0_0jsi::Object, then the final GC will
  // finalize the HostObject, leading to a call to invalidate().  But
  // at that point, making calls to JSValueUnprotect will crash.
  // It is up to the application to make sure that any other calls to
  // invalidate() happen before VM destruction; see the comment on
  // ABI33_0_0jsi::Runtime.
  //
  // Another potential concern here is that in the non-shutdown case,
  // if a HostObject is GCd, JSValueUnprotect will be called from the
  // ABI33_0_0JSC finalizer.  The documentation warns against this: "You must
  // not call any function that may cause a garbage collection or an
  // allocation of a garbage collected object from within a
  // JSObjectFinalizeCallback. This includes all functions that have a
  // JSContextRef parameter." However, an audit of the source code for
  // JSValueUnprotect in late 2018 shows that it cannot cause
  // allocation or a GC, and further, this code has not changed in
  // about two years.  In the future, we may choose to reintroduce the
  // mechanism previously used here which uses a separate thread for
  // JSValueUnprotect, in order to conform to the documented API, but
  // use the "unsafe" synchronous version on iOS 11 and earlier.

  if (!ctxInvalid_) {
    JSValueUnprotect(ctx_, obj_);
  }
  delete this;
}

ABI33_0_0jsi::Runtime::PointerValue* ABI33_0_0JSCRuntime::cloneString(
    const ABI33_0_0jsi::Runtime::PointerValue* pv) {
  if (!pv) {
    return nullptr;
  }
  const ABI33_0_0JSCStringValue* string = static_cast<const ABI33_0_0JSCStringValue*>(pv);
  return makeStringValue(string->str_);
}

ABI33_0_0jsi::Runtime::PointerValue* ABI33_0_0JSCRuntime::cloneObject(
    const ABI33_0_0jsi::Runtime::PointerValue* pv) {
  if (!pv) {
    return nullptr;
  }
  const ABI33_0_0JSCObjectValue* object = static_cast<const ABI33_0_0JSCObjectValue*>(pv);
  assert(
      object->ctx_ == ctx_ &&
      "Don't try to clone an object backed by a different Runtime");
  return makeObjectValue(object->obj_);
}

ABI33_0_0jsi::Runtime::PointerValue* ABI33_0_0JSCRuntime::clonePropNameID(
    const ABI33_0_0jsi::Runtime::PointerValue* pv) {
  if (!pv) {
    return nullptr;
  }
  const ABI33_0_0JSCStringValue* string = static_cast<const ABI33_0_0JSCStringValue*>(pv);
  return makeStringValue(string->str_);
}

ABI33_0_0jsi::PropNameID ABI33_0_0JSCRuntime::createPropNameIDFromAscii(
    const char* str,
    size_t length) {
  // For system ABI33_0_0JSC this must is identical to a string
  std::string tmp(str, length);
  JSStringRef strRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto res = createPropNameID(strRef);
  JSStringRelease(strRef);
  return res;
}

ABI33_0_0jsi::PropNameID ABI33_0_0JSCRuntime::createPropNameIDFromUtf8(
    const uint8_t* utf8,
    size_t length) {
  std::string tmp(reinterpret_cast<const char*>(utf8), length);
  JSStringRef strRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto res = createPropNameID(strRef);
  JSStringRelease(strRef);
  return res;
}

ABI33_0_0jsi::PropNameID ABI33_0_0JSCRuntime::createPropNameIDFromString(const ABI33_0_0jsi::String& str) {
  return createPropNameID(stringRef(str));
}

std::string ABI33_0_0JSCRuntime::utf8(const ABI33_0_0jsi::PropNameID& sym) {
  return JSStringToSTLString(stringRef(sym));
}

bool ABI33_0_0JSCRuntime::compare(const ABI33_0_0jsi::PropNameID& a, const ABI33_0_0jsi::PropNameID& b) {
  return JSStringIsEqual(stringRef(a), stringRef(b));
}

ABI33_0_0jsi::String ABI33_0_0JSCRuntime::createStringFromAscii(const char* str, size_t length) {
  // Yes we end up double casting for semantic reasons (UTF8 contains ASCII,
  // not the other way around)
  return this->createStringFromUtf8(
      reinterpret_cast<const uint8_t*>(str), length);
}

ABI33_0_0jsi::String ABI33_0_0JSCRuntime::createStringFromUtf8(
    const uint8_t* str,
    size_t length) {
  std::string tmp(reinterpret_cast<const char*>(str), length);
  JSStringRef stringRef = JSStringCreateWithUTF8CString(tmp.c_str());
  return createString(stringRef);
}

std::string ABI33_0_0JSCRuntime::utf8(const ABI33_0_0jsi::String& str) {
  return JSStringToSTLString(stringRef(str));
}

ABI33_0_0jsi::Object ABI33_0_0JSCRuntime::createObject() {
  return createObject(static_cast<JSObjectRef>(nullptr));
}

// HostObject details
namespace detail {
struct HostObjectProxyBase {
  HostObjectProxyBase(
      ABI33_0_0JSCRuntime& rt,
      const std::shared_ptr<ABI33_0_0jsi::HostObject>& sho)
      : runtime(rt), hostObject(sho) {}

  ABI33_0_0JSCRuntime& runtime;
  std::shared_ptr<ABI33_0_0jsi::HostObject> hostObject;
};
} // namespace detail

namespace {
std::once_flag hostObjectClassOnceFlag;
JSClassRef hostObjectClass{};
} // namespace

ABI33_0_0jsi::Object ABI33_0_0JSCRuntime::createObject(std::shared_ptr<ABI33_0_0jsi::HostObject> ho) {
  struct HostObjectProxy : public detail::HostObjectProxyBase {
    static JSValueRef getProperty(
        JSContextRef ctx,
        JSObjectRef object,
        JSStringRef propertyName,
        JSValueRef* exception) {
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      ABI33_0_0jsi::PropNameID sym = rt.createPropNameID(propertyName);
      ABI33_0_0jsi::Value ret;
      try {
        ret = proxy->hostObject->get(rt, sym);
      } catch (const ABI33_0_0jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        return JSValueMakeUndefined(ctx);
      } catch (const std::exception& ex) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::get: ") + ex.what());
        *exception = rt.valueRef(excValue);
        return JSValueMakeUndefined(ctx);
      } catch (...) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(rt, "Exception in HostObject::get: <unknown>");
        *exception = rt.valueRef(excValue);
        return JSValueMakeUndefined(ctx);
      }
      return rt.valueRef(ret);
    }
    
    #define ABI33_0_0JSC_UNUSED(x) (void) (x);

    static bool setProperty(
        JSContextRef ctx,
        JSObjectRef object,
        JSStringRef propName,
        JSValueRef value,
        JSValueRef* exception) {
      ABI33_0_0JSC_UNUSED(ctx);
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      ABI33_0_0jsi::PropNameID sym = rt.createPropNameID(propName);
      try {
        proxy->hostObject->set(rt, sym, rt.createValue(value));
      } catch (const ABI33_0_0jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        return false;
      } catch (const std::exception& ex) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::set: ") + ex.what());
        *exception = rt.valueRef(excValue);
        return false;
      } catch (...) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(rt, "Exception in HostObject::set: <unknown>");
        *exception = rt.valueRef(excValue);
        return false;
      }
      return true;
    }

    // ABI33_0_0JSC does not provide means to communicate errors from this callback,
    // so the error handling strategy is very brutal - we'll just crash
    // due to noexcept.
    static void getPropertyNames(
        JSContextRef ctx,
        JSObjectRef object,
        JSPropertyNameAccumulatorRef propertyNames) noexcept {
      ABI33_0_0JSC_UNUSED(ctx);
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      auto names = proxy->hostObject->getPropertyNames(rt);
      for (auto& name : names) {
        JSPropertyNameAccumulatorAddName(propertyNames, stringRef(name));
      }
    }
    
    #undef ABI33_0_0JSC_UNUSED

    static void finalize(JSObjectRef obj) {
      auto hostObject = static_cast<HostObjectProxy*>(JSObjectGetPrivate(obj));
      JSObjectSetPrivate(obj, nullptr);
      delete hostObject;
    }

    using HostObjectProxyBase::HostObjectProxyBase;
  };

  std::call_once(hostObjectClassOnceFlag, []() {
    JSClassDefinition hostObjectClassDef = kJSClassDefinitionEmpty;
    hostObjectClassDef.version = 0;
    hostObjectClassDef.attributes = kJSClassAttributeNoAutomaticPrototype;
    hostObjectClassDef.finalize = HostObjectProxy::finalize;
    hostObjectClassDef.getProperty = HostObjectProxy::getProperty;
    hostObjectClassDef.setProperty = HostObjectProxy::setProperty;
    hostObjectClassDef.getPropertyNames = HostObjectProxy::getPropertyNames;
    hostObjectClass = JSClassCreate(&hostObjectClassDef);
  });

  JSObjectRef obj =
      JSObjectMake(ctx_, hostObjectClass, new HostObjectProxy(*this, ho));
  return createObject(obj);
}

std::shared_ptr<ABI33_0_0jsi::HostObject> ABI33_0_0JSCRuntime::getHostObject(
    const ABI33_0_0jsi::Object& obj) {
  // We are guarenteed at this point to have isHostObject(obj) == true
  // so the private data should be HostObjectMetadata
  JSObjectRef object = objectRef(obj);
  auto metadata =
      static_cast<detail::HostObjectProxyBase*>(JSObjectGetPrivate(object));
  assert(metadata);
  return metadata->hostObject;
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::getProperty(
    const ABI33_0_0jsi::Object& obj,
    const ABI33_0_0jsi::String& name) {
  JSObjectRef objRef = objectRef(obj);
  JSValueRef exc = nullptr;
  JSValueRef res = JSObjectGetProperty(ctx_, objRef, stringRef(name), &exc);
  checkException(exc);
  return createValue(res);
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::getProperty(
    const ABI33_0_0jsi::Object& obj,
    const ABI33_0_0jsi::PropNameID& name) {
  JSObjectRef objRef = objectRef(obj);
  JSValueRef exc = nullptr;
  JSValueRef res = JSObjectGetProperty(ctx_, objRef, stringRef(name), &exc);
  checkException(exc);
  return createValue(res);
}

bool ABI33_0_0JSCRuntime::hasProperty(const ABI33_0_0jsi::Object& obj, const ABI33_0_0jsi::String& name) {
  JSObjectRef objRef = objectRef(obj);
  return JSObjectHasProperty(ctx_, objRef, stringRef(name));
}

bool ABI33_0_0JSCRuntime::hasProperty(
    const ABI33_0_0jsi::Object& obj,
    const ABI33_0_0jsi::PropNameID& name) {
  JSObjectRef objRef = objectRef(obj);
  return JSObjectHasProperty(ctx_, objRef, stringRef(name));
}

void ABI33_0_0JSCRuntime::setPropertyValue(
    ABI33_0_0jsi::Object& object,
    const ABI33_0_0jsi::PropNameID& name,
    const ABI33_0_0jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetProperty(
      ctx_,
      objectRef(object),
      stringRef(name),
      valueRef(value),
      kJSPropertyAttributeNone,
      &exc);
  checkException(exc);
}

void ABI33_0_0JSCRuntime::setPropertyValue(
    ABI33_0_0jsi::Object& object,
    const ABI33_0_0jsi::String& name,
    const ABI33_0_0jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetProperty(
      ctx_,
      objectRef(object),
      stringRef(name),
      valueRef(value),
      kJSPropertyAttributeNone,
      &exc);
  checkException(exc);
}

bool ABI33_0_0JSCRuntime::isArray(const ABI33_0_0jsi::Object& obj) const {
#if !defined(_ABI33_0_0JSC_FAST_IS_ARRAY)
  JSObjectRef global = JSContextGetGlobalObject(ctx_);
  JSStringRef arrayString = getArrayString();
  JSValueRef exc = nullptr;
  JSValueRef arrayCtorValue =
      JSObjectGetProperty(ctx_, global, arrayString, &exc);
  ABI33_0_0JSC_ASSERT(exc);
  JSObjectRef arrayCtor = JSValueToObject(ctx_, arrayCtorValue, &exc);
  ABI33_0_0JSC_ASSERT(exc);
  JSStringRef isArrayString = getIsArrayString();
  JSValueRef isArrayValue =
      JSObjectGetProperty(ctx_, arrayCtor, isArrayString, &exc);
  ABI33_0_0JSC_ASSERT(exc);
  JSObjectRef isArray = JSValueToObject(ctx_, isArrayValue, &exc);
  ABI33_0_0JSC_ASSERT(exc);
  JSValueRef arg = objectRef(obj);
  JSValueRef result =
      JSObjectCallAsFunction(ctx_, isArray, nullptr, 1, &arg, &exc);
  ABI33_0_0JSC_ASSERT(exc);
  return JSValueToBoolean(ctx_, result);
#else
  return JSValueIsArray(ctx_, objectRef(obj));
#endif
}

bool ABI33_0_0JSCRuntime::isArrayBuffer(const ABI33_0_0jsi::Object& /*obj*/) const {
  // TODO: T23270523 - This would fail on builds that use our custom ABI33_0_0JSC
  // auto typedArrayType = JSValueGetTypedArrayType(ctx_, objectRef(obj),
  // nullptr);  return typedArrayType == kJSTypedArrayTypeArrayBuffer;
  throw std::runtime_error("Unsupported");
}

uint8_t* ABI33_0_0JSCRuntime::data(const ABI33_0_0jsi::ArrayBuffer& /*obj*/) {
  // TODO: T23270523 - This would fail on builds that use our custom ABI33_0_0JSC
  // return static_cast<uint8_t*>(
  //    JSObjectGetArrayBufferBytesPtr(ctx_, objectRef(obj), nullptr));
  throw std::runtime_error("Unsupported");
}

size_t ABI33_0_0JSCRuntime::size(const ABI33_0_0jsi::ArrayBuffer& /*obj*/) {
  // TODO: T23270523 - This would fail on builds that use our custom ABI33_0_0JSC
  // return JSObjectGetArrayBufferByteLength(ctx_, objectRef(obj), nullptr);
  throw std::runtime_error("Unsupported");
}

bool ABI33_0_0JSCRuntime::isFunction(const ABI33_0_0jsi::Object& obj) const {
  return JSObjectIsFunction(ctx_, objectRef(obj));
}

bool ABI33_0_0JSCRuntime::isHostObject(const ABI33_0_0jsi::Object& obj) const {
  auto cls = hostObjectClass;
  return cls != nullptr && JSValueIsObjectOfClass(ctx_, objectRef(obj), cls);
}

// Very expensive
ABI33_0_0jsi::Array ABI33_0_0JSCRuntime::getPropertyNames(const ABI33_0_0jsi::Object& obj) {
  JSPropertyNameArrayRef names =
      JSObjectCopyPropertyNames(ctx_, objectRef(obj));
  size_t len = JSPropertyNameArrayGetCount(names);
  // Would be better if we could create an array with explicit elements
  auto result = createArray(len);
  for (size_t i = 0; i < len; i++) {
    JSStringRef str = JSPropertyNameArrayGetNameAtIndex(names, i);
    result.setValueAtIndex(*this, i, createString(str));
  }
  JSPropertyNameArrayRelease(names);
  return result;
}

ABI33_0_0jsi::WeakObject ABI33_0_0JSCRuntime::createWeakObject(const ABI33_0_0jsi::Object&) {
  throw std::logic_error("Not implemented");
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::lockWeakObject(const ABI33_0_0jsi::WeakObject&) {
  throw std::logic_error("Not implemented");
}

ABI33_0_0jsi::Array ABI33_0_0JSCRuntime::createArray(size_t length) {
  JSValueRef exc = nullptr;
  JSObjectRef obj = JSObjectMakeArray(ctx_, 0, nullptr, &exc);
  checkException(obj, exc);
  JSObjectSetProperty(
      ctx_,
      obj,
      getLengthString(),
      JSValueMakeNumber(ctx_, static_cast<double>(length)),
      0,
      &exc);
  checkException(exc);
  return createObject(obj).getArray(*this);
}

size_t ABI33_0_0JSCRuntime::size(const ABI33_0_0jsi::Array& arr) {
  return static_cast<size_t>(
      getProperty(arr, createPropNameID(getLengthString())).getNumber());
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::getValueAtIndex(const ABI33_0_0jsi::Array& arr, size_t i) {
  JSValueRef exc = nullptr;
  auto res = JSObjectGetPropertyAtIndex(ctx_, objectRef(arr), (int)i, &exc);
  checkException(exc);
  return createValue(res);
}

void ABI33_0_0JSCRuntime::setValueAtIndexImpl(
    ABI33_0_0jsi::Array& arr,
    size_t i,
    const ABI33_0_0jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetPropertyAtIndex(ctx_, objectRef(arr), (int)i, valueRef(value), &exc);
  checkException(exc);
}

namespace {
std::once_flag hostFunctionClassOnceFlag;
JSClassRef hostFunctionClass{};

class HostFunctionProxy {
 public:
  HostFunctionProxy(ABI33_0_0jsi::HostFunctionType hostFunction)
      : hostFunction_(hostFunction) {}

  ABI33_0_0jsi::HostFunctionType& getHostFunction() {
    return hostFunction_;
  }

 protected:
  ABI33_0_0jsi::HostFunctionType hostFunction_;
};
} // namespace

ABI33_0_0jsi::Function ABI33_0_0JSCRuntime::createFunctionFromHostFunction(
    const ABI33_0_0jsi::PropNameID& name,
    unsigned int paramCount,
    ABI33_0_0jsi::HostFunctionType func) {
  class HostFunctionMetadata : public HostFunctionProxy {
   public:
    static void initialize(JSContextRef ctx, JSObjectRef object) {
      // We need to set up the prototype chain properly here. In theory we
      // could set func.prototype.prototype = Function.prototype to get the
      // same result. Not sure which approach is better.
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(object));

      JSValueRef exc = nullptr;
      JSObjectSetProperty(
          ctx,
          object,
          getLengthString(),
          JSValueMakeNumber(ctx, metadata->argCount),
          kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
              kJSPropertyAttributeDontDelete,
          &exc);
      if (exc) {
        // Silently fail to set length
        exc = nullptr;
      }

      JSStringRef name = nullptr;
      std::swap(metadata->name, name);
      JSObjectSetProperty(
          ctx,
          object,
          getNameString(),
          JSValueMakeString(ctx, name),
          kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
              kJSPropertyAttributeDontDelete,
          &exc);
      JSStringRelease(name);
      if (exc) {
        // Silently fail to set name
        exc = nullptr;
      }

      JSObjectRef global = JSContextGetGlobalObject(ctx);
      JSValueRef value =
          JSObjectGetProperty(ctx, global, getFunctionString(), &exc);
      // If we don't have Function then something bad is going on.
      if (ABI33_0_0JSC_UNLIKELY(exc)) {
        abort();
      }
      JSObjectRef funcCtor = JSValueToObject(ctx, value, &exc);
      if (!funcCtor) {
        // We can't do anything if Function is not an object
        return;
      }
      JSValueRef funcProto = JSObjectGetPrototype(ctx, funcCtor);
      JSObjectSetPrototype(ctx, object, funcProto);
    }

    static JSValueRef makeError(ABI33_0_0JSCRuntime& rt, const std::string& desc) {
      ABI33_0_0jsi::Value value =
          rt.global().getPropertyAsFunction(rt, "Error").call(rt, desc);
      return rt.valueRef(value);
    }

    static JSValueRef call(
        JSContextRef ctx,
        JSObjectRef function,
        JSObjectRef thisObject,
        size_t argumentCount,
        const JSValueRef arguments[],
        JSValueRef* exception) {
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(function));
      ABI33_0_0JSCRuntime& rt = *(metadata->runtime);
      const unsigned maxStackArgCount = 8;
      ABI33_0_0jsi::Value stackArgs[maxStackArgCount];
      std::unique_ptr<ABI33_0_0jsi::Value[]> heapArgs;
      ABI33_0_0jsi::Value* args;
      if (argumentCount > maxStackArgCount) {
        heapArgs = std::make_unique<ABI33_0_0jsi::Value[]>(argumentCount);
        for (size_t i = 0; i < argumentCount; i++) {
          heapArgs[i] = rt.createValue(arguments[i]);
        }
        args = heapArgs.get();
      } else {
        for (size_t i = 0; i < argumentCount; i++) {
          stackArgs[i] = rt.createValue(arguments[i]);
        }
        args = stackArgs;
      }
      JSValueRef res;
      ABI33_0_0jsi::Value thisVal(rt.createObject(thisObject));
      try {
        res = rt.valueRef(
            metadata->hostFunction_(rt, thisVal, args, argumentCount));
      } catch (const ABI33_0_0jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        res = JSValueMakeUndefined(ctx);
      } catch (const std::exception& ex) {
        std::string exceptionString("Exception in HostFunction: ");
        exceptionString += ex.what();
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      } catch (...) {
        std::string exceptionString("Exception in HostFunction: <unknown>");
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      }
      return res;
    }

    static void finalize(JSObjectRef object) {
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(object));
      JSObjectSetPrivate(object, nullptr);
      delete metadata;
    }

    HostFunctionMetadata(
        ABI33_0_0JSCRuntime* rt,
        ABI33_0_0jsi::HostFunctionType hf,
        unsigned ac,
        JSStringRef n)
        : HostFunctionProxy(hf),
          runtime(rt),
          argCount(ac),
          name(JSStringRetain(n)) {}

    ABI33_0_0JSCRuntime* runtime;
    unsigned argCount;
    JSStringRef name;
  };

  std::call_once(hostFunctionClassOnceFlag, []() {
    JSClassDefinition functionClass = kJSClassDefinitionEmpty;
    functionClass.version = 0;
    functionClass.attributes = kJSClassAttributeNoAutomaticPrototype;
    functionClass.initialize = HostFunctionMetadata::initialize;
    functionClass.finalize = HostFunctionMetadata::finalize;
    functionClass.callAsFunction = HostFunctionMetadata::call;

    hostFunctionClass = JSClassCreate(&functionClass);
  });

  JSObjectRef funcRef = JSObjectMake(
      ctx_,
      hostFunctionClass,
      new HostFunctionMetadata(this, func, paramCount, stringRef(name)));
  return createObject(funcRef).getFunction(*this);
}

namespace detail {

class ArgsConverter {
 public:
  ArgsConverter(ABI33_0_0JSCRuntime& rt, const ABI33_0_0jsi::Value* args, size_t count) {
    JSValueRef* destination = inline_;
    if (count > maxStackArgs) {
      outOfLine_ = std::make_unique<JSValueRef[]>(count);
      destination = outOfLine_.get();
    }

    for (size_t i = 0; i < count; ++i) {
      destination[i] = rt.valueRef(args[i]);
    }
  }

  operator JSValueRef*() {
    return outOfLine_ ? outOfLine_.get() : inline_;
  }

 private:
  constexpr static unsigned maxStackArgs = 8;
  JSValueRef inline_[maxStackArgs];
  std::unique_ptr<JSValueRef[]> outOfLine_;
};
} // namespace detail

bool ABI33_0_0JSCRuntime::isHostFunction(const ABI33_0_0jsi::Function& obj) const {
  auto cls = hostFunctionClass;
  return cls != nullptr && JSValueIsObjectOfClass(ctx_, objectRef(obj), cls);
}

ABI33_0_0jsi::HostFunctionType& ABI33_0_0JSCRuntime::getHostFunction(const ABI33_0_0jsi::Function& obj) {
  // We know that isHostFunction(obj) is true here, so its safe to proceed
  auto proxy =
      static_cast<HostFunctionProxy*>(JSObjectGetPrivate(objectRef(obj)));
  return proxy->getHostFunction();
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::call(
    const ABI33_0_0jsi::Function& f,
    const ABI33_0_0jsi::Value& jsThis,
    const ABI33_0_0jsi::Value* args,
    size_t count) {
  JSValueRef exc = nullptr;
  auto res = JSObjectCallAsFunction(
      ctx_,
      objectRef(f),
      jsThis.isUndefined() ? nullptr : objectRef(jsThis.getObject(*this)),
      count,
      detail::ArgsConverter(*this, args, count),
      &exc);
  checkException(exc);
  return createValue(res);
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::callAsConstructor(
    const ABI33_0_0jsi::Function& f,
    const ABI33_0_0jsi::Value* args,
    size_t count) {
  JSValueRef exc = nullptr;
  auto res = JSObjectCallAsConstructor(
      ctx_,
      objectRef(f),
      count,
      detail::ArgsConverter(*this, args, count),
      &exc);
  checkException(exc);
  return createValue(res);
}

bool ABI33_0_0JSCRuntime::strictEquals(const ABI33_0_0jsi::String& a, const ABI33_0_0jsi::String& b)
    const {
  return JSStringIsEqual(stringRef(a), stringRef(b));
}

bool ABI33_0_0JSCRuntime::strictEquals(const ABI33_0_0jsi::Object& a, const ABI33_0_0jsi::Object& b)
    const {
  return objectRef(a) == objectRef(b);
}

bool ABI33_0_0JSCRuntime::instanceOf(const ABI33_0_0jsi::Object& o, const ABI33_0_0jsi::Function& f) {
  JSValueRef exc = nullptr;
  bool res =
      JSValueIsInstanceOfConstructor(ctx_, objectRef(o), objectRef(f), &exc);
  checkException(exc);
  return res;
}

namespace {
JSStringRef getEmptyString() {
  static JSStringRef empty = JSStringCreateWithUTF8CString("");
  return empty;
}
} // namespace

ABI33_0_0jsi::Runtime::PointerValue* ABI33_0_0JSCRuntime::makeStringValue(
    JSStringRef stringRef) const {
  if (!stringRef) {
    stringRef = getEmptyString();
  }
#ifndef NDEBUG
  return new ABI33_0_0JSCStringValue(stringRef, stringCounter_);
#else
  return new ABI33_0_0JSCStringValue(stringRef);
#endif
}

ABI33_0_0jsi::String ABI33_0_0JSCRuntime::createString(JSStringRef str) const {
  return make<ABI33_0_0jsi::String>(makeStringValue(str));
}

ABI33_0_0jsi::PropNameID ABI33_0_0JSCRuntime::createPropNameID(JSStringRef str) {
  return make<ABI33_0_0jsi::PropNameID>(makeStringValue(str));
}

ABI33_0_0jsi::Runtime::PointerValue* ABI33_0_0JSCRuntime::makeObjectValue(
    JSObjectRef objectRef) const {
  if (!objectRef) {
    objectRef = JSObjectMake(ctx_, nullptr, nullptr);
  }
#ifndef NDEBUG
  return new ABI33_0_0JSCObjectValue(ctx_, ctxInvalid_, objectRef, objectCounter_);
#else
  return new ABI33_0_0JSCObjectValue(ctx_, ctxInvalid_, objectRef);
#endif
}

ABI33_0_0jsi::Object ABI33_0_0JSCRuntime::createObject(JSObjectRef obj) const {
  return make<ABI33_0_0jsi::Object>(makeObjectValue(obj));
}

ABI33_0_0jsi::Value ABI33_0_0JSCRuntime::createValue(JSValueRef value) const {
  if (JSValueIsNumber(ctx_, value)) {
    return ABI33_0_0jsi::Value(JSValueToNumber(ctx_, value, nullptr));
  } else if (JSValueIsBoolean(ctx_, value)) {
    return ABI33_0_0jsi::Value(JSValueToBoolean(ctx_, value));
  } else if (JSValueIsNull(ctx_, value)) {
    return ABI33_0_0jsi::Value(nullptr);
  } else if (JSValueIsUndefined(ctx_, value)) {
    return ABI33_0_0jsi::Value();
  } else if (JSValueIsString(ctx_, value)) {
    JSStringRef str = JSValueToStringCopy(ctx_, value, nullptr);
    auto result = ABI33_0_0jsi::Value(createString(str));
    JSStringRelease(str);
    return result;
  } else if (JSValueIsObject(ctx_, value)) {
    JSObjectRef objRef = JSValueToObject(ctx_, value, nullptr);
    return ABI33_0_0jsi::Value(createObject(objRef));
  } else {
    // WHAT ARE YOU
    abort();
  }
}

JSValueRef ABI33_0_0JSCRuntime::valueRef(const ABI33_0_0jsi::Value& value) {
  // I would rather switch on value.kind_
  if (value.isUndefined()) {
    return JSValueMakeUndefined(ctx_);
  } else if (value.isNull()) {
    return JSValueMakeNull(ctx_);
  } else if (value.isBool()) {
    return JSValueMakeBoolean(ctx_, value.getBool());
  } else if (value.isNumber()) {
    return JSValueMakeNumber(ctx_, value.getNumber());
  } else if (value.isString()) {
    return JSValueMakeString(ctx_, stringRef(value.getString(*this)));
  } else if (value.isObject()) {
    return objectRef(value.getObject(*this));
  } else {
    // What are you?
    abort();
  }
}

JSStringRef ABI33_0_0JSCRuntime::stringRef(const ABI33_0_0jsi::String& str) {
  return static_cast<const ABI33_0_0JSCStringValue*>(getPointerValue(str))->str_;
}

JSStringRef ABI33_0_0JSCRuntime::stringRef(const ABI33_0_0jsi::PropNameID& sym) {
  return static_cast<const ABI33_0_0JSCStringValue*>(getPointerValue(sym))->str_;
}

JSObjectRef ABI33_0_0JSCRuntime::objectRef(const ABI33_0_0jsi::Object& obj) {
  return static_cast<const ABI33_0_0JSCObjectValue*>(getPointerValue(obj))->obj_;
}

void ABI33_0_0JSCRuntime::checkException(JSValueRef exc) {
  if (ABI33_0_0JSC_UNLIKELY(exc)) {
    throw ABI33_0_0jsi::JSError(*this, createValue(exc));
  }
}

void ABI33_0_0JSCRuntime::checkException(JSValueRef res, JSValueRef exc) {
  if (ABI33_0_0JSC_UNLIKELY(!res)) {
    throw ABI33_0_0jsi::JSError(*this, createValue(exc));
  }
}

void ABI33_0_0JSCRuntime::checkException(JSValueRef exc, const char* msg) {
  if (ABI33_0_0JSC_UNLIKELY(exc)) {
    throw ABI33_0_0jsi::JSError(std::string(msg), *this, createValue(exc));
  }
}

void ABI33_0_0JSCRuntime::checkException(
    JSValueRef res,
    JSValueRef exc,
    const char* msg) {
  if (ABI33_0_0JSC_UNLIKELY(!res)) {
    throw ABI33_0_0jsi::JSError(std::string(msg), *this, createValue(exc));
  }
}

std::unique_ptr<ABI33_0_0jsi::Runtime> makeABI33_0_0JSCRuntime() {
  return std::make_unique<ABI33_0_0JSCRuntime>();
}

} // namespace ABI33_0_0jsc
} // namespace facebook
