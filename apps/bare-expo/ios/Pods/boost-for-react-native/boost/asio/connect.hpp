//
// connect.hpp
// ~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_CONNECT_HPP
#define BOOST_ASIO_CONNECT_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <boost/asio/async_result.hpp>
#include <boost/asio/basic_socket.hpp>
#include <boost/asio/error.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

/**
 * @defgroup connect boost::asio::connect
 *
 * @brief Establishes a socket connection by trying each endpoint in a sequence.
 */
/*@{*/

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @throws boost::system::system_error Thrown on failure. If the sequence is
 * empty, the associated @c error_code is boost::asio::error::not_found.
 * Otherwise, contains the error from the last connection attempt.
 *
 * @note This overload assumes that a default constructed object of type @c
 * Iterator represents the end of the sequence. This is a valid assumption for
 * iterator types such as @c boost::asio::ip::tcp::resolver::iterator.
 *
 * @par Example
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 * boost::asio::connect(s, r.resolve(q)); @endcode
 */
template <typename Protocol, typename SocketService, typename Iterator>
Iterator connect(basic_socket<Protocol, SocketService>& s, Iterator begin);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param ec Set to indicate what error occurred, if any. If the sequence is
 * empty, set to boost::asio::error::not_found. Otherwise, contains the error
 * from the last connection attempt.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @note This overload assumes that a default constructed object of type @c
 * Iterator represents the end of the sequence. This is a valid assumption for
 * iterator types such as @c boost::asio::ip::tcp::resolver::iterator.
 *
 * @par Example
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 * boost::system::error_code ec;
 * boost::asio::connect(s, r.resolve(q), ec);
 * if (ec)
 * {
 *   // An error occurred.
 * } @endcode
 */
template <typename Protocol, typename SocketService, typename Iterator>
Iterator connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, boost::system::error_code& ec);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param end An iterator pointing to the end of a sequence of endpoints.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @throws boost::system::system_error Thrown on failure. If the sequence is
 * empty, the associated @c error_code is boost::asio::error::not_found.
 * Otherwise, contains the error from the last connection attempt.
 *
 * @par Example
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::resolver::iterator i = r.resolve(q), end;
 * tcp::socket s(io_service);
 * boost::asio::connect(s, i, end); @endcode
 */
template <typename Protocol, typename SocketService, typename Iterator>
Iterator connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, Iterator end);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param end An iterator pointing to the end of a sequence of endpoints.
 *
 * @param ec Set to indicate what error occurred, if any. If the sequence is
 * empty, set to boost::asio::error::not_found. Otherwise, contains the error
 * from the last connection attempt.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @par Example
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::resolver::iterator i = r.resolve(q), end;
 * tcp::socket s(io_service);
 * boost::system::error_code ec;
 * boost::asio::connect(s, i, end, ec);
 * if (ec)
 * {
 *   // An error occurred.
 * } @endcode
 */
template <typename Protocol, typename SocketService, typename Iterator>
Iterator connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, Iterator end, boost::system::error_code& ec);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param connect_condition A function object that is called prior to each
 * connection attempt. The signature of the function object must be:
 * @code Iterator connect_condition(
 *     const boost::system::error_code& ec,
 *     Iterator next); @endcode
 * The @c ec parameter contains the result from the most recent connect
 * operation. Before the first connection attempt, @c ec is always set to
 * indicate success. The @c next parameter is an iterator pointing to the next
 * endpoint to be tried. The function object should return the next iterator,
 * but is permitted to return a different iterator so that endpoints may be
 * skipped. The implementation guarantees that the function object will never
 * be called with the end iterator.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @throws boost::system::system_error Thrown on failure. If the sequence is
 * empty, the associated @c error_code is boost::asio::error::not_found.
 * Otherwise, contains the error from the last connection attempt.
 *
 * @note This overload assumes that a default constructed object of type @c
 * Iterator represents the end of the sequence. This is a valid assumption for
 * iterator types such as @c boost::asio::ip::tcp::resolver::iterator.
 *
 * @par Example
 * The following connect condition function object can be used to output
 * information about the individual connection attempts:
 * @code struct my_connect_condition
 * {
 *   template <typename Iterator>
 *   Iterator operator()(
 *       const boost::system::error_code& ec,
 *       Iterator next)
 *   {
 *     if (ec) std::cout << "Error: " << ec.message() << std::endl;
 *     std::cout << "Trying: " << next->endpoint() << std::endl;
 *     return next;
 *   }
 * }; @endcode
 * It would be used with the boost::asio::connect function as follows:
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 * tcp::resolver::iterator i = boost::asio::connect(
 *     s, r.resolve(q), my_connect_condition());
 * std::cout << "Connected to: " << i->endpoint() << std::endl; @endcode
 */
template <typename Protocol, typename SocketService,
    typename Iterator, typename ConnectCondition>
Iterator connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, ConnectCondition connect_condition);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param connect_condition A function object that is called prior to each
 * connection attempt. The signature of the function object must be:
 * @code Iterator connect_condition(
 *     const boost::system::error_code& ec,
 *     Iterator next); @endcode
 * The @c ec parameter contains the result from the most recent connect
 * operation. Before the first connection attempt, @c ec is always set to
 * indicate success. The @c next parameter is an iterator pointing to the next
 * endpoint to be tried. The function object should return the next iterator,
 * but is permitted to return a different iterator so that endpoints may be
 * skipped. The implementation guarantees that the function object will never
 * be called with the end iterator.
 *
 * @param ec Set to indicate what error occurred, if any. If the sequence is
 * empty, set to boost::asio::error::not_found. Otherwise, contains the error
 * from the last connection attempt.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @note This overload assumes that a default constructed object of type @c
 * Iterator represents the end of the sequence. This is a valid assumption for
 * iterator types such as @c boost::asio::ip::tcp::resolver::iterator.
 *
 * @par Example
 * The following connect condition function object can be used to output
 * information about the individual connection attempts:
 * @code struct my_connect_condition
 * {
 *   template <typename Iterator>
 *   Iterator operator()(
 *       const boost::system::error_code& ec,
 *       Iterator next)
 *   {
 *     if (ec) std::cout << "Error: " << ec.message() << std::endl;
 *     std::cout << "Trying: " << next->endpoint() << std::endl;
 *     return next;
 *   }
 * }; @endcode
 * It would be used with the boost::asio::connect function as follows:
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 * boost::system::error_code ec;
 * tcp::resolver::iterator i = boost::asio::connect(
 *     s, r.resolve(q), my_connect_condition(), ec);
 * if (ec)
 * {
 *   // An error occurred.
 * }
 * else
 * {
 *   std::cout << "Connected to: " << i->endpoint() << std::endl;
 * } @endcode
 */
template <typename Protocol, typename SocketService,
    typename Iterator, typename ConnectCondition>
Iterator connect(basic_socket<Protocol, SocketService>& s, Iterator begin,
    ConnectCondition connect_condition, boost::system::error_code& ec);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param end An iterator pointing to the end of a sequence of endpoints.
 *
 * @param connect_condition A function object that is called prior to each
 * connection attempt. The signature of the function object must be:
 * @code Iterator connect_condition(
 *     const boost::system::error_code& ec,
 *     Iterator next); @endcode
 * The @c ec parameter contains the result from the most recent connect
 * operation. Before the first connection attempt, @c ec is always set to
 * indicate success. The @c next parameter is an iterator pointing to the next
 * endpoint to be tried. The function object should return the next iterator,
 * but is permitted to return a different iterator so that endpoints may be
 * skipped. The implementation guarantees that the function object will never
 * be called with the end iterator.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @throws boost::system::system_error Thrown on failure. If the sequence is
 * empty, the associated @c error_code is boost::asio::error::not_found.
 * Otherwise, contains the error from the last connection attempt.
 *
 * @par Example
 * The following connect condition function object can be used to output
 * information about the individual connection attempts:
 * @code struct my_connect_condition
 * {
 *   template <typename Iterator>
 *   Iterator operator()(
 *       const boost::system::error_code& ec,
 *       Iterator next)
 *   {
 *     if (ec) std::cout << "Error: " << ec.message() << std::endl;
 *     std::cout << "Trying: " << next->endpoint() << std::endl;
 *     return next;
 *   }
 * }; @endcode
 * It would be used with the boost::asio::connect function as follows:
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::resolver::iterator i = r.resolve(q), end;
 * tcp::socket s(io_service);
 * i = boost::asio::connect(s, i, end, my_connect_condition());
 * std::cout << "Connected to: " << i->endpoint() << std::endl; @endcode
 */
template <typename Protocol, typename SocketService,
    typename Iterator, typename ConnectCondition>
Iterator connect(basic_socket<Protocol, SocketService>& s, Iterator begin,
    Iterator end, ConnectCondition connect_condition);

/// Establishes a socket connection by trying each endpoint in a sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c connect member
 * function, once for each endpoint in the sequence, until a connection is
 * successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param end An iterator pointing to the end of a sequence of endpoints.
 *
 * @param connect_condition A function object that is called prior to each
 * connection attempt. The signature of the function object must be:
 * @code Iterator connect_condition(
 *     const boost::system::error_code& ec,
 *     Iterator next); @endcode
 * The @c ec parameter contains the result from the most recent connect
 * operation. Before the first connection attempt, @c ec is always set to
 * indicate success. The @c next parameter is an iterator pointing to the next
 * endpoint to be tried. The function object should return the next iterator,
 * but is permitted to return a different iterator so that endpoints may be
 * skipped. The implementation guarantees that the function object will never
 * be called with the end iterator.
 *
 * @param ec Set to indicate what error occurred, if any. If the sequence is
 * empty, set to boost::asio::error::not_found. Otherwise, contains the error
 * from the last connection attempt.
 *
 * @returns On success, an iterator denoting the successfully connected
 * endpoint. Otherwise, the end iterator.
 *
 * @par Example
 * The following connect condition function object can be used to output
 * information about the individual connection attempts:
 * @code struct my_connect_condition
 * {
 *   template <typename Iterator>
 *   Iterator operator()(
 *       const boost::system::error_code& ec,
 *       Iterator next)
 *   {
 *     if (ec) std::cout << "Error: " << ec.message() << std::endl;
 *     std::cout << "Trying: " << next->endpoint() << std::endl;
 *     return next;
 *   }
 * }; @endcode
 * It would be used with the boost::asio::connect function as follows:
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::resolver::iterator i = r.resolve(q), end;
 * tcp::socket s(io_service);
 * boost::system::error_code ec;
 * i = boost::asio::connect(s, i, end, my_connect_condition(), ec);
 * if (ec)
 * {
 *   // An error occurred.
 * }
 * else
 * {
 *   std::cout << "Connected to: " << i->endpoint() << std::endl;
 * } @endcode
 */
template <typename Protocol, typename SocketService,
    typename Iterator, typename ConnectCondition>
Iterator connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, Iterator end, ConnectCondition connect_condition,
    boost::system::error_code& ec);

/*@}*/

/**
 * @defgroup async_connect boost::asio::async_connect
 *
 * @brief Asynchronously establishes a socket connection by trying each
 * endpoint in a sequence.
 */
/*@{*/

/// Asynchronously establishes a socket connection by trying each endpoint in a
/// sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c async_connect
 * member function, once for each endpoint in the sequence, until a connection
 * is successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param handler The handler to be called when the connect operation
 * completes. Copies will be made of the handler as required. The function
 * signature of the handler must be:
 * @code void handler(
 *   // Result of operation. if the sequence is empty, set to
 *   // boost::asio::error::not_found. Otherwise, contains the
 *   // error from the last connection attempt.
 *   const boost::system::error_code& error,
 *
 *   // On success, an iterator denoting the successfully
 *   // connected endpoint. Otherwise, the end iterator.
 *   Iterator iterator
 * ); @endcode
 * Regardless of whether the asynchronous operation completes immediately or
 * not, the handler will not be invoked from within this function. Invocation
 * of the handler will be performed in a manner equivalent to using
 * boost::asio::io_service::post().
 *
 * @note This overload assumes that a default constructed object of type @c
 * Iterator represents the end of the sequence. This is a valid assumption for
 * iterator types such as @c boost::asio::ip::tcp::resolver::iterator.
 *
 * @par Example
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 *
 * // ...
 *
 * r.async_resolve(q, resolve_handler);
 *
 * // ...
 *
 * void resolve_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   if (!ec)
 *   {
 *     boost::asio::async_connect(s, i, connect_handler);
 *   }
 * }
 *
 * // ...
 *
 * void connect_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   // ...
 * } @endcode
 */
template <typename Protocol, typename SocketService,
    typename Iterator, typename ComposedConnectHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ComposedConnectHandler,
    void (boost::system::error_code, Iterator))
async_connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, BOOST_ASIO_MOVE_ARG(ComposedConnectHandler) handler);

/// Asynchronously establishes a socket connection by trying each endpoint in a
/// sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c async_connect
 * member function, once for each endpoint in the sequence, until a connection
 * is successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param end An iterator pointing to the end of a sequence of endpoints.
 *
 * @param handler The handler to be called when the connect operation
 * completes. Copies will be made of the handler as required. The function
 * signature of the handler must be:
 * @code void handler(
 *   // Result of operation. if the sequence is empty, set to
 *   // boost::asio::error::not_found. Otherwise, contains the
 *   // error from the last connection attempt.
 *   const boost::system::error_code& error,
 *
 *   // On success, an iterator denoting the successfully
 *   // connected endpoint. Otherwise, the end iterator.
 *   Iterator iterator
 * ); @endcode
 * Regardless of whether the asynchronous operation completes immediately or
 * not, the handler will not be invoked from within this function. Invocation
 * of the handler will be performed in a manner equivalent to using
 * boost::asio::io_service::post().
 *
 * @par Example
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 *
 * // ...
 *
 * r.async_resolve(q, resolve_handler);
 *
 * // ...
 *
 * void resolve_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   if (!ec)
 *   {
 *     tcp::resolver::iterator end;
 *     boost::asio::async_connect(s, i, end, connect_handler);
 *   }
 * }
 *
 * // ...
 *
 * void connect_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   // ...
 * } @endcode
 */
template <typename Protocol, typename SocketService,
    typename Iterator, typename ComposedConnectHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ComposedConnectHandler,
    void (boost::system::error_code, Iterator))
async_connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, Iterator end,
    BOOST_ASIO_MOVE_ARG(ComposedConnectHandler) handler);

/// Asynchronously establishes a socket connection by trying each endpoint in a
/// sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c async_connect
 * member function, once for each endpoint in the sequence, until a connection
 * is successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param connect_condition A function object that is called prior to each
 * connection attempt. The signature of the function object must be:
 * @code Iterator connect_condition(
 *     const boost::system::error_code& ec,
 *     Iterator next); @endcode
 * The @c ec parameter contains the result from the most recent connect
 * operation. Before the first connection attempt, @c ec is always set to
 * indicate success. The @c next parameter is an iterator pointing to the next
 * endpoint to be tried. The function object should return the next iterator,
 * but is permitted to return a different iterator so that endpoints may be
 * skipped. The implementation guarantees that the function object will never
 * be called with the end iterator.
 *
 * @param handler The handler to be called when the connect operation
 * completes. Copies will be made of the handler as required. The function
 * signature of the handler must be:
 * @code void handler(
 *   // Result of operation. if the sequence is empty, set to
 *   // boost::asio::error::not_found. Otherwise, contains the
 *   // error from the last connection attempt.
 *   const boost::system::error_code& error,
 *
 *   // On success, an iterator denoting the successfully
 *   // connected endpoint. Otherwise, the end iterator.
 *   Iterator iterator
 * ); @endcode
 * Regardless of whether the asynchronous operation completes immediately or
 * not, the handler will not be invoked from within this function. Invocation
 * of the handler will be performed in a manner equivalent to using
 * boost::asio::io_service::post().
 *
 * @note This overload assumes that a default constructed object of type @c
 * Iterator represents the end of the sequence. This is a valid assumption for
 * iterator types such as @c boost::asio::ip::tcp::resolver::iterator.
 *
 * @par Example
 * The following connect condition function object can be used to output
 * information about the individual connection attempts:
 * @code struct my_connect_condition
 * {
 *   template <typename Iterator>
 *   Iterator operator()(
 *       const boost::system::error_code& ec,
 *       Iterator next)
 *   {
 *     if (ec) std::cout << "Error: " << ec.message() << std::endl;
 *     std::cout << "Trying: " << next->endpoint() << std::endl;
 *     return next;
 *   }
 * }; @endcode
 * It would be used with the boost::asio::connect function as follows:
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 *
 * // ...
 *
 * r.async_resolve(q, resolve_handler);
 *
 * // ...
 *
 * void resolve_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   if (!ec)
 *   {
 *     boost::asio::async_connect(s, i,
 *         my_connect_condition(),
 *         connect_handler);
 *   }
 * }
 *
 * // ...
 *
 * void connect_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   if (ec)
 *   {
 *     // An error occurred.
 *   }
 *   else
 *   {
 *     std::cout << "Connected to: " << i->endpoint() << std::endl;
 *   }
 * } @endcode
 */
template <typename Protocol, typename SocketService, typename Iterator,
    typename ConnectCondition, typename ComposedConnectHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ComposedConnectHandler,
    void (boost::system::error_code, Iterator))
async_connect(basic_socket<Protocol, SocketService>& s, Iterator begin,
    ConnectCondition connect_condition,
    BOOST_ASIO_MOVE_ARG(ComposedConnectHandler) handler);

/// Asynchronously establishes a socket connection by trying each endpoint in a
/// sequence.
/**
 * This function attempts to connect a socket to one of a sequence of
 * endpoints. It does this by repeated calls to the socket's @c async_connect
 * member function, once for each endpoint in the sequence, until a connection
 * is successfully established.
 *
 * @param s The socket to be connected. If the socket is already open, it will
 * be closed.
 *
 * @param begin An iterator pointing to the start of a sequence of endpoints.
 *
 * @param end An iterator pointing to the end of a sequence of endpoints.
 *
 * @param connect_condition A function object that is called prior to each
 * connection attempt. The signature of the function object must be:
 * @code Iterator connect_condition(
 *     const boost::system::error_code& ec,
 *     Iterator next); @endcode
 * The @c ec parameter contains the result from the most recent connect
 * operation. Before the first connection attempt, @c ec is always set to
 * indicate success. The @c next parameter is an iterator pointing to the next
 * endpoint to be tried. The function object should return the next iterator,
 * but is permitted to return a different iterator so that endpoints may be
 * skipped. The implementation guarantees that the function object will never
 * be called with the end iterator.
 *
 * @param handler The handler to be called when the connect operation
 * completes. Copies will be made of the handler as required. The function
 * signature of the handler must be:
 * @code void handler(
 *   // Result of operation. if the sequence is empty, set to
 *   // boost::asio::error::not_found. Otherwise, contains the
 *   // error from the last connection attempt.
 *   const boost::system::error_code& error,
 *
 *   // On success, an iterator denoting the successfully
 *   // connected endpoint. Otherwise, the end iterator.
 *   Iterator iterator
 * ); @endcode
 * Regardless of whether the asynchronous operation completes immediately or
 * not, the handler will not be invoked from within this function. Invocation
 * of the handler will be performed in a manner equivalent to using
 * boost::asio::io_service::post().
 *
 * @par Example
 * The following connect condition function object can be used to output
 * information about the individual connection attempts:
 * @code struct my_connect_condition
 * {
 *   template <typename Iterator>
 *   Iterator operator()(
 *       const boost::system::error_code& ec,
 *       Iterator next)
 *   {
 *     if (ec) std::cout << "Error: " << ec.message() << std::endl;
 *     std::cout << "Trying: " << next->endpoint() << std::endl;
 *     return next;
 *   }
 * }; @endcode
 * It would be used with the boost::asio::connect function as follows:
 * @code tcp::resolver r(io_service);
 * tcp::resolver::query q("host", "service");
 * tcp::socket s(io_service);
 *
 * // ...
 *
 * r.async_resolve(q, resolve_handler);
 *
 * // ...
 *
 * void resolve_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   if (!ec)
 *   {
 *     tcp::resolver::iterator end;
 *     boost::asio::async_connect(s, i, end,
 *         my_connect_condition(),
 *         connect_handler);
 *   }
 * }
 *
 * // ...
 *
 * void connect_handler(
 *     const boost::system::error_code& ec,
 *     tcp::resolver::iterator i)
 * {
 *   if (ec)
 *   {
 *     // An error occurred.
 *   }
 *   else
 *   {
 *     std::cout << "Connected to: " << i->endpoint() << std::endl;
 *   }
 * } @endcode
 */
template <typename Protocol, typename SocketService, typename Iterator,
    typename ConnectCondition, typename ComposedConnectHandler>
BOOST_ASIO_INITFN_RESULT_TYPE(ComposedConnectHandler,
    void (boost::system::error_code, Iterator))
async_connect(basic_socket<Protocol, SocketService>& s,
    Iterator begin, Iterator end, ConnectCondition connect_condition,
    BOOST_ASIO_MOVE_ARG(ComposedConnectHandler) handler);

/*@}*/

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#include <boost/asio/impl/connect.hpp>

#endif
