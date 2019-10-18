/*
 *          Copyright Andrey Semashev 2007 - 2014.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   intrusive_ref_counter.hpp
 * \author Andrey Semashev
 * \date   12.03.2009
 *
 * This header is deprecated, use boost/smart_ptr/intrusive_ref_counter.hpp instead. The header is left for
 * backward compatibility and will be removed in future versions.
 */

#ifndef BOOST_LOG_UTILITY_INTRUSIVE_REF_COUNTER_HPP_INCLUDED_
#define BOOST_LOG_UTILITY_INTRUSIVE_REF_COUNTER_HPP_INCLUDED_

#include <boost/smart_ptr/intrusive_ptr.hpp>
#include <boost/smart_ptr/intrusive_ref_counter.hpp>
#include <boost/log/detail/config.hpp>
#include <boost/log/detail/header.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if defined(__GNUC__)
#pragma message "Boost.Log: This header is deprecated, use boost/smart_ptr/intrusive_ref_counter.hpp instead."
#elif defined(_MSC_VER)
#pragma message("Boost.Log: This header is deprecated, use boost/smart_ptr/intrusive_ref_counter.hpp instead.")
#endif

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

namespace aux {

struct legacy_intrusive_ref_counter_root
{
    virtual ~legacy_intrusive_ref_counter_root() {}
};

} // namespace aux

typedef boost::intrusive_ref_counter< aux::legacy_intrusive_ref_counter_root > intrusive_ref_counter;

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#include <boost/log/detail/footer.hpp>

#endif // BOOST_LOG_UTILITY_INTRUSIVE_REF_COUNTER_HPP_INCLUDED_
