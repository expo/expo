/*
 *          Copyright Andrey Semashev 2007 - 2014.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   empty_deleter.hpp
 * \author Andrey Semashev
 * \date   22.04.2007
 *
 * This header is deprecated, use boost/utility/empty_deleter.hpp instead. The header is left for
 * backward compatibility and will be removed in future versions.
 */

#ifndef BOOST_LOG_UTILITY_EMPTY_DELETER_HPP_INCLUDED_
#define BOOST_LOG_UTILITY_EMPTY_DELETER_HPP_INCLUDED_

#include <boost/core/null_deleter.hpp>
#include <boost/log/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if defined(__GNUC__)
#pragma message "Boost.Log: This header is deprecated, use boost/core/null_deleter.hpp instead."
#elif defined(_MSC_VER)
#pragma message("Boost.Log: This header is deprecated, use boost/core/null_deleter.hpp instead.")
#endif

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

typedef boost::null_deleter empty_deleter;

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#endif // BOOST_LOG_UTILITY_EMPTY_DELETER_HPP_INCLUDED_
