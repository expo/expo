//
// windows/basic_object_handle.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
// Copyright (c) 2011 Boris Schaeling (boris@highscore.de)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_WINDOWS_BASIC_OBJECT_HANDLE_HPP
#define BOOST_ASIO_WINDOWS_BASIC_OBJECT_HANDLE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE) \
  || defined(GENERATING_DOCUMENTATION)

#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/windows/basic_handle.hpp>
#include <boost/asio/windows/object_handle_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace windows {

/// Provides object-oriented handle functionality.
/**
 * The windows::basic_object_handle class template provides asynchronous and
 * blocking object-oriented handle functionality.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
template <typename ObjectHandleService = object_handle_service>
class basic_object_handle
  : public basic_handle<ObjectHandleService>
{
public:
  /// The native representation of a handle.
  typedef typename ObjectHandleService::native_handle_type native_handle_type;

  /// Construct a basic_object_handle without opening it.
  /**
   * This constructor creates an object handle without opening it.
   *
   * @param io_service The io_service object that the object handle will use to
   * dispatch handlers for any asynchronous operations performed on the handle.
   */
  explicit basic_object_handle(boost::asio::io_service& io_service)
    : basic_handle<ObjectHandleService>(io_service)
  {
  }

  /// Construct a basic_object_handle on an existing native handle.
  /**
   * This constructor creates an object handle object to hold an existing native
   * handle.
   *
   * @param io_service The io_service object that the object handle will use to
   * dispatch handlers for any asynchronous operations performed on the handle.
   *
   * @param native_handle The new underlying handle implementation.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  basic_object_handle(boost::asio::io_service& io_service,
      const native_handle_type& native_handle)
    : basic_handle<ObjectHandleService>(io_service, native_handle)
  {
  }

#if defined(BOOST_ASIO_HAS_MOVE) || defined(GENERATING_DOCUMENTATION)
  /// Move-construct a basic_object_handle from another.
  /**
   * This constructor moves an object handle from one object to another.
   *
   * @param other The other basic_object_handle object from which the move will
   * occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_object_handle(io_service&) constructor.
   */
  basic_object_handle(basic_object_handle&& other)
    : basic_handle<ObjectHandleService>(
        BOOST_ASIO_MOVE_CAST(basic_object_handle)(other))
  {
  }

  /// Move-assign a basic_object_handle from another.
  /**
   * This assignment operator moves an object handle from one object to another.
   *
   * @param other The other basic_object_handle object from which the move will
   * occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_object_handle(io_service&) constructor.
   */
  basic_object_handle& operator=(basic_object_handle&& other)
  {
    basic_handle<ObjectHandleService>::operator=(
        BOOST_ASIO_MOVE_CAST(basic_object_handle)(other));
    return *this;
  }
#endif // defined(BOOST_ASIO_HAS_MOVE) || defined(GENERATING_DOCUMENTATION)

  /// Perform a blocking wait on the object handle.
  /**
   * This function is used to wait for the object handle to be set to the
   * signalled state. This function blocks and does not return until the object
   * handle has been set to the signalled state.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void wait()
  {
    boost::system::error_code ec;
    this->get_service().wait(this->get_implementation(), ec);
    boost::asio::detail::throw_error(ec, "wait");
  }

  /// Perform a blocking wait on the object handle.
  /**
   * This function is used to wait for the object handle to be set to the
   * signalled state. This function blocks and does not return until the object
   * handle has been set to the signalled state.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  void wait(boost::system::error_code& ec)
  {
    this->get_service().wait(this->get_implementation(), ec);
  }

  /// Start an asynchronous wait on the object handle.
  /**
   * This function is be used to initiate an asynchronous wait against the
   * object handle. It always returns immediately.
   *
   * @param handler The handler to be called when the object handle is set to
   * the signalled state. Copies will be made of the handler as required. The
   * function signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error // Result of operation.
   * ); @endcode
   * Regardless of whether the asynchronous operation completes immediately or
   * not, the handler will not be invoked from within this function. Invocation
   * of the handler will be performed in a manner equivalent to using
   * boost::asio::io_service::post().
   */
  template <typename WaitHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(WaitHandler,
      void (boost::system::error_code))
  async_wait(BOOST_ASIO_MOVE_ARG(WaitHandler) handler)
  {
    return this->get_service().async_wait(this->get_implementation(),
        BOOST_ASIO_MOVE_CAST(WaitHandler)(handler));
  }
};

} // namespace windows
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // defined(BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE)
       //   || defined(GENERATING_DOCUMENTATION)

#endif // BOOST_ASIO_WINDOWS_BASIC_OBJECT_HANDLE_HPP
