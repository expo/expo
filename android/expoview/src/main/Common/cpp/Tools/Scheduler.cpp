#include "Scheduler.h"

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

