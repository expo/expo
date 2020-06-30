// Circular buffer library header file.

// Copyright (c) 2003-2008 Jan Gaspar

// Use, modification, and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//  See www.boost.org/libs/circular_buffer for documentation.

#if !defined(BOOST_CIRCULAR_BUFFER_HPP)
#define BOOST_CIRCULAR_BUFFER_HPP

#if defined(_MSC_VER)
    #pragma once
#endif

#include <boost/circular_buffer_fwd.hpp>
#include <boost/detail/workaround.hpp>
#include <boost/static_assert.hpp>

// BOOST_CB_ENABLE_DEBUG: Debug support control.
#if !defined(BOOST_CB_ENABLE_DEBUG)
    #define BOOST_CB_ENABLE_DEBUG 0
#endif

// BOOST_CB_ASSERT: Runtime assertion.
#if BOOST_CB_ENABLE_DEBUG
    #include <boost/assert.hpp>
    #define BOOST_CB_ASSERT(Expr) BOOST_ASSERT(Expr)
#else
    #define BOOST_CB_ASSERT(Expr) ((void)0)
#endif

// BOOST_CB_IS_CONVERTIBLE: Check if Iterator::value_type is convertible to Type.
#if BOOST_WORKAROUND(__BORLANDC__, <= 0x0550) || BOOST_WORKAROUND(__MWERKS__, <= 0x2407)
    #define BOOST_CB_IS_CONVERTIBLE(Iterator, Type) ((void)0)
#else
    #include <boost/detail/iterator.hpp>
    #include <boost/type_traits/is_convertible.hpp>
    #define BOOST_CB_IS_CONVERTIBLE(Iterator, Type) \
        BOOST_STATIC_ASSERT((is_convertible<typename detail::iterator_traits<Iterator>::value_type, Type>::value))
#endif

// BOOST_CB_ASSERT_TEMPLATED_ITERATOR_CONSTRUCTORS:
// Check if the STL provides templated iterator constructors for its containers.
#if defined(BOOST_NO_TEMPLATED_ITERATOR_CONSTRUCTORS)
    #define BOOST_CB_ASSERT_TEMPLATED_ITERATOR_CONSTRUCTORS BOOST_STATIC_ASSERT(false);
#else
    #define BOOST_CB_ASSERT_TEMPLATED_ITERATOR_CONSTRUCTORS ((void)0);
#endif

#include <boost/circular_buffer/debug.hpp>
#include <boost/circular_buffer/details.hpp>
#include <boost/circular_buffer/base.hpp>
#include <boost/circular_buffer/space_optimized.hpp>

#undef BOOST_CB_ASSERT_TEMPLATED_ITERATOR_CONSTRUCTORS
#undef BOOST_CB_IS_CONVERTIBLE
#undef BOOST_CB_ASSERT

#endif // #if !defined(BOOST_CIRCULAR_BUFFER_HPP)
