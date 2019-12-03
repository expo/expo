//
// detail/impl/strand_service.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_IMPL_STRAND_SERVICE_HPP
#define BOOST_ASIO_DETAIL_IMPL_STRAND_SERVICE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/addressof.hpp>
#include <boost/asio/detail/call_stack.hpp>
#include <boost/asio/detail/completion_handler.hpp>
#include <boost/asio/detail/fenced_block.hpp>
#include <boost/asio/detail/handler_alloc_helpers.hpp>
#include <boost/asio/detail/handler_invoke_helpers.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

inline strand_service::strand_impl::strand_impl()
  : operation(&strand_service::do_complete),
    locked_(false)
{
}

struct strand_service::on_dispatch_exit
{
  io_service_impl* io_service_;
  strand_impl* impl_;

  ~on_dispatch_exit()
  {
    impl_->mutex_.lock();
    impl_->ready_queue_.push(impl_->waiting_queue_);
    bool more_handlers = impl_->locked_ = !impl_->ready_queue_.empty();
    impl_->mutex_.unlock();

    if (more_handlers)
      io_service_->post_immediate_completion(impl_, false);
  }
};

template <typename Handler>
void strand_service::dispatch(strand_service::implementation_type& impl,
    Handler& handler)
{
  // If we are already in the strand then the handler can run immediately.
  if (call_stack<strand_impl>::contains(impl))
  {
    fenced_block b(fenced_block::full);
    boost_asio_handler_invoke_helpers::invoke(handler, handler);
    return;
  }

  // Allocate and construct an operation to wrap the handler.
  typedef completion_handler<Handler> op;
  typename op::ptr p = { boost::asio::detail::addressof(handler),
    boost_asio_handler_alloc_helpers::allocate(
      sizeof(op), handler), 0 };
  p.p = new (p.v) op(handler);

  BOOST_ASIO_HANDLER_CREATION((p.p, "strand", impl, "dispatch"));

  bool dispatch_immediately = do_dispatch(impl, p.p);
  operation* o = p.p;
  p.v = p.p = 0;

  if (dispatch_immediately)
  {
    // Indicate that this strand is executing on the current thread.
    call_stack<strand_impl>::context ctx(impl);

    // Ensure the next handler, if any, is scheduled on block exit.
    on_dispatch_exit on_exit = { &io_service_, impl };
    (void)on_exit;

    completion_handler<Handler>::do_complete(
        &io_service_, o, boost::system::error_code(), 0);
  }
}

// Request the io_service to invoke the given handler and return immediately.
template <typename Handler>
void strand_service::post(strand_service::implementation_type& impl,
    Handler& handler)
{
  bool is_continuation =
    boost_asio_handler_cont_helpers::is_continuation(handler);

  // Allocate and construct an operation to wrap the handler.
  typedef completion_handler<Handler> op;
  typename op::ptr p = { boost::asio::detail::addressof(handler),
    boost_asio_handler_alloc_helpers::allocate(
      sizeof(op), handler), 0 };
  p.p = new (p.v) op(handler);

  BOOST_ASIO_HANDLER_CREATION((p.p, "strand", impl, "post"));

  do_post(impl, p.p, is_continuation);
  p.v = p.p = 0;
}

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_DETAIL_IMPL_STRAND_SERVICE_HPP
