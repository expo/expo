//
// handler_type.hpp
// ~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_HANDLER_TYPE_HPP
#define BOOST_ASIO_HANDLER_TYPE_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

/// Default handler type traits provided for all handlers.
/**
 * The handler_type traits class is used for determining the concrete handler
 * type to be used for an asynchronous operation. It allows the handler type to
 * be determined at the point where the specific completion handler signature
 * is known.
 *
 * This template may be specialised for user-defined handler types.
 */
template <typename Handler, typename Signature>
struct handler_type
{
  /// The handler type for the specific signature.
  typedef Handler type;
};

#if !defined(GENERATING_DOCUMENTATION)

template <typename Handler, typename Signature>
struct handler_type<const Handler, Signature>
  : handler_type<Handler, Signature> {};

template <typename Handler, typename Signature>
struct handler_type<volatile Handler, Signature>
  : handler_type<Handler, Signature> {};

template <typename Handler, typename Signature>
struct handler_type<const volatile Handler, Signature>
  : handler_type<Handler, Signature> {};

template <typename Handler, typename Signature>
struct handler_type<const Handler&, Signature>
  : handler_type<Handler, Signature> {};

template <typename Handler, typename Signature>
struct handler_type<volatile Handler&, Signature>
  : handler_type<Handler, Signature> {};

template <typename Handler, typename Signature>
struct handler_type<const volatile Handler&, Signature>
  : handler_type<Handler, Signature> {};

template <typename Handler, typename Signature>
struct handler_type<Handler&, Signature>
  : handler_type<Handler, Signature> {};

#if defined(BOOST_ASIO_HAS_MOVE)
template <typename Handler, typename Signature>
struct handler_type<Handler&&, Signature>
  : handler_type<Handler, Signature> {};
#endif // defined(BOOST_ASIO_HAS_MOVE)

template <typename ReturnType, typename Signature>
struct handler_type<ReturnType(), Signature>
  : handler_type<ReturnType(*)(), Signature> {};

template <typename ReturnType, typename Arg1, typename Signature>
struct handler_type<ReturnType(Arg1), Signature>
  : handler_type<ReturnType(*)(Arg1), Signature> {};

template <typename ReturnType, typename Arg1, typename Arg2, typename Signature>
struct handler_type<ReturnType(Arg1, Arg2), Signature>
  : handler_type<ReturnType(*)(Arg1, Arg2), Signature> {};

template <typename ReturnType, typename Arg1, typename Arg2, typename Arg3,
    typename Signature>
struct handler_type<ReturnType(Arg1, Arg2, Arg3), Signature>
  : handler_type<ReturnType(*)(Arg1, Arg2, Arg3), Signature> {};

template <typename ReturnType, typename Arg1, typename Arg2, typename Arg3,
    typename Arg4, typename Signature>
struct handler_type<ReturnType(Arg1, Arg2, Arg3, Arg4), Signature>
  : handler_type<ReturnType(*)(Arg1, Arg2, Arg3, Arg4), Signature> {};

template <typename ReturnType, typename Arg1, typename Arg2, typename Arg3,
    typename Arg4, typename Arg5, typename Signature>
struct handler_type<ReturnType(Arg1, Arg2, Arg3, Arg4, Arg5), Signature>
  : handler_type<ReturnType(*)(Arg1, Arg2, Arg3, Arg4, Arg5), Signature> {};

#endif // !defined(GENERATING_DOCUMENTATION)

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#define BOOST_ASIO_HANDLER_TYPE(h, sig) \
  typename handler_type<h, sig>::type

#endif // BOOST_ASIO_HANDLER_TYPE_HPP
