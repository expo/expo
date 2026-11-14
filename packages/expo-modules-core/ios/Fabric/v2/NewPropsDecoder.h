// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include <CoreFoundation/CoreFoundation.h>
#include <jsi/jsi.h>

namespace expo::views {

/**
 The props of a view as its `NewPropsDecoder` decoded them: a retained Objective-C object, such as the
 Swift object that holds the view's props struct. Copying it retains the object and destroying it
 releases the object, so it costs no allocation of its own. The object is immutable: each props update
 makes a new one.
 */
class DecodedProps final {
public:
  DecodedProps() noexcept = default;

  DecodedProps(std::nullptr_t) noexcept {}

  /**
   Takes over a reference that the caller already retained, for example with `__bridge_retained`.
   */
  static DecodedProps adopt(CFTypeRef _Nullable object) noexcept {
    DecodedProps props;
    props.object_ = object;
    return props;
  }

  DecodedProps(const DecodedProps &other) noexcept : object_(other.object_) {
    if (object_ != nullptr) {
      CFRetain(object_);
    }
  }

  DecodedProps(DecodedProps &&other) noexcept : object_(std::exchange(other.object_, nullptr)) {}

  DecodedProps &operator=(DecodedProps other) noexcept {
    std::swap(object_, other.object_);
    return *this;
  }

  ~DecodedProps() {
    if (object_ != nullptr) {
      CFRelease(object_);
    }
  }

  /**
   The object, without a retain. Valid while this `DecodedProps` holds it.
   */
  CFTypeRef _Nullable get() const noexcept {
    return object_;
  }

  explicit operator bool() const noexcept {
    return object_ != nullptr;
  }

  friend bool operator==(const DecodedProps &lhs, const DecodedProps &rhs) noexcept {
    return lhs.object_ == rhs.object_;
  }

  friend bool operator==(const DecodedProps &lhs, std::nullptr_t) noexcept {
    return lhs.object_ == nullptr;
  }

private:
  CFTypeRef _Nullable object_ = nullptr;
};

/**
 Decodes the props of one view type. `NewComponentDescriptor` calls it from `cloneProps`, on the thread
 that commits the props. The arguments are valid only during the call.

 One decoder serves every descriptor of its view type, in every React Native host, and it's called from
 more than one thread: the JavaScript thread for React's props, and the main thread, for example for
 Reanimated's props. So an implementation must be thread-safe.
 */
class NewPropsDecoder {
public:
  virtual ~NewPropsDecoder() = default;

  /**
   Decodes the props object that React sent. `NewComponentDescriptor` calls it before React Native 0.87,
   and `decodeValues` since. It has all props when React creates the view, and only the changed props
   when it updates the view. React sends a removed prop as `null`. Returns the props after applying
   `props` to `previous`, which is `nullptr` before the first decode.
   */
  virtual DecodedProps decode(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &props,
    const DecodedProps &previous
  ) const = 0;

  /**
   The names of the view's props, in the order that `decodeValues` indexes them.
   */
  virtual std::vector<std::string> propNames() const = 0;

  /**
   Decodes the values of the view's props that React sent, each with the index of its name in
   `propNames`. Unlike `decode`, it gets only the view's props, which the caller already picked out of
   the props object. Returns the props after applying `values` to `previous`, which is `nullptr` before
   the first decode.
   */
  virtual DecodedProps decodeValues(
    facebook::jsi::Runtime &runtime,
    const std::vector<std::pair<size_t, facebook::jsi::Value>> &values,
    const DecodedProps &previous
  ) const = 0;

  /**
   Called instead of `decodeValues` (or `decode`) for props that come as `folly::dynamic`, without a
   runtime, for example from Reanimated or React Native's animations. They aren't decoded yet, so the
   decoded props keep their values. `propNames` may have all keys of the update, the base view props too,
   so the decoder reports only the ones it would have decoded.

   After `setNativeProps` is called on a view, React Native merges every later React update of that view
   into `folly::dynamic` too, for as long as the view exists. So until these props are decoded, such a
   view stops getting React's updates of its own props.
   */
  virtual void didSkipProps(const std::vector<std::string_view> &propNames) const = 0;
};

} // namespace expo::views

#endif // __cplusplus
