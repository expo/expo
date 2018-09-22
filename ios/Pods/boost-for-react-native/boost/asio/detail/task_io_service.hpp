//
// detail/task_io_service.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_TASK_IO_SERVICE_HPP
#define BOOST_ASIO_DETAIL_TASK_IO_SERVICE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if !defined(BOOST_ASIO_HAS_IOCP)

#include <boost/system/error_code.hpp>
#include <boost/asio/io_service.hpp>
#include <boost/asio/detail/atomic_count.hpp>
#include <boost/asio/detail/call_stack.hpp>
#include <boost/asio/detail/event.hpp>
#include <boost/asio/detail/mutex.hpp>
#include <boost/asio/detail/op_queue.hpp>
#include <boost/asio/detail/reactor_fwd.hpp>
#include <boost/asio/detail/task_io_service_operation.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

struct task_io_service_thread_info;

class task_io_service
  : public boost::asio::detail::service_base<task_io_service>
{
public:
  typedef task_io_service_operation operation;

  // Constructor. Specifies the number of concurrent threads that are likely to
  // run the io_service. If set to 1 certain optimisation are performed.
  BOOST_ASIO_DECL task_io_service(boost::asio::io_service& io_service,
      std::size_t concurrency_hint = 0);

  // Destroy all user-defined handler objects owned by the service.
  BOOST_ASIO_DECL void shutdown_service();

  // Initialise the task, if required.
  BOOST_ASIO_DECL void init_task();

  // Run the event loop until interrupted or no more work.
  BOOST_ASIO_DECL std::size_t run(boost::system::error_code& ec);

  // Run until interrupted or one operation is performed.
  BOOST_ASIO_DECL std::size_t run_one(boost::system::error_code& ec);

  // Poll for operations without blocking.
  BOOST_ASIO_DECL std::size_t poll(boost::system::error_code& ec);

  // Poll for one operation without blocking.
  BOOST_ASIO_DECL std::size_t poll_one(boost::system::error_code& ec);

  // Interrupt the event processing loop.
  BOOST_ASIO_DECL void stop();

  // Determine whether the io_service is stopped.
  BOOST_ASIO_DECL bool stopped() const;

  // Reset in preparation for a subsequent run invocation.
  BOOST_ASIO_DECL void reset();

  // Notify that some work has started.
  void work_started()
  {
    ++outstanding_work_;
  }

  // Notify that some work has finished.
  void work_finished()
  {
    if (--outstanding_work_ == 0)
      stop();
  }

  // Return whether a handler can be dispatched immediately.
  bool can_dispatch()
  {
    return thread_call_stack::contains(this) != 0;
  }

  // Request invocation of the given handler.
  template <typename Handler>
  void dispatch(Handler& handler);

  // Request invocation of the given handler and return immediately.
  template <typename Handler>
  void post(Handler& handler);

  // Request invocation of the given operation and return immediately. Assumes
  // that work_started() has not yet been called for the operation.
  BOOST_ASIO_DECL void post_immediate_completion(
      operation* op, bool is_continuation);

  // Request invocation of the given operation and return immediately. Assumes
  // that work_started() was previously called for the operation.
  BOOST_ASIO_DECL void post_deferred_completion(operation* op);

  // Request invocation of the given operations and return immediately. Assumes
  // that work_started() was previously called for each operation.
  BOOST_ASIO_DECL void post_deferred_completions(op_queue<operation>& ops);

  // Process unfinished operations as part of a shutdown_service operation.
  // Assumes that work_started() was previously called for the operations.
  BOOST_ASIO_DECL void abandon_operations(op_queue<operation>& ops);

private:
  // Structure containing thread-specific data.
  typedef task_io_service_thread_info thread_info;

  // Enqueue the given operation following a failed attempt to dispatch the
  // operation for immediate invocation.
  BOOST_ASIO_DECL void do_dispatch(operation* op);

  // Run at most one operation. May block.
  BOOST_ASIO_DECL std::size_t do_run_one(mutex::scoped_lock& lock,
      thread_info& this_thread, const boost::system::error_code& ec);

  // Poll for at most one operation.
  BOOST_ASIO_DECL std::size_t do_poll_one(mutex::scoped_lock& lock,
      thread_info& this_thread, const boost::system::error_code& ec);

  // Stop the task and all idle threads.
  BOOST_ASIO_DECL void stop_all_threads(mutex::scoped_lock& lock);

  // Wake a single idle thread, or the task, and always unlock the mutex.
  BOOST_ASIO_DECL void wake_one_thread_and_unlock(
      mutex::scoped_lock& lock);

  // Helper class to perform task-related operations on block exit.
  struct task_cleanup;
  friend struct task_cleanup;

  // Helper class to call work-related operations on block exit.
  struct work_cleanup;
  friend struct work_cleanup;

  // Whether to optimise for single-threaded use cases.
  const bool one_thread_;

  // Mutex to protect access to internal data.
  mutable mutex mutex_;

  // Event to wake up blocked threads.
  event wakeup_event_;

  // The task to be run by this service.
  reactor* task_;

  // Operation object to represent the position of the task in the queue.
  struct task_operation : operation
  {
    task_operation() : operation(0) {}
  } task_operation_;

  // Whether the task has been interrupted.
  bool task_interrupted_;

  // The count of unfinished work.
  atomic_count outstanding_work_;

  // The queue of handlers that are ready to be delivered.
  op_queue<operation> op_queue_;

  // Flag to indicate that the dispatcher has been stopped.
  bool stopped_;

  // Flag to indicate that the dispatcher has been shut down.
  bool shutdown_;

  // Per-thread call stack to track the state of each thread in the io_service.
  typedef call_stack<task_io_service, thread_info> thread_call_stack;
};

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#include <boost/asio/detail/impl/task_io_service.hpp>
#if defined(BOOST_ASIO_HEADER_ONLY)
# include <boost/asio/detail/impl/task_io_service.ipp>
#endif // defined(BOOST_ASIO_HEADER_ONLY)

#endif // !defined(BOOST_ASIO_HAS_IOCP)

#endif // BOOST_ASIO_DETAIL_TASK_IO_SERVICE_HPP
