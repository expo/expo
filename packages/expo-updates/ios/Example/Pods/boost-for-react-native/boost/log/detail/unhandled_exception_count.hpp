/*
 *          Copyright Andrey Semashev 2007 - 2015.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   unhandled_exception_count.hpp
 * \author Andrey Semashev
 * \date   05.11.2012
 *
 * \brief  This header is the Boost.Log library implementation, see the library documentation
 *         at http://www.boost.org/doc/libs/release/libs/log/doc/html/index.html.
 */

#ifndef BOOST_LOG_DETAIL_UNHANDLED_EXCEPTION_COUNT_HPP_INCLUDED_
#define BOOST_LOG_DETAIL_UNHANDLED_EXCEPTION_COUNT_HPP_INCLUDED_

#include <boost/log/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

namespace aux {

//! Returns the number of currently pending exceptions
BOOST_LOG_API unsigned int unhandled_exception_count() BOOST_NOEXCEPT;

} // namespace aux

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#endif // BOOST_LOG_DETAIL_UNHANDLED_EXCEPTION_COUNT_HPP_INCLUDED_
