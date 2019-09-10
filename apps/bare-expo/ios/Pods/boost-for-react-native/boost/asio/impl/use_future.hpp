//
// impl/use_future.hpp
// ~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IMPL_USE_FUTURE_HPP
#define BOOST_ASIO_IMPL_USE_FUTURE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <future>
#include <boost/asio/async_result.hpp>
#include <boost/system/error_code.hpp>
#include <boost/asio/handler_type.hpp>
#include <boost/system/system_error.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

  // Completion handler to adapt a promise as a completion handler.
  template <typename T>
  class promise_handler
  {
  public:
    // Construct from use_future special value.
    template <typename Alloc>
    promise_handler(use_future_t<Alloc> uf)
      : promise_(std::allocate_shared<std::promise<T> >(
            typename Alloc::template rebind<char>::other(uf.get_allocator()),
            std::allocator_arg,
            typename Alloc::template rebind<char>::other(uf.get_allocator())))
    {
    }

    void operator()(T t)
    {
      promise_->set_value(t);
    }

    void operator()(const boost::system::error_code& ec, T t)
    {
      if (ec)
        promise_->set_exception(
            std::make_exception_ptr(
              boost::system::system_error(ec)));
      else
        promise_->set_value(t);
    }

  //private:
    std::shared_ptr<std::promise<T> > promise_;
  };

  // Completion handler to adapt a void promise as a completion handler.
  template <>
  class promise_handler<void>
  {
  public:
    // Construct from use_future special value. Used during rebinding.
    template <typename Alloc>
    promise_handler(use_future_t<Alloc> uf)
      : promise_(std::allocate_shared<std::promise<void> >(
            typename Alloc::template rebind<char>::other(uf.get_allocator()),
            std::allocator_arg,
            typename Alloc::template rebind<char>::other(uf.get_allocator())))
    {
    }

    void operator()()
    {
      promise_->set_value();
    }

    void operator()(const boost::system::error_code& ec)
    {
      if (ec)
        promise_->set_exception(
            std::make_exception_ptr(
              boost::system::system_error(ec)));
      else
        promise_->set_value();
    }

  //private:
    std::shared_ptr<std::promise<void> > promise_;
  };

  // Ensure any exceptions thrown from the handler are propagated back to the
  // caller via the future.
  template <typename Function, typename T>
  void asio_handler_invoke(Function f, promise_handler<T>* h)
  {
    std::shared_ptr<std::promise<T> > p(h->promise_);
    try
    {
      f();
    }
    catch (...)
    {
      p->set_exception(std::current_exception());
    }
  }

} // namespace detail

#if !defined(GENERATING_DOCUMENTATION)

// Handler traits specialisation for promise_handler.
template <typename T>
class async_result<detail::promise_handler<T> >
{
public:
  // The initiating function will return a future.
  typedef std::future<T> type;

  // Constructor creates a new promise for the async operation, and obtains the
  // corresponding future.
  explicit async_result(detail::promise_handler<T>& h)
  {
    value_ = h.promise_->get_future();
  }

  // Obtain the future to be returned from the initiating function.
  type get() { return std::move(value_); }

private:
  type value_;
};

// Handler type specialisation for use_future.
template <typename Allocator, typename ReturnType>
struct handler_type<use_future_t<Allocator>, ReturnType()>
{
  typedef detail::promise_handler<void> type;
};

// Handler type specialisation for use_future.
template <typename Allocator, typename ReturnType, typename Arg1>
struct handler_type<use_future_t<Allocator>, ReturnType(Arg1)>
{
  typedef detail::promise_handler<Arg1> type;
};

// Handler type specialisation for use_future.
template <typename Allocator, typename ReturnType>
struct handler_type<use_future_t<Allocator>,
    ReturnType(boost::system::error_code)>
{
  typedef detail::promise_handler<void> type;
};

// Handler type specialisation for use_future.
template <typename Allocator, typename ReturnType, typename Arg2>
struct handler_type<use_future_t<Allocator>,
    ReturnType(boost::system::error_code, Arg2)>
{
  typedef detail::promise_handler<Arg2> type;
};

#endif // !defined(GENERATING_DOCUMENTATION)

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IMPL_USE_FUTURE_HPP
