//
// windows/basic_handle.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_WINDOWS_BASIC_HANDLE_HPP
#define BOOST_ASIO_WINDOWS_BASIC_HANDLE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if defined(BOOST_ASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE) \
  || defined(BOOST_ASIO_HAS_WINDOWS_STREAM_HANDLE) \
  || defined(BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE) \
  || defined(GENERATING_DOCUMENTATION)

#include <boost/asio/basic_io_object.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace windows {

/// Provides Windows handle functionality.
/**
 * The windows::basic_handle class template provides the ability to wrap a
 * Windows handle.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
template <typename HandleService>
class basic_handle
  : public basic_io_object<HandleService>
{
public:
  /// (Deprecated: Use native_handle_type.) The native representation of a
  /// handle.
  typedef typename HandleService::native_handle_type native_type;

  /// The native representation of a handle.
  typedef typename HandleService::native_handle_type native_handle_type;

  /// A basic_handle is always the lowest layer.
  typedef basic_handle<HandleService> lowest_layer_type;

  /// Construct a basic_handle without opening it.
  /**
   * This constructor creates a handle without opening it.
   *
   * @param io_service The io_service object that the handle will use to
   * dispatch handlers for any asynchronous operations performed on the handle.
   */
  explicit basic_handle(boost::asio::io_service& io_service)
    : basic_io_object<HandleService>(io_service)
  {
  }

  /// Construct a basic_handle on an existing native handle.
  /**
   * This constructor creates a handle object to hold an existing native handle.
   *
   * @param io_service The io_service object that the handle will use to
   * dispatch handlers for any asynchronous operations performed on the handle.
   *
   * @param handle A native handle.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  basic_handle(boost::asio::io_service& io_service,
      const native_handle_type& handle)
    : basic_io_object<HandleService>(io_service)
  {
    boost::system::error_code ec;
    this->get_service().assign(this->get_implementation(), handle, ec);
    boost::asio::detail::throw_error(ec, "assign");
  }

#if defined(BOOST_ASIO_HAS_MOVE) || defined(GENERATING_DOCUMENTATION)
  /// Move-construct a basic_handle from another.
  /**
   * This constructor moves a handle from one object to another.
   *
   * @param other The other basic_handle object from which the move will occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_handle(io_service&) constructor.
   */
  basic_handle(basic_handle&& other)
    : basic_io_object<HandleService>(
        BOOST_ASIO_MOVE_CAST(basic_handle)(other))
  {
  }

  /// Move-assign a basic_handle from another.
  /**
   * This assignment operator moves a handle from one object to another.
   *
   * @param other The other basic_handle object from which the move will occur.
   *
   * @note Following the move, the moved-from object is in the same state as if
   * constructed using the @c basic_handle(io_service&) constructor.
   */
  basic_handle& operator=(basic_handle&& other)
  {
    basic_io_object<HandleService>::operator=(
        BOOST_ASIO_MOVE_CAST(basic_handle)(other));
    return *this;
  }
#endif // defined(BOOST_ASIO_HAS_MOVE) || defined(GENERATING_DOCUMENTATION)

  /// Get a reference to the lowest layer.
  /**
   * This function returns a reference to the lowest layer in a stack of
   * layers. Since a basic_handle cannot contain any further layers, it simply
   * returns a reference to itself.
   *
   * @return A reference to the lowest layer in the stack of layers. Ownership
   * is not transferred to the caller.
   */
  lowest_layer_type& lowest_layer()
  {
    return *this;
  }

  /// Get a const reference to the lowest layer.
  /**
   * This function returns a const reference to the lowest layer in a stack of
   * layers. Since a basic_handle cannot contain any further layers, it simply
   * returns a reference to itself.
   *
   * @return A const reference to the lowest layer in the stack of layers.
   * Ownership is not transferred to the caller.
   */
  const lowest_layer_type& lowest_layer() const
  {
    return *this;
  }

  /// Assign an existing native handle to the handle.
  /*
   * This function opens the handle to hold an existing native handle.
   *
   * @param handle A native handle.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void assign(const native_handle_type& handle)
  {
    boost::system::error_code ec;
    this->get_service().assign(this->get_implementation(), handle, ec);
    boost::asio::detail::throw_error(ec, "assign");
  }

  /// Assign an existing native handle to the handle.
  /*
   * This function opens the handle to hold an existing native handle.
   *
   * @param handle A native handle.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code assign(const native_handle_type& handle,
      boost::system::error_code& ec)
  {
    return this->get_service().assign(this->get_implementation(), handle, ec);
  }

  /// Determine whether the handle is open.
  bool is_open() const
  {
    return this->get_service().is_open(this->get_implementation());
  }

  /// Close the handle.
  /**
   * This function is used to close the handle. Any asynchronous read or write
   * operations will be cancelled immediately, and will complete with the
   * boost::asio::error::operation_aborted error.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void close()
  {
    boost::system::error_code ec;
    this->get_service().close(this->get_implementation(), ec);
    boost::asio::detail::throw_error(ec, "close");
  }

  /// Close the handle.
  /**
   * This function is used to close the handle. Any asynchronous read or write
   * operations will be cancelled immediately, and will complete with the
   * boost::asio::error::operation_aborted error.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code close(boost::system::error_code& ec)
  {
    return this->get_service().close(this->get_implementation(), ec);
  }

  /// (Deprecated: Use native_handle().) Get the native handle representation.
  /**
   * This function may be used to obtain the underlying representation of the
   * handle. This is intended to allow access to native handle functionality
   * that is not otherwise provided.
   */
  native_type native()
  {
    return this->get_service().native_handle(this->get_implementation());
  }

  /// Get the native handle representation.
  /**
   * This function may be used to obtain the underlying representation of the
   * handle. This is intended to allow access to native handle functionality
   * that is not otherwise provided.
   */
  native_handle_type native_handle()
  {
    return this->get_service().native_handle(this->get_implementation());
  }

  /// Cancel all asynchronous operations associated with the handle.
  /**
   * This function causes all outstanding asynchronous read or write operations
   * to finish immediately, and the handlers for cancelled operations will be
   * passed the boost::asio::error::operation_aborted error.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void cancel()
  {
    boost::system::error_code ec;
    this->get_service().cancel(this->get_implementation(), ec);
    boost::asio::detail::throw_error(ec, "cancel");
  }

  /// Cancel all asynchronous operations associated with the handle.
  /**
   * This function causes all outstanding asynchronous read or write operations
   * to finish immediately, and the handlers for cancelled operations will be
   * passed the boost::asio::error::operation_aborted error.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code cancel(boost::system::error_code& ec)
  {
    return this->get_service().cancel(this->get_implementation(), ec);
  }

protected:
  /// Protected destructor to prevent deletion through this type.
  ~basic_handle()
  {
  }
};

} // namespace windows
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // defined(BOOST_ASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE)
       //   || defined(BOOST_ASIO_HAS_WINDOWS_STREAM_HANDLE)
       //   || defined(BOOST_ASIO_HAS_WINDOWS_OBJECT_HANDLE)
       //   || defined(GENERATING_DOCUMENTATION)

#endif // BOOST_ASIO_WINDOWS_BASIC_HANDLE_HPP
