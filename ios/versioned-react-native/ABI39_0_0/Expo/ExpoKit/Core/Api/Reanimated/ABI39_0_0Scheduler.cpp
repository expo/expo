#include "ABI39_0_0Scheduler.h"

namespace ABI39_0_0reanimated
{

void Scheduler::scheduleOnUI(std::function<void()> job) {
  uiJobs.push(std::move(job));
}

void Scheduler::scheduleOnJS(std::function<void()> job) {
  jsJobs.push(std::move(job));
}

void Scheduler::triggerUI() {
  auto job = uiJobs.pop();
  job();
}

void Scheduler::triggerJS() {
  auto job = jsJobs.pop();
  job();
}

Scheduler::~Scheduler() {}

}
