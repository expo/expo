/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_PUBLIC_CTORCONFIG_H
#define HERMES_PUBLIC_CTORCONFIG_H

#include <utility>

/// Defines a new class, called \p NAME representing a constructor config, and
/// an associated builder class.
///
/// The fields of the class (along with their types and default values) are
/// encoded in the \p FIELDS parameter, and any logic to be run whilst building
/// the config can be passed as a code block in \p BUILD_BODY.
///
/// Example:
///
///   Suppose we wish to define a configuration class called Foo, with the
///   following fields and default values:
///
///       int A = 0;
///       int B = 42;
///       std::string C = "hello";
///
///   Such that the value in A is at most the length of \c C.
///
///   We can do so with the following declaration:
///
///   "    #define FIELDS(F)                     \  "
///   "      F(int, A)                           \  "
///   "      F(int, B, 42)                       \  "
///   "      F(std::string, C, "hello")             "
///   "                                             "
///   "    _HERMES_CTORCONFIG_STRUCT(Foo, FIELDS, { "
///   "        A_ = std::min(A_, C_.length());      "
///   "      });                                    "
///
///   N.B.
///     - The definition of A does not mention any value -- meaning it is
///       default initialised.
///     - References to the fields in the validation logic have a trailling
///       underscore.
///
#define _HERMES_CTORCONFIG_STRUCT(NAME, FIELDS, BUILD_BODY)             \
  class NAME {                                                          \
    FIELDS(_HERMES_CTORCONFIG_FIELD_DECL)                               \
                                                                        \
   public:                                                              \
    class Builder;                                                      \
    friend Builder;                                                     \
    FIELDS(_HERMES_CTORCONFIG_GETTER)                                   \
                                                                        \
    /* returns a Builder that starts with the current config. */        \
    inline Builder rebuild() const;                                     \
                                                                        \
   private:                                                             \
    inline void doBuild(const Builder &builder);                        \
  };                                                                    \
                                                                        \
  class NAME::Builder {                                                 \
    NAME config_;                                                       \
                                                                        \
    FIELDS(_HERMES_CTORCONFIG_FIELD_EXPLICIT_BOOL_DECL)                 \
                                                                        \
   public:                                                              \
    Builder() = default;                                                \
                                                                        \
    explicit Builder(const NAME &config) : config_(config) {}           \
                                                                        \
    inline const NAME build() {                                         \
      config_.doBuild(*this);                                           \
      return config_;                                                   \
    }                                                                   \
                                                                        \
    /* The explicitly set fields of \p newconfig update                 \
     * the corresponding fields of \p this. */                          \
    inline Builder update(const NAME::Builder &newConfig);              \
                                                                        \
    FIELDS(_HERMES_CTORCONFIG_SETTER)                                   \
    FIELDS(_HERMES_CTORCONFIG_FIELD_EXPLICIT_BOOL_ACCESSOR)             \
  };                                                                    \
                                                                        \
  NAME::Builder NAME::rebuild() const {                                 \
    return Builder(*this);                                              \
  }                                                                     \
                                                                        \
  NAME::Builder NAME::Builder::update(const NAME::Builder &newConfig) { \
    FIELDS(_HERMES_CTORCONFIG_UPDATE)                                   \
    return *this;                                                       \
  }                                                                     \
                                                                        \
  void NAME::doBuild(const NAME::Builder &builder) {                    \
    (void)builder;                                                      \
    BUILD_BODY                                                          \
  }

/// Helper Macros

#define _HERMES_CTORCONFIG_FIELD_DECL(CX, TYPE, NAME, ...) \
  TYPE NAME##_{__VA_ARGS__};

/// This ignores the first and trailing arguments, and defines a member
/// indicating whether field NAME was set explicitly.
#define _HERMES_CTORCONFIG_FIELD_EXPLICIT_BOOL_DECL(CX, TYPE, NAME, ...) \
  bool NAME##Explicit_{false};

/// This defines an accessor for the "Explicit_" fields defined above.
#define _HERMES_CTORCONFIG_FIELD_EXPLICIT_BOOL_ACCESSOR(CX, TYPE, NAME, ...) \
  bool has##NAME() const {                                                   \
    return NAME##Explicit_;                                                  \
  }

/// Placeholder token for fields whose defaults are not constexpr, to make the
/// listings more readable.
#define HERMES_NON_CONSTEXPR

#define _HERMES_CTORCONFIG_GETTER(CX, TYPE, NAME, ...) \
  inline TYPE get##NAME() const {                      \
    return NAME##_;                                    \
  }                                                    \
  static CX TYPE getDefault##NAME() {                  \
    /* Instead of parens around TYPE (non-standard) */ \
    using TypeAsSingleToken = TYPE;                    \
    return TypeAsSingleToken{__VA_ARGS__};             \
  }

#define _HERMES_CTORCONFIG_SETTER(CX, TYPE, NAME, ...)   \
  inline auto with##NAME(TYPE NAME) -> decltype(*this) { \
    config_.NAME##_ = std::move(NAME);                   \
    NAME##Explicit_ = true;                              \
    return *this;                                        \
  }

#define _HERMES_CTORCONFIG_BUILDER_GETTER(CX, TYPE, NAME, ...) \
  TYPE get##NAME() const {                                     \
    return config_.NAME##_;                                    \
  }

#define _HERMES_CTORCONFIG_UPDATE(CX, TYPE, NAME, ...) \
  if (newConfig.has##NAME()) {                         \
    with##NAME(newConfig.config_.get##NAME());         \
  }

#endif //  HERMES_PUBLIC_CTORCONFIG_H
