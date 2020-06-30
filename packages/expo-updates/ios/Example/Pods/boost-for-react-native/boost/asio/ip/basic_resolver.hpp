//
// ip/basic_resolver.hpp
// ~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IP_BASIC_RESOLVER_HPP
#define BOOST_ASIO_IP_BASIC_RESOLVER_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <boost/asio/basic_io_object.hpp>
#include <boost/asio/detail/handler_type_requirements.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/ip/basic_resolver_iterator.hpp>
#include <boost/asio/ip/basic_resolver_query.hpp>
#include <boost/asio/ip/resolver_service.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ip {

/// Provides endpoint resolution functionality.
/**
 * The basic_resolver class template provides the ability to resolve a query
 * to a list of endpoints.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
template <typename InternetProtocol,
    typename ResolverService = resolver_service<InternetProtocol> >
class basic_resolver
  : public basic_io_object<ResolverService>
{
public:
  /// The protocol type.
  typedef InternetProtocol protocol_type;

  /// The endpoint type.
  typedef typename InternetProtocol::endpoint endpoint_type;

  /// The query type.
  typedef basic_resolver_query<InternetProtocol> query;

  /// The iterator type.
  typedef basic_resolver_iterator<InternetProtocol> iterator;

  /// Constructor.
  /**
   * This constructor creates a basic_resolver.
   *
   * @param io_service The io_service object that the resolver will use to
   * dispatch handlers for any asynchronous operations performed on the timer.
   */
  explicit basic_resolver(boost::asio::io_service& io_service)
    : basic_io_object<ResolverService>(io_service)
  {
  }

  /// Cancel any asynchronous operations that are waiting on the resolver.
  /**
   * This function forces the completion of any pending asynchronous
   * operations on the host resolver. The handler for each cancelled operation
   * will be invoked with the boost::asio::error::operation_aborted error code.
   */
  void cancel()
  {
    return this->service.cancel(this->implementation);
  }

  /// Perform forward resolution of a query to a list of entries.
  /**
   * This function is used to resolve a query into a list of endpoint entries.
   *
   * @param q A query object that determines what endpoints will be returned.
   *
   * @returns A forward-only iterator that can be used to traverse the list
   * of endpoint entries.
   *
   * @throws boost::system::system_error Thrown on failure.
   *
   * @note A default constructed iterator represents the end of the list.
   *
   * A successful call to this function is guaranteed to return at least one
   * entry.
   */
  iterator resolve(const query& q)
  {
    boost::system::error_code ec;
    iterator i = this->service.resolve(this->implementation, q, ec);
    boost::asio::detail::throw_error(ec, "resolve");
    return i;
  }

  /// Perform forward resolution of a query to a list of entries.
  /**
   * This function is used to resolve a query into a list of endpoint entries.
   *
   * @param q A query object that determines what endpoints will be returned.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns A forward-only iterator that can be used to traverse the list
   * of endpoint entries. Returns a default constructed iterator if an error
   * occurs.
   *
   * @note A default constructed iterator represents the end of the list.
   *
   * A successful call to this function is guaranteed to return at least one
   * entry.
   */
  iterator resolve(const query& q, boost::system::error_code& ec)
  {
    return this->service.resolve(this->implementation, q, ec);
  }

  /// Asynchronously perform forward resolution of a query to a list of entries.
  /**
   * This function is used to asynchronously resolve a query into a list of
   * endpoint entries.
   *
   * @param q A query object that determines what endpoints will be returned.
   *
   * @param handler The handler to be called when the resolve operation
   * completes. Copies will be made of the handler as required. The function
   * signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   resolver::iterator iterator             // Forward-only iterator that can
   *                                           // be used to traverse the list
   *                                           // of endpoint entries.
   * ); @endcode
   * Regardless of whether the asynchronous operation completes immediately or
   * not, the handler will not be invoked from within this function. Invocation
   * of the handler will be performed in a manner equivalent to using
   * boost::asio::io_service::post().
   *
   * @note A default constructed iterator represents the end of the list.
   *
   * A successful resolve operation is guaranteed to pass at least one entry to
   * the handler.
   */
  template <typename ResolveHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(ResolveHandler,
      void (boost::system::error_code, iterator))
  async_resolve(const query& q,
      BOOST_ASIO_MOVE_ARG(ResolveHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a ResolveHandler.
    BOOST_ASIO_RESOLVE_HANDLER_CHECK(
        ResolveHandler, handler, iterator) type_check;

    return this->service.async_resolve(this->implementation, q,
        BOOST_ASIO_MOVE_CAST(ResolveHandler)(handler));
  }

  /// Perform reverse resolution of an endpoint to a list of entries.
  /**
   * This function is used to resolve an endpoint into a list of endpoint
   * entries.
   *
   * @param e An endpoint object that determines what endpoints will be
   * returned.
   *
   * @returns A forward-only iterator that can be used to traverse the list
   * of endpoint entries.
   *
   * @throws boost::system::system_error Thrown on failure.
   *
   * @note A default constructed iterator represents the end of the list.
   *
   * A successful call to this function is guaranteed to return at least one
   * entry.
   */
  iterator resolve(const endpoint_type& e)
  {
    boost::system::error_code ec;
    iterator i = this->service.resolve(this->implementation, e, ec);
    boost::asio::detail::throw_error(ec, "resolve");
    return i;
  }

  /// Perform reverse resolution of an endpoint to a list of entries.
  /**
   * This function is used to resolve an endpoint into a list of endpoint
   * entries.
   *
   * @param e An endpoint object that determines what endpoints will be
   * returned.
   *
   * @param ec Set to indicate what error occurred, if any.
   *
   * @returns A forward-only iterator that can be used to traverse the list
   * of endpoint entries. Returns a default constructed iterator if an error
   * occurs.
   *
   * @note A default constructed iterator represents the end of the list.
   *
   * A successful call to this function is guaranteed to return at least one
   * entry.
   */
  iterator resolve(const endpoint_type& e, boost::system::error_code& ec)
  {
    return this->service.resolve(this->implementation, e, ec);
  }

  /// Asynchronously perform reverse resolution of an endpoint to a list of
  /// entries.
  /**
   * This function is used to asynchronously resolve an endpoint into a list of
   * endpoint entries.
   *
   * @param e An endpoint object that determines what endpoints will be
   * returned.
   *
   * @param handler The handler to be called when the resolve operation
   * completes. Copies will be made of the handler as required. The function
   * signature of the handler must be:
   * @code void handler(
   *   const boost::system::error_code& error, // Result of operation.
   *   resolver::iterator iterator             // Forward-only iterator that can
   *                                           // be used to traverse the list
   *                                           // of endpoint entries.
   * ); @endcode
   * Regardless of whether the asynchronous operation completes immediately or
   * not, the handler will not be invoked from within this function. Invocation
   * of the handler will be performed in a manner equivalent to using
   * boost::asio::io_service::post().
   *
   * @note A default constructed iterator represents the end of the list.
   *
   * A successful resolve operation is guaranteed to pass at least one entry to
   * the handler.
   */
  template <typename ResolveHandler>
  BOOST_ASIO_INITFN_RESULT_TYPE(ResolveHandler,
      void (boost::system::error_code, iterator))
  async_resolve(const endpoint_type& e,
      BOOST_ASIO_MOVE_ARG(ResolveHandler) handler)
  {
    // If you get an error on the following line it means that your handler does
    // not meet the documented type requirements for a ResolveHandler.
    BOOST_ASIO_RESOLVE_HANDLER_CHECK(
        ResolveHandler, handler, iterator) type_check;

    return this->service.async_resolve(this->implementation, e,
        BOOST_ASIO_MOVE_CAST(ResolveHandler)(handler));
  }
};

} // namespace ip
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IP_BASIC_RESOLVER_HPP
