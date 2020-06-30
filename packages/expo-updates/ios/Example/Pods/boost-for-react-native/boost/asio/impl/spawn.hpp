//
// impl/spawn.hpp
// ~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IMPL_SPAWN_HPP
#define BOOST_ASIO_IMPL_SPAWN_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <boost/asio/async_result.hpp>
#include <boost/asio/detail/atomic_count.hpp>
#include <boost/asio/detail/handler_alloc_helpers.hpp>
#include <boost/asio/detail/handler_cont_helpers.hpp>
#include <boost/asio/detail/handler_invoke_helpers.hpp>
#include <boost/asio/detail/noncopyable.hpp>
#include <boost/asio/detail/shared_ptr.hpp>
#include <boost/asio/handler_type.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

  template <typename Handler, typename T>
  class coro_handler
  {
  public:
    coro_handler(basic_yield_context<Handler> ctx)
      : coro_(ctx.coro_.lock()),
        ca_(ctx.ca_),
        handler_(ctx.handler_),
        ready_(0),
        ec_(ctx.ec_),
        value_(0)
    {
    }

    void operator()(T value)
    {
      *ec_ = boost::system::error_code();
      *value_ = BOOST_ASIO_MOVE_CAST(T)(value);
      if (--*ready_ == 0)
        (*coro_)();
    }

    void operator()(boost::system::error_code ec, T value)
    {
      *ec_ = ec;
      *value_ = BOOST_ASIO_MOVE_CAST(T)(value);
      if (--*ready_ == 0)
        (*coro_)();
    }

  //private:
    shared_ptr<typename basic_yield_context<Handler>::callee_type> coro_;
    typename basic_yield_context<Handler>::caller_type& ca_;
    Handler& handler_;
    atomic_count* ready_;
    boost::system::error_code* ec_;
    T* value_;
  };

  template <typename Handler>
  class coro_handler<Handler, void>
  {
  public:
    coro_handler(basic_yield_context<Handler> ctx)
      : coro_(ctx.coro_.lock()),
        ca_(ctx.ca_),
        handler_(ctx.handler_),
        ready_(0),
        ec_(ctx.ec_)
    {
    }

    void operator()()
    {
      *ec_ = boost::system::error_code();
      if (--*ready_ == 0)
        (*coro_)();
    }

    void operator()(boost::system::error_code ec)
    {
      *ec_ = ec;
      if (--*ready_ == 0)
        (*coro_)();
    }

  //private:
    shared_ptr<typename basic_yield_context<Handler>::callee_type> coro_;
    typename basic_yield_context<Handler>::caller_type& ca_;
    Handler& handler_;
    atomic_count* ready_;
    boost::system::error_code* ec_;
  };

  template <typename Handler, typename T>
  inline void* asio_handler_allocate(std::size_t size,
      coro_handler<Handler, T>* this_handler)
  {
    return boost_asio_handler_alloc_helpers::allocate(
        size, this_handler->handler_);
  }

  template <typename Handler, typename T>
  inline void asio_handler_deallocate(void* pointer, std::size_t size,
      coro_handler<Handler, T>* this_handler)
  {
    boost_asio_handler_alloc_helpers::deallocate(
        pointer, size, this_handler->handler_);
  }

  template <typename Handler, typename T>
  inline bool asio_handler_is_continuation(coro_handler<Handler, T>*)
  {
    return true;
  }

  template <typename Function, typename Handler, typename T>
  inline void asio_handler_invoke(Function& function,
      coro_handler<Handler, T>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

  template <typename Function, typename Handler, typename T>
  inline void asio_handler_invoke(const Function& function,
      coro_handler<Handler, T>* this_handler)
  {
    boost_asio_handler_invoke_helpers::invoke(
        function, this_handler->handler_);
  }

} // namespace detail

#if !defined(GENERATING_DOCUMENTATION)

template <typename Handler, typename ReturnType>
struct handler_type<basic_yield_context<Handler>, ReturnType()>
{
  typedef detail::coro_handler<Handler, void> type;
};

template <typename Handler, typename ReturnType, typename Arg1>
struct handler_type<basic_yield_context<Handler>, ReturnType(Arg1)>
{
  typedef detail::coro_handler<Handler, Arg1> type;
};

template <typename Handler, typename ReturnType>
struct handler_type<basic_yield_context<Handler>,
    ReturnType(boost::system::error_code)>
{
  typedef detail::coro_handler<Handler, void> type;
};

template <typename Handler, typename ReturnType, typename Arg2>
struct handler_type<basic_yield_context<Handler>,
    ReturnType(boost::system::error_code, Arg2)>
{
  typedef detail::coro_handler<Handler, Arg2> type;
};

template <typename Handler, typename T>
class async_result<detail::coro_handler<Handler, T> >
{
public:
  typedef T type;

  explicit async_result(detail::coro_handler<Handler, T>& h)
    : handler_(h),
      ca_(h.ca_),
      ready_(2)
  {
    h.ready_ = &ready_;
    out_ec_ = h.ec_;
    if (!out_ec_) h.ec_ = &ec_;
    h.value_ = &value_;
  }

  type get()
  {
    handler_.coro_.reset(); // Must not hold shared_ptr to coro while suspended.
    if (--ready_ != 0)
      ca_();
    if (!out_ec_ && ec_) throw boost::system::system_error(ec_);
    return BOOST_ASIO_MOVE_CAST(type)(value_);
  }

private:
  detail::coro_handler<Handler, T>& handler_;
  typename basic_yield_context<Handler>::caller_type& ca_;
  detail::atomic_count ready_;
  boost::system::error_code* out_ec_;
  boost::system::error_code ec_;
  type value_;
};

template <typename Handler>
class async_result<detail::coro_handler<Handler, void> >
{
public:
  typedef void type;

  explicit async_result(detail::coro_handler<Handler, void>& h)
    : handler_(h),
      ca_(h.ca_),
      ready_(2)
  {
    h.ready_ = &ready_;
    out_ec_ = h.ec_;
    if (!out_ec_) h.ec_ = &ec_;
  }

  void get()
  {
    handler_.coro_.reset(); // Must not hold shared_ptr to coro while suspended.
    if (--ready_ != 0)
      ca_();
    if (!out_ec_ && ec_) throw boost::system::system_error(ec_);
  }

private:
  detail::coro_handler<Handler, void>& handler_;
  typename basic_yield_context<Handler>::caller_type& ca_;
  detail::atomic_count ready_;
  boost::system::error_code* out_ec_;
  boost::system::error_code ec_;
};

namespace detail {

  template <typename Handler, typename Function>
  struct spawn_data : private noncopyable
  {
    spawn_data(BOOST_ASIO_MOVE_ARG(Handler) handler,
        bool call_handler, BOOST_ASIO_MOVE_ARG(Function) function)
      : handler_(BOOST_ASIO_MOVE_CAST(Handler)(handler)),
        call_handler_(call_handler),
        function_(BOOST_ASIO_MOVE_CAST(Function)(function))
    {
    }

    weak_ptr<typename basic_yield_context<Handler>::callee_type> coro_;
    Handler handler_;
    bool call_handler_;
    Function function_;
  };

  template <typename Handler, typename Function>
  struct coro_entry_point
  {
    void operator()(typename basic_yield_context<Handler>::caller_type& ca)
    {
      shared_ptr<spawn_data<Handler, Function> > data(data_);
#if !defined(BOOST_COROUTINES_UNIDIRECT) && !defined(BOOST_COROUTINES_V2)
      ca(); // Yield until coroutine pointer has been initialised.
#endif // !defined(BOOST_COROUTINES_UNIDIRECT) && !defined(BOOST_COROUTINES_V2)
      const basic_yield_context<Handler> yield(
          data->coro_, ca, data->handler_);
      (data->function_)(yield);
      if (data->call_handler_)
        (data->handler_)();
    }

    shared_ptr<spawn_data<Handler, Function> > data_;
  };

  template <typename Handler, typename Function>
  struct spawn_helper
  {
    void operator()()
    {
      typedef typename basic_yield_context<Handler>::callee_type callee_type;
      coro_entry_point<Handler, Function> entry_point = { data_ };
      shared_ptr<callee_type> coro(new callee_type(entry_point, attributes_));
      data_->coro_ = coro;
      (*coro)();
    }

    shared_ptr<spawn_data<Handler, Function> > data_;
    boost::coroutines::attributes attributes_;
  };

  inline void default_spawn_handler() {}

} // namespace detail

template <typename Handler, typename Function>
void spawn(BOOST_ASIO_MOVE_ARG(Handler) handler,
    BOOST_ASIO_MOVE_ARG(Function) function,
    const boost::coroutines::attributes& attributes)
{
  detail::spawn_helper<Handler, Function> helper;
  helper.data_.reset(
      new detail::spawn_data<Handler, Function>(
        BOOST_ASIO_MOVE_CAST(Handler)(handler), true,
        BOOST_ASIO_MOVE_CAST(Function)(function)));
  helper.attributes_ = attributes;
  boost_asio_handler_invoke_helpers::invoke(helper, helper.data_->handler_);
}

template <typename Handler, typename Function>
void spawn(basic_yield_context<Handler> ctx,
    BOOST_ASIO_MOVE_ARG(Function) function,
    const boost::coroutines::attributes& attributes)
{
  Handler handler(ctx.handler_); // Explicit copy that might be moved from.
  detail::spawn_helper<Handler, Function> helper;
  helper.data_.reset(
      new detail::spawn_data<Handler, Function>(
        BOOST_ASIO_MOVE_CAST(Handler)(handler), false,
        BOOST_ASIO_MOVE_CAST(Function)(function)));
  helper.attributes_ = attributes;
  boost_asio_handler_invoke_helpers::invoke(helper, helper.data_->handler_);
}

template <typename Function>
void spawn(boost::asio::io_service::strand strand,
    BOOST_ASIO_MOVE_ARG(Function) function,
    const boost::coroutines::attributes& attributes)
{
  boost::asio::spawn(strand.wrap(&detail::default_spawn_handler),
      BOOST_ASIO_MOVE_CAST(Function)(function), attributes);
}

template <typename Function>
void spawn(boost::asio::io_service& io_service,
    BOOST_ASIO_MOVE_ARG(Function) function,
    const boost::coroutines::attributes& attributes)
{
  boost::asio::spawn(boost::asio::io_service::strand(io_service),
      BOOST_ASIO_MOVE_CAST(Function)(function), attributes);
}

#endif // !defined(GENERATING_DOCUMENTATION)

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IMPL_SPAWN_HPP
