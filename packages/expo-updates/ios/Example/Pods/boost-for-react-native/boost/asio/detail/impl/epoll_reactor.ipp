//
// detail/impl/epoll_reactor.ipp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_IMPL_EPOLL_REACTOR_IPP
#define BOOST_ASIO_DETAIL_IMPL_EPOLL_REACTOR_IPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_EPOLL)

#include <cstddef>
#include <sys/epoll.h>
#include <boost/asio/detail/epoll_reactor.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>

#if defined(BOOST_ASIO_HAS_TIMERFD)
# include <sys/timerfd.h>
#endif // defined(BOOST_ASIO_HAS_TIMERFD)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

epoll_reactor::epoll_reactor(boost::asio::io_service& io_service)
  : boost::asio::detail::service_base<epoll_reactor>(io_service),
    io_service_(use_service<io_service_impl>(io_service)),
    mutex_(),
    interrupter_(),
    epoll_fd_(do_epoll_create()),
    timer_fd_(do_timerfd_create()),
    shutdown_(false)
{
  // Add the interrupter's descriptor to epoll.
  epoll_event ev = { 0, { 0 } };
  ev.events = EPOLLIN | EPOLLERR | EPOLLET;
  ev.data.ptr = &interrupter_;
  epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, interrupter_.read_descriptor(), &ev);
  interrupter_.interrupt();

  // Add the timer descriptor to epoll.
  if (timer_fd_ != -1)
  {
    ev.events = EPOLLIN | EPOLLERR;
    ev.data.ptr = &timer_fd_;
    epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, timer_fd_, &ev);
  }
}

epoll_reactor::~epoll_reactor()
{
  if (epoll_fd_ != -1)
    close(epoll_fd_);
  if (timer_fd_ != -1)
    close(timer_fd_);
}

void epoll_reactor::shutdown_service()
{
  mutex::scoped_lock lock(mutex_);
  shutdown_ = true;
  lock.unlock();

  op_queue<operation> ops;

  while (descriptor_state* state = registered_descriptors_.first())
  {
    for (int i = 0; i < max_ops; ++i)
      ops.push(state->op_queue_[i]);
    state->shutdown_ = true;
    registered_descriptors_.free(state);
  }

  timer_queues_.get_all_timers(ops);

  io_service_.abandon_operations(ops);
}

void epoll_reactor::fork_service(boost::asio::io_service::fork_event fork_ev)
{
  if (fork_ev == boost::asio::io_service::fork_child)
  {
    if (epoll_fd_ != -1)
      ::close(epoll_fd_);
    epoll_fd_ = -1;
    epoll_fd_ = do_epoll_create();

    if (timer_fd_ != -1)
      ::close(timer_fd_);
    timer_fd_ = -1;
    timer_fd_ = do_timerfd_create();

    interrupter_.recreate();

    // Add the interrupter's descriptor to epoll.
    epoll_event ev = { 0, { 0 } };
    ev.events = EPOLLIN | EPOLLERR | EPOLLET;
    ev.data.ptr = &interrupter_;
    epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, interrupter_.read_descriptor(), &ev);
    interrupter_.interrupt();

    // Add the timer descriptor to epoll.
    if (timer_fd_ != -1)
    {
      ev.events = EPOLLIN | EPOLLERR;
      ev.data.ptr = &timer_fd_;
      epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, timer_fd_, &ev);
    }

    update_timeout();

    // Re-register all descriptors with epoll.
    mutex::scoped_lock descriptors_lock(registered_descriptors_mutex_);
    for (descriptor_state* state = registered_descriptors_.first();
        state != 0; state = state->next_)
    {
      ev.events = state->registered_events_;
      ev.data.ptr = state;
      int result = epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, state->descriptor_, &ev);
      if (result != 0)
      {
        boost::system::error_code ec(errno,
            boost::asio::error::get_system_category());
        boost::asio::detail::throw_error(ec, "epoll re-registration");
      }
    }
  }
}

void epoll_reactor::init_task()
{
  io_service_.init_task();
}

int epoll_reactor::register_descriptor(socket_type descriptor,
    epoll_reactor::per_descriptor_data& descriptor_data)
{
  descriptor_data = allocate_descriptor_state();

  {
    mutex::scoped_lock descriptor_lock(descriptor_data->mutex_);

    descriptor_data->reactor_ = this;
    descriptor_data->descriptor_ = descriptor;
    descriptor_data->shutdown_ = false;
  }

  epoll_event ev = { 0, { 0 } };
  ev.events = EPOLLIN | EPOLLERR | EPOLLHUP | EPOLLPRI | EPOLLET;
  descriptor_data->registered_events_ = ev.events;
  ev.data.ptr = descriptor_data;
  int result = epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, descriptor, &ev);
  if (result != 0)
    return errno;

  return 0;
}

int epoll_reactor::register_internal_descriptor(
    int op_type, socket_type descriptor,
    epoll_reactor::per_descriptor_data& descriptor_data, reactor_op* op)
{
  descriptor_data = allocate_descriptor_state();

  {
    mutex::scoped_lock descriptor_lock(descriptor_data->mutex_);

    descriptor_data->reactor_ = this;
    descriptor_data->descriptor_ = descriptor;
    descriptor_data->shutdown_ = false;
    descriptor_data->op_queue_[op_type].push(op);
  }

  epoll_event ev = { 0, { 0 } };
  ev.events = EPOLLIN | EPOLLERR | EPOLLHUP | EPOLLPRI | EPOLLET;
  descriptor_data->registered_events_ = ev.events;
  ev.data.ptr = descriptor_data;
  int result = epoll_ctl(epoll_fd_, EPOLL_CTL_ADD, descriptor, &ev);
  if (result != 0)
    return errno;

  return 0;
}

void epoll_reactor::move_descriptor(socket_type,
    epoll_reactor::per_descriptor_data& target_descriptor_data,
    epoll_reactor::per_descriptor_data& source_descriptor_data)
{
  target_descriptor_data = source_descriptor_data;
  source_descriptor_data = 0;
}

void epoll_reactor::start_op(int op_type, socket_type descriptor,
    epoll_reactor::per_descriptor_data& descriptor_data, reactor_op* op,
    bool is_continuation, bool allow_speculative)
{
  if (!descriptor_data)
  {
    op->ec_ = boost::asio::error::bad_descriptor;
    post_immediate_completion(op, is_continuation);
    return;
  }

  mutex::scoped_lock descriptor_lock(descriptor_data->mutex_);

  if (descriptor_data->shutdown_)
  {
    post_immediate_completion(op, is_continuation);
    return;
  }

  if (descriptor_data->op_queue_[op_type].empty())
  {
    if (allow_speculative
        && (op_type != read_op
          || descriptor_data->op_queue_[except_op].empty()))
    {
      if (op->perform())
      {
        descriptor_lock.unlock();
        io_service_.post_immediate_completion(op, is_continuation);
        return;
      }

      if (op_type == write_op)
      {
        if ((descriptor_data->registered_events_ & EPOLLOUT) == 0)
        {
          epoll_event ev = { 0, { 0 } };
          ev.events = descriptor_data->registered_events_ | EPOLLOUT;
          ev.data.ptr = descriptor_data;
          if (epoll_ctl(epoll_fd_, EPOLL_CTL_MOD, descriptor, &ev) == 0)
          {
            descriptor_data->registered_events_ |= ev.events;
          }
          else
          {
            op->ec_ = boost::system::error_code(errno,
                boost::asio::error::get_system_category());
            io_service_.post_immediate_completion(op, is_continuation);
            return;
          }
        }
      }
    }
    else
    {
      if (op_type == write_op)
      {
        descriptor_data->registered_events_ |= EPOLLOUT;
      }

      epoll_event ev = { 0, { 0 } };
      ev.events = descriptor_data->registered_events_;
      ev.data.ptr = descriptor_data;
      epoll_ctl(epoll_fd_, EPOLL_CTL_MOD, descriptor, &ev);
    }
  }

  descriptor_data->op_queue_[op_type].push(op);
  io_service_.work_started();
}

void epoll_reactor::cancel_ops(socket_type,
    epoll_reactor::per_descriptor_data& descriptor_data)
{
  if (!descriptor_data)
    return;

  mutex::scoped_lock descriptor_lock(descriptor_data->mutex_);

  op_queue<operation> ops;
  for (int i = 0; i < max_ops; ++i)
  {
    while (reactor_op* op = descriptor_data->op_queue_[i].front())
    {
      op->ec_ = boost::asio::error::operation_aborted;
      descriptor_data->op_queue_[i].pop();
      ops.push(op);
    }
  }

  descriptor_lock.unlock();

  io_service_.post_deferred_completions(ops);
}

void epoll_reactor::deregister_descriptor(socket_type descriptor,
    epoll_reactor::per_descriptor_data& descriptor_data, bool closing)
{
  if (!descriptor_data)
    return;

  mutex::scoped_lock descriptor_lock(descriptor_data->mutex_);

  if (!descriptor_data->shutdown_)
  {
    if (closing)
    {
      // The descriptor will be automatically removed from the epoll set when
      // it is closed.
    }
    else
    {
      epoll_event ev = { 0, { 0 } };
      epoll_ctl(epoll_fd_, EPOLL_CTL_DEL, descriptor, &ev);
    }

    op_queue<operation> ops;
    for (int i = 0; i < max_ops; ++i)
    {
      while (reactor_op* op = descriptor_data->op_queue_[i].front())
      {
        op->ec_ = boost::asio::error::operation_aborted;
        descriptor_data->op_queue_[i].pop();
        ops.push(op);
      }
    }

    descriptor_data->descriptor_ = -1;
    descriptor_data->shutdown_ = true;

    descriptor_lock.unlock();

    free_descriptor_state(descriptor_data);
    descriptor_data = 0;

    io_service_.post_deferred_completions(ops);
  }
}

void epoll_reactor::deregister_internal_descriptor(socket_type descriptor,
    epoll_reactor::per_descriptor_data& descriptor_data)
{
  if (!descriptor_data)
    return;

  mutex::scoped_lock descriptor_lock(descriptor_data->mutex_);

  if (!descriptor_data->shutdown_)
  {
    epoll_event ev = { 0, { 0 } };
    epoll_ctl(epoll_fd_, EPOLL_CTL_DEL, descriptor, &ev);

    op_queue<operation> ops;
    for (int i = 0; i < max_ops; ++i)
      ops.push(descriptor_data->op_queue_[i]);

    descriptor_data->descriptor_ = -1;
    descriptor_data->shutdown_ = true;

    descriptor_lock.unlock();

    free_descriptor_state(descriptor_data);
    descriptor_data = 0;
  }
}

void epoll_reactor::run(bool block, op_queue<operation>& ops)
{
  // This code relies on the fact that the task_io_service queues the reactor
  // task behind all descriptor operations generated by this function. This
  // means, that by the time we reach this point, any previously returned
  // descriptor operations have already been dequeued. Therefore it is now safe
  // for us to reuse and return them for the task_io_service to queue again.

  // Calculate a timeout only if timerfd is not used.
  int timeout;
  if (timer_fd_ != -1)
    timeout = block ? -1 : 0;
  else
  {
    mutex::scoped_lock lock(mutex_);
    timeout = block ? get_timeout() : 0;
  }

  // Block on the epoll descriptor.
  epoll_event events[128];
  int num_events = epoll_wait(epoll_fd_, events, 128, timeout);

#if defined(BOOST_ASIO_HAS_TIMERFD)
  bool check_timers = (timer_fd_ == -1);
#else // defined(BOOST_ASIO_HAS_TIMERFD)
  bool check_timers = true;
#endif // defined(BOOST_ASIO_HAS_TIMERFD)

  // Dispatch the waiting events.
  for (int i = 0; i < num_events; ++i)
  {
    void* ptr = events[i].data.ptr;
    if (ptr == &interrupter_)
    {
      // No need to reset the interrupter since we're leaving the descriptor
      // in a ready-to-read state and relying on edge-triggered notifications
      // to make it so that we only get woken up when the descriptor's epoll
      // registration is updated.

#if defined(BOOST_ASIO_HAS_TIMERFD)
      if (timer_fd_ == -1)
        check_timers = true;
#else // defined(BOOST_ASIO_HAS_TIMERFD)
      check_timers = true;
#endif // defined(BOOST_ASIO_HAS_TIMERFD)
    }
#if defined(BOOST_ASIO_HAS_TIMERFD)
    else if (ptr == &timer_fd_)
    {
      check_timers = true;
    }
#endif // defined(BOOST_ASIO_HAS_TIMERFD)
    else
    {
      // The descriptor operation doesn't count as work in and of itself, so we
      // don't call work_started() here. This still allows the io_service to
      // stop if the only remaining operations are descriptor operations.
      descriptor_state* descriptor_data = static_cast<descriptor_state*>(ptr);
      descriptor_data->set_ready_events(events[i].events);
      ops.push(descriptor_data);
    }
  }

  if (check_timers)
  {
    mutex::scoped_lock common_lock(mutex_);
    timer_queues_.get_ready_timers(ops);

#if defined(BOOST_ASIO_HAS_TIMERFD)
    if (timer_fd_ != -1)
    {
      itimerspec new_timeout;
      itimerspec old_timeout;
      int flags = get_timeout(new_timeout);
      timerfd_settime(timer_fd_, flags, &new_timeout, &old_timeout);
    }
#endif // defined(BOOST_ASIO_HAS_TIMERFD)
  }
}

void epoll_reactor::interrupt()
{
  epoll_event ev = { 0, { 0 } };
  ev.events = EPOLLIN | EPOLLERR | EPOLLET;
  ev.data.ptr = &interrupter_;
  epoll_ctl(epoll_fd_, EPOLL_CTL_MOD, interrupter_.read_descriptor(), &ev);
}

int epoll_reactor::do_epoll_create()
{
#if defined(EPOLL_CLOEXEC)
  int fd = epoll_create1(EPOLL_CLOEXEC);
#else // defined(EPOLL_CLOEXEC)
  int fd = -1;
  errno = EINVAL;
#endif // defined(EPOLL_CLOEXEC)

  if (fd == -1 && (errno == EINVAL || errno == ENOSYS))
  {
    fd = epoll_create(epoll_size);
    if (fd != -1)
      ::fcntl(fd, F_SETFD, FD_CLOEXEC);
  }

  if (fd == -1)
  {
    boost::system::error_code ec(errno,
        boost::asio::error::get_system_category());
    boost::asio::detail::throw_error(ec, "epoll");
  }

  return fd;
}

int epoll_reactor::do_timerfd_create()
{
#if defined(BOOST_ASIO_HAS_TIMERFD)
# if defined(TFD_CLOEXEC)
  int fd = timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC);
# else // defined(TFD_CLOEXEC)
  int fd = -1;
  errno = EINVAL;
# endif // defined(TFD_CLOEXEC)

  if (fd == -1 && errno == EINVAL)
  {
    fd = timerfd_create(CLOCK_MONOTONIC, 0);
    if (fd != -1)
      ::fcntl(fd, F_SETFD, FD_CLOEXEC);
  }

  return fd;
#else // defined(BOOST_ASIO_HAS_TIMERFD)
  return -1;
#endif // defined(BOOST_ASIO_HAS_TIMERFD)
}

epoll_reactor::descriptor_state* epoll_reactor::allocate_descriptor_state()
{
  mutex::scoped_lock descriptors_lock(registered_descriptors_mutex_);
  return registered_descriptors_.alloc();
}

void epoll_reactor::free_descriptor_state(epoll_reactor::descriptor_state* s)
{
  mutex::scoped_lock descriptors_lock(registered_descriptors_mutex_);
  registered_descriptors_.free(s);
}

void epoll_reactor::do_add_timer_queue(timer_queue_base& queue)
{
  mutex::scoped_lock lock(mutex_);
  timer_queues_.insert(&queue);
}

void epoll_reactor::do_remove_timer_queue(timer_queue_base& queue)
{
  mutex::scoped_lock lock(mutex_);
  timer_queues_.erase(&queue);
}

void epoll_reactor::update_timeout()
{
#if defined(BOOST_ASIO_HAS_TIMERFD)
  if (timer_fd_ != -1)
  {
    itimerspec new_timeout;
    itimerspec old_timeout;
    int flags = get_timeout(new_timeout);
    timerfd_settime(timer_fd_, flags, &new_timeout, &old_timeout);
    return;
  }
#endif // defined(BOOST_ASIO_HAS_TIMERFD)
  interrupt();
}

int epoll_reactor::get_timeout()
{
  // By default we will wait no longer than 5 minutes. This will ensure that
  // any changes to the system clock are detected after no longer than this.
  return timer_queues_.wait_duration_msec(5 * 60 * 1000);
}

#if defined(BOOST_ASIO_HAS_TIMERFD)
int epoll_reactor::get_timeout(itimerspec& ts)
{
  ts.it_interval.tv_sec = 0;
  ts.it_interval.tv_nsec = 0;

  long usec = timer_queues_.wait_duration_usec(5 * 60 * 1000 * 1000);
  ts.it_value.tv_sec = usec / 1000000;
  ts.it_value.tv_nsec = usec ? (usec % 1000000) * 1000 : 1;

  return usec ? 0 : TFD_TIMER_ABSTIME;
}
#endif // defined(BOOST_ASIO_HAS_TIMERFD)

struct epoll_reactor::perform_io_cleanup_on_block_exit
{
  explicit perform_io_cleanup_on_block_exit(epoll_reactor* r)
    : reactor_(r), first_op_(0)
  {
  }

  ~perform_io_cleanup_on_block_exit()
  {
    if (first_op_)
    {
      // Post the remaining completed operations for invocation.
      if (!ops_.empty())
        reactor_->io_service_.post_deferred_completions(ops_);

      // A user-initiated operation has completed, but there's no need to
      // explicitly call work_finished() here. Instead, we'll take advantage of
      // the fact that the task_io_service will call work_finished() once we
      // return.
    }
    else
    {
      // No user-initiated operations have completed, so we need to compensate
      // for the work_finished() call that the task_io_service will make once
      // this operation returns.
      reactor_->io_service_.work_started();
    }
  }

  epoll_reactor* reactor_;
  op_queue<operation> ops_;
  operation* first_op_;
};

epoll_reactor::descriptor_state::descriptor_state()
  : operation(&epoll_reactor::descriptor_state::do_complete)
{
}

operation* epoll_reactor::descriptor_state::perform_io(uint32_t events)
{
  mutex_.lock();
  perform_io_cleanup_on_block_exit io_cleanup(reactor_);
  mutex::scoped_lock descriptor_lock(mutex_, mutex::scoped_lock::adopt_lock);

  // Exception operations must be processed first to ensure that any
  // out-of-band data is read before normal data.
  static const int flag[max_ops] = { EPOLLIN, EPOLLOUT, EPOLLPRI };
  for (int j = max_ops - 1; j >= 0; --j)
  {
    if (events & (flag[j] | EPOLLERR | EPOLLHUP))
    {
      while (reactor_op* op = op_queue_[j].front())
      {
        if (op->perform())
        {
          op_queue_[j].pop();
          io_cleanup.ops_.push(op);
        }
        else
          break;
      }
    }
  }

  // The first operation will be returned for completion now. The others will
  // be posted for later by the io_cleanup object's destructor.
  io_cleanup.first_op_ = io_cleanup.ops_.front();
  io_cleanup.ops_.pop();
  return io_cleanup.first_op_;
}

void epoll_reactor::descriptor_state::do_complete(
    io_service_impl* owner, operation* base,
    const boost::system::error_code& ec, std::size_t bytes_transferred)
{
  if (owner)
  {
    descriptor_state* descriptor_data = static_cast<descriptor_state*>(base);
    uint32_t events = static_cast<uint32_t>(bytes_transferred);
    if (operation* op = descriptor_data->perform_io(events))
    {
      op->complete(*owner, ec, 0);
    }
  }
}

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // defined(BOOST_ASIO_HAS_EPOLL)

#endif // BOOST_ASIO_DETAIL_IMPL_EPOLL_REACTOR_IPP
