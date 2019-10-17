//
// detail/handler_tracking.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_DETAIL_HANDLER_TRACKING_HPP
#define BOOST_ASIO_DETAIL_HANDLER_TRACKING_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_ENABLE_HANDLER_TRACKING)
# include <boost/system/error_code.hpp>
# include <boost/asio/detail/cstdint.hpp>
# include <boost/asio/detail/static_mutex.hpp>
# include <boost/asio/detail/tss_ptr.hpp>
#endif // defined(BOOST_ASIO_ENABLE_HANDLER_TRACKING)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

#if defined(BOOST_ASIO_ENABLE_HANDLER_TRACKING)

class handler_tracking
{
public:
  class completion;

  // Base class for objects containing tracked handlers.
  class tracked_handler
  {
  private:
    // Only the handler_tracking class will have access to the id.
    friend class handler_tracking;
    friend class completion;
    uint64_t id_;

  protected:
    // Constructor initialises with no id.
    tracked_handler() : id_(0) {}

    // Prevent deletion through this type.
    ~tracked_handler() {}
  };

  // Initialise the tracking system.
  BOOST_ASIO_DECL static void init();

  // Record the creation of a tracked handler.
  BOOST_ASIO_DECL static void creation(tracked_handler* h,
      const char* object_type, void* object, const char* op_name);

  class completion
  {
  public:
    // Constructor records that handler is to be invoked with no arguments.
    BOOST_ASIO_DECL explicit completion(tracked_handler* h);

    // Destructor records only when an exception is thrown from the handler, or
    // if the memory is being freed without the handler having been invoked.
    BOOST_ASIO_DECL ~completion();

    // Records that handler is to be invoked with no arguments.
    BOOST_ASIO_DECL void invocation_begin();

    // Records that handler is to be invoked with one arguments.
    BOOST_ASIO_DECL void invocation_begin(const boost::system::error_code& ec);

    // Constructor records that handler is to be invoked with two arguments.
    BOOST_ASIO_DECL void invocation_begin(
        const boost::system::error_code& ec, std::size_t bytes_transferred);

    // Constructor records that handler is to be invoked with two arguments.
    BOOST_ASIO_DECL void invocation_begin(
        const boost::system::error_code& ec, int signal_number);

    // Constructor records that handler is to be invoked with two arguments.
    BOOST_ASIO_DECL void invocation_begin(
        const boost::system::error_code& ec, const char* arg);

    // Record that handler invocation has ended.
    BOOST_ASIO_DECL void invocation_end();

  private:
    friend class handler_tracking;
    uint64_t id_;
    bool invoked_;
    completion* next_;
  };

  // Record an operation that affects pending handlers.
  BOOST_ASIO_DECL static void operation(const char* object_type,
      void* object, const char* op_name);

  // Write a line of output.
  BOOST_ASIO_DECL static void write_line(const char* format, ...);

private:
  struct tracking_state;
  BOOST_ASIO_DECL static tracking_state* get_state();
};

# define BOOST_ASIO_INHERIT_TRACKED_HANDLER \
  : public boost::asio::detail::handler_tracking::tracked_handler

# define BOOST_ASIO_ALSO_INHERIT_TRACKED_HANDLER \
  , public boost::asio::detail::handler_tracking::tracked_handler

# define BOOST_ASIO_HANDLER_TRACKING_INIT \
  boost::asio::detail::handler_tracking::init()

# define BOOST_ASIO_HANDLER_CREATION(args) \
  boost::asio::detail::handler_tracking::creation args

# define BOOST_ASIO_HANDLER_COMPLETION(args) \
  boost::asio::detail::handler_tracking::completion tracked_completion args

# define BOOST_ASIO_HANDLER_INVOCATION_BEGIN(args) \
  tracked_completion.invocation_begin args

# define BOOST_ASIO_HANDLER_INVOCATION_END \
  tracked_completion.invocation_end()

# define BOOST_ASIO_HANDLER_OPERATION(args) \
  boost::asio::detail::handler_tracking::operation args

#else // defined(BOOST_ASIO_ENABLE_HANDLER_TRACKING)

# define BOOST_ASIO_INHERIT_TRACKED_HANDLER
# define BOOST_ASIO_ALSO_INHERIT_TRACKED_HANDLER
# define BOOST_ASIO_HANDLER_TRACKING_INIT (void)0
# define BOOST_ASIO_HANDLER_CREATION(args) (void)0
# define BOOST_ASIO_HANDLER_COMPLETION(args) (void)0
# define BOOST_ASIO_HANDLER_INVOCATION_BEGIN(args) (void)0
# define BOOST_ASIO_HANDLER_INVOCATION_END (void)0
# define BOOST_ASIO_HANDLER_OPERATION(args) (void)0

#endif // defined(BOOST_ASIO_ENABLE_HANDLER_TRACKING)

} // namespace detail
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#if defined(BOOST_ASIO_HEADER_ONLY)
# include <boost/asio/detail/impl/handler_tracking.ipp>
#endif // defined(BOOST_ASIO_HEADER_ONLY)

#endif // BOOST_ASIO_DETAIL_HANDLER_TRACKING_HPP
