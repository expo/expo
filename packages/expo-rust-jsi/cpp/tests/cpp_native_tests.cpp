// C++ Native Tests for expo-rust-jsi
//
// Tests the pure C++ components of the shim layer that don't depend on
// cxx bridge types. Specifically tests HandleTable, which is a standalone
// C++ class used to track JSI objects across the FFI boundary.
//
// FfiValue constructors and JSI-dependent code are tested via Rust FFI
// integration tests (tests/ffi_bridge_tests.rs) since they require the
// cxx-generated bridge types.
//
// Build: cmake -B cpp/tests/build cpp/tests && cmake --build cpp/tests/build
// Run:   cpp/tests/build/cpp_native_tests

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <string>
#include <vector>
#include <thread>
#include <memory>
#include <unordered_map>
#include <mutex>
#include <functional>
#include <stdexcept>

// ============================================================================
// Minimal test framework
// ============================================================================

static int tests_run = 0;
static int tests_passed = 0;
static int tests_failed = 0;

#define TEST(name) \
  static void test_##name(); \
  static struct TestReg_##name { \
    TestReg_##name() { test_registry().push_back({#name, test_##name}); } \
  } test_reg_##name; \
  static void test_##name()

#define ASSERT_TRUE(expr) do { \
  if (!(expr)) { \
    fprintf(stderr, "  FAIL: %s:%d: %s\n", __FILE__, __LINE__, #expr); \
    throw std::runtime_error("assertion failed"); \
  } \
} while(0)

#define ASSERT_FALSE(expr) ASSERT_TRUE(!(expr))
#define ASSERT_EQ(a, b) ASSERT_TRUE((a) == (b))
#define ASSERT_NE(a, b) ASSERT_TRUE((a) != (b))
#define ASSERT_GT(a, b) ASSERT_TRUE((a) > (b))

struct TestEntry {
  const char* name;
  void (*fn)();
};

static std::vector<TestEntry>& test_registry() {
  static std::vector<TestEntry> registry;
  return registry;
}

// ============================================================================
// Inline HandleTable (mirrors the implementation in jsi_shim.h/cpp, extracted
// here to avoid cxx bridge dependency in standalone test builds)
// ============================================================================

namespace expo {
namespace rust_jsi {

class HandleTable {
public:
  static HandleTable& instance() {
    static HandleTable inst;
    return inst;
  }

  uint64_t store(std::shared_ptr<void> obj) {
    std::lock_guard<std::mutex> lock(mutex_);
    uint64_t handle = next_handle_++;
    table_[handle] = std::move(obj);
    return handle;
  }

  std::shared_ptr<void> get(uint64_t handle) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = table_.find(handle);
    if (it == table_.end()) return nullptr;
    return it->second;
  }

  void release(uint64_t handle) {
    std::lock_guard<std::mutex> lock(mutex_);
    table_.erase(handle);
  }

  size_t size() {
    std::lock_guard<std::mutex> lock(mutex_);
    return table_.size();
  }

private:
  HandleTable() = default;
  std::unordered_map<uint64_t, std::shared_ptr<void>> table_;
  uint64_t next_handle_ = 1;
  std::mutex mutex_;
};

} // namespace rust_jsi
} // namespace expo

using namespace expo::rust_jsi;

// ============================================================================
// HandleTable tests
// ============================================================================

TEST(handle_table_store_and_get) {
  auto& ht = HandleTable::instance();
  auto obj = std::make_shared<int>(42);
  uint64_t handle = ht.store(obj);
  ASSERT_GT(handle, (uint64_t)0);

  auto retrieved = ht.get(handle);
  ASSERT_TRUE(retrieved != nullptr);
  ASSERT_EQ(*std::static_pointer_cast<int>(retrieved), 42);

  ht.release(handle);
}

TEST(handle_table_unique_handles) {
  auto& ht = HandleTable::instance();
  auto obj1 = std::make_shared<int>(1);
  auto obj2 = std::make_shared<int>(2);
  auto obj3 = std::make_shared<int>(3);

  uint64_t h1 = ht.store(obj1);
  uint64_t h2 = ht.store(obj2);
  uint64_t h3 = ht.store(obj3);

  ASSERT_NE(h1, h2);
  ASSERT_NE(h2, h3);
  ASSERT_NE(h1, h3);

  ht.release(h1);
  ht.release(h2);
  ht.release(h3);
}

TEST(handle_table_release) {
  auto& ht = HandleTable::instance();
  auto obj = std::make_shared<int>(99);
  uint64_t handle = ht.store(obj);

  ASSERT_TRUE(ht.get(handle) != nullptr);
  ht.release(handle);
  ASSERT_TRUE(ht.get(handle) == nullptr);
}

TEST(handle_table_get_invalid_returns_null) {
  auto& ht = HandleTable::instance();
  auto result = ht.get(999999999);
  ASSERT_TRUE(result == nullptr);
}

TEST(handle_table_release_invalid_does_not_crash) {
  auto& ht = HandleTable::instance();
  ht.release(999999998);
}

TEST(handle_table_stores_different_types) {
  auto& ht = HandleTable::instance();
  auto int_obj = std::make_shared<int>(42);
  auto str_obj = std::make_shared<std::string>("hello");
  auto vec_obj = std::make_shared<std::vector<int>>(std::vector<int>{1, 2, 3});

  uint64_t h1 = ht.store(int_obj);
  uint64_t h2 = ht.store(str_obj);
  uint64_t h3 = ht.store(vec_obj);

  ASSERT_EQ(*std::static_pointer_cast<int>(ht.get(h1)), 42);
  ASSERT_EQ(*std::static_pointer_cast<std::string>(ht.get(h2)), "hello");
  auto vec = std::static_pointer_cast<std::vector<int>>(ht.get(h3));
  ASSERT_EQ(vec->size(), (size_t)3);
  ASSERT_EQ((*vec)[2], 3);

  ht.release(h1);
  ht.release(h2);
  ht.release(h3);
}

TEST(handle_table_concurrent_store) {
  auto& ht = HandleTable::instance();
  std::vector<std::thread> threads;
  std::vector<uint64_t> handles(10);

  for (int i = 0; i < 10; i++) {
    threads.emplace_back([&ht, &handles, i]() {
      auto obj = std::make_shared<int>(i * 100);
      handles[i] = ht.store(obj);
    });
  }
  for (auto& t : threads) t.join();

  for (int i = 0; i < 10; i++) {
    ASSERT_GT(handles[i], (uint64_t)0);
    auto obj = std::static_pointer_cast<int>(ht.get(handles[i]));
    ASSERT_TRUE(obj != nullptr);
    ASSERT_EQ(*obj, i * 100);
  }

  // All handles unique
  for (int i = 0; i < 10; i++) {
    for (int j = i + 1; j < 10; j++) {
      ASSERT_NE(handles[i], handles[j]);
    }
  }

  for (int i = 0; i < 10; i++) ht.release(handles[i]);
}

TEST(handle_table_shared_ptr_ref_count) {
  auto& ht = HandleTable::instance();
  auto obj = std::make_shared<int>(77);
  ASSERT_EQ(obj.use_count(), (long)1);

  uint64_t handle = ht.store(obj);
  ASSERT_EQ(obj.use_count(), (long)2);

  ht.release(handle);
  ASSERT_EQ(obj.use_count(), (long)1);
}

TEST(handle_table_monotonic_handles) {
  auto& ht = HandleTable::instance();
  auto obj1 = std::make_shared<int>(1);
  uint64_t h1 = ht.store(obj1);
  ht.release(h1);

  // New handle should be higher, never reused
  auto obj2 = std::make_shared<int>(2);
  uint64_t h2 = ht.store(obj2);
  ASSERT_GT(h2, h1);

  ht.release(h2);
}

TEST(handle_table_many_entries) {
  auto& ht = HandleTable::instance();
  std::vector<uint64_t> handles;

  for (int i = 0; i < 1000; i++) {
    handles.push_back(ht.store(std::make_shared<int>(i)));
  }

  ASSERT_EQ(*std::static_pointer_cast<int>(ht.get(handles[0])), 0);
  ASSERT_EQ(*std::static_pointer_cast<int>(ht.get(handles[500])), 500);
  ASSERT_EQ(*std::static_pointer_cast<int>(ht.get(handles[999])), 999);

  for (auto h : handles) ht.release(h);
}

TEST(handle_table_concurrent_store_and_release) {
  auto& ht = HandleTable::instance();
  std::vector<std::thread> threads;

  for (int i = 0; i < 10; i++) {
    threads.emplace_back([&ht]() {
      for (int j = 0; j < 100; j++) {
        auto obj = std::make_shared<int>(j);
        uint64_t h = ht.store(obj);
        if (j % 2 == 0) {
          ht.release(h);
        }
      }
    });
  }
  for (auto& t : threads) t.join();
  // If we reach here, no crashes or deadlocks occurred
}

TEST(handle_table_null_shared_ptr) {
  auto& ht = HandleTable::instance();
  std::shared_ptr<void> null_ptr;
  uint64_t handle = ht.store(null_ptr);
  ASSERT_GT(handle, (uint64_t)0);

  auto retrieved = ht.get(handle);
  ASSERT_TRUE(retrieved == nullptr); // stored a null, get back null

  ht.release(handle);
}

// ============================================================================
// Test runner
// ============================================================================

int main() {
  auto& tests = test_registry();
  printf("Running %zu C++ native tests...\n\n", tests.size());

  for (const auto& test : tests) {
    tests_run++;
    try {
      test.fn();
      tests_passed++;
      printf("  ok   %s\n", test.name);
    } catch (const std::exception& e) {
      tests_failed++;
      printf("  FAIL %s: %s\n", test.name, e.what());
    }
  }

  printf("\ntest result: %s. %d passed; %d failed; 0 ignored\n",
         tests_failed == 0 ? "ok" : "FAILED",
         tests_passed, tests_failed);

  return tests_failed > 0 ? 1 : 0;
}
