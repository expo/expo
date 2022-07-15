#include <condition_variable>
#include <cstdint>
#include <cstdio>
#include <functional>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <vector>

// https://github.com/embeddedartistry/embedded-resources/blob/master/examples/cpp/dispatch.cpp
namespace ABI46_0_0RNSkia {

class ABI46_0_0RNSkDispatchQueue {
  typedef std::function<void(void)> fp_t;

public:
  ABI46_0_0RNSkDispatchQueue(std::string name, size_t thread_cnt = 1);

  ~ABI46_0_0RNSkDispatchQueue();

  // dispatch and copy
  void dispatch(const fp_t &op);

  // dispatch and move
  void dispatch(fp_t &&op);

  // Deleted operations
  ABI46_0_0RNSkDispatchQueue(const ABI46_0_0RNSkDispatchQueue &rhs) = delete;

  ABI46_0_0RNSkDispatchQueue &operator=(const ABI46_0_0RNSkDispatchQueue &rhs) = delete;

  ABI46_0_0RNSkDispatchQueue(ABI46_0_0RNSkDispatchQueue &&rhs) = delete;

  ABI46_0_0RNSkDispatchQueue &operator=(ABI46_0_0RNSkDispatchQueue &&rhs) = delete;

private:
  std::string name_;
  std::mutex lock_;
  std::vector<std::thread> threads_;
  std::queue<fp_t> q_;
  std::condition_variable cv_;
  bool quit_ = false;

  void dispatch_thread_handler(void);
};
} // namespace ABI46_0_0RNSkia
