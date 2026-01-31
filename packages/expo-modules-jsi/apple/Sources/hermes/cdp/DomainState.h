/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_DOMAINSTATE_H
#define HERMES_CDP_DOMAINSTATE_H

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#if defined(__clang__) && (!defined(SWIG)) && defined(_LIBCPP_VERSION) && \
    defined(_LIBCPP_ENABLE_THREAD_SAFETY_ANNOTATIONS)
#include <hermes/ThreadSafetyAnalysis.h>
#else
#ifndef TSA_GUARDED_BY
#define TSA_GUARDED_BY(x)
#endif
#ifndef TSA_REQUIRES
#define TSA_REQUIRES(x)
#endif
#endif

namespace facebook {
namespace hermes {
namespace cdp {

/// Base class for data to be stored in DomainState.
struct StateValue {
 public:
  virtual ~StateValue() = default;
  virtual std::unique_ptr<StateValue> copy() const = 0;
};

/// StateValue that can be used as a boolean flag.
struct BooleanStateValue : public StateValue {
  ~BooleanStateValue() override = default;
  std::unique_ptr<StateValue> copy() const override;

  bool value{false};
};

/// StateValue that can be used as a dictionary. Used as the main storage value
/// of DomainState so that modifications can be based on keys of the dictionary
/// hierarchy.
struct DictionaryStateValue : public StateValue {
  ~DictionaryStateValue() override = default;
  std::unique_ptr<StateValue> copy() const override;

  std::unordered_map<std::string, std::unique_ptr<StateValue>> values;
};

using StateModification =
    std::pair<std::vector<std::string>, std::unique_ptr<StateValue>>;

/// This class acts as container for saving state that CDP agents need after a
/// reload. Its main purpose is to synchronize the manipulation of state on the
/// runtime thread and when CDPAgent::getState() gets called on arbitrary
/// thread. Functions in this class specifically do not contain callbacks to
/// ensure the mutex locking usage remain simple with no reentrancy to think
/// about.
class DomainState {
 public:
  DomainState();
  explicit DomainState(std::unique_ptr<DictionaryStateValue> dict);

  /// TSA doesn't get applied to constructors, so delete the normal mechanism.
  /// There is a separate copy() function instead.
  DomainState(const DomainState &) = delete;
  DomainState &operator=(const DomainState &) = delete;

  /// Deep copy of the data and make a new instance. Used by
  /// CDPAgent::getState() to get the state in a thread-safe manner.
  std::unique_ptr<DomainState> copy();

  /// This function allows the caller to access values in the saved state. This
  /// obtains a copy of the data so that no further synchronization is required
  /// after calling this function. This function is expected to only be called a
  /// few times after reload, so it isn't used frequently. All entries in the
  /// \p paths vector are expected to be pointing to DictionaryStateValue(s)
  /// except the last entry, which is a key to any StateValue.
  /// \return a copy of the StateValue stored at \p paths, nullptr if no value
  ///         exists at paths
  std::unique_ptr<StateValue> getCopy(std::vector<std::string> paths);

  /// This class is the only way for callers to manipulate the DomainState. It
  /// is a scope-based commit where the modifications get saved upon the class's
  /// destruction. The class must not be saved elsewhere and outlive the
  /// DomainState where it came from. The intent is to nudge the caller to batch
  /// modifications and commit the changes in one go. Because we make a copy of
  /// the state with copy(), we want state changes to be atomic. Caller can
  /// still break things up into multiple transactions, but the hope is that
  /// this nudges them to think about modifications as one atomic unit.
  class Transaction {
   public:
    explicit Transaction(DomainState &state);
    ~Transaction();

    /// Adds a value to the container. All entries in the \p paths vector are
    /// expected to be pointing to DictionaryStateValue(s) except the last
    /// entry, which is a key to any StateValue.
    void add(std::vector<std::string> paths, const StateValue &value);

    /// Removes a value from the container. All entries in the \p paths vector
    /// are expected to be pointing to DictionaryStateValue(s) except the last
    /// entry, which is a key to any StateValue.
    void remove(std::vector<std::string> paths);

   private:
    friend DomainState;

    DomainState &state_;
    std::vector<StateModification> modifications_{};
  };

  /// Gets a Transaction for modification.
  Transaction transaction();

 private:
  /// Helper function for traversing the dictionary hierarchy.
  DictionaryStateValue *getDict(
      const std::vector<std::string> &paths,
      bool createMissingDict) TSA_REQUIRES(mutex_);

  /// Save modifications to \p dict_.
  void commitTransaction(Transaction &transaction);

  std::mutex mutex_{};

  /// The actual value container. TSA doesn't work if this is just a direct
  /// value on the class, so using an unique_ptr.
  std::unique_ptr<DictionaryStateValue> dict_ TSA_GUARDED_BY(mutex_){};
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_DOMAINSTATE_H
