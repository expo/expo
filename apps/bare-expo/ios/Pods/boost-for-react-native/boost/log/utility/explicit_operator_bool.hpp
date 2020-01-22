/*
 *          Copyright Andrey Semashev 2007 - 2014.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   explicit_operator_bool.hpp
 * \author Andrey Semashev
 * \date   08.03.2009
 *
 * This header is deprecated, use boost/utility/explicit_operator_bool.hpp instead. The header is left for
 * backward compatibility and will be removed in future versions.
 */

#ifndef BOOST_LOG_UTILITY_EXPLICIT_OPERATOR_BOOL_HPP_INCLUDED_
#define BOOST_LOG_UTILITY_EXPLICIT_OPERATOR_BOOL_HPP_INCLUDED_

#include <boost/utility/explicit_operator_bool.hpp>
#include <boost/log/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if defined(__GNUC__)
#pragma message "Boost.Log: This header is deprecated, use boost/utility/explicit_operator_bool.hpp instead."
#elif defined(_MSC_VER)
#pragma message("Boost.Log: This header is deprecated, use boost/utility/explicit_operator_bool.hpp instead.")
#endif

/*!
 * \brief The macro defines an explicit operator of conversion to \c bool
 *
 * The macro should be used inside the definition of a class that has to
 * support the conversion. The class should also implement <tt>operator!</tt>,
 * in terms of which the conversion operator will be implemented.
 */
#define BOOST_LOG_EXPLICIT_OPERATOR_BOOL()\
    BOOST_EXPLICIT_OPERATOR_BOOL()

#endif // BOOST_LOG_UTILITY_EXPLICIT_OPERATOR_BOOL_HPP_INCLUDED_
