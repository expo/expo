// Boost.Range library
//
//  Copyright Thorsten Ottosen 2006. Use, modification and
//  distribution is subject to the Boost Software License, Version
//  1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
// For more information, see http://www.boost.org/libs/range/
//

#ifndef BOOST_RANGE_AS_LITERAL_HPP
#define BOOST_RANGE_AS_LITERAL_HPP

#if defined(_MSC_VER)
# pragma once
#endif

#ifdef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
#include <boost/range/detail/as_literal.hpp>
#else

#include <boost/range/iterator_range.hpp>
#include <boost/range/detail/str_types.hpp>

#include <boost/detail/workaround.hpp>

#include <cstring>
#ifndef BOOST_NO_CWCHAR
#include <cwchar>
#endif

namespace boost
{
    namespace range_detail
    {
        inline std::size_t length( const char* s )
        {
            return strlen( s );
        }

#ifndef BOOST_NO_CWCHAR
        inline std::size_t length( const wchar_t* s )
        {
            return wcslen( s );
        }
#endif

        //
        // Remark: the compiler cannot choose between T* and T[sz]
        // overloads, so we must put the T* internal to the
        // unconstrained version.
        //

        inline bool is_char_ptr( char* )
        {
            return true;
        }

        inline bool is_char_ptr( const char* )
        {
            return true;
        }

#ifndef BOOST_NO_CWCHAR
        inline bool is_char_ptr( wchar_t* )
        {
            return true;
        }

        inline bool is_char_ptr( const wchar_t* )
        {
            return true;
        }
#endif

        template< class T >
        inline long is_char_ptr( const T& /* r */ )
        {
            return 0L;
        }

        template< class T >
        inline iterator_range<T*>
        make_range( T* const r, bool )
        {
            return iterator_range<T*>( r, r + length(r) );
        }

        template< class T >
        inline iterator_range<BOOST_DEDUCED_TYPENAME range_iterator<T>::type>
        make_range( T& r, long )
        {
            return boost::make_iterator_range( r );
        }

    }

    template< class Range >
    inline iterator_range<BOOST_DEDUCED_TYPENAME range_iterator<Range>::type>
    as_literal( Range& r )
    {
        return range_detail::make_range( r, range_detail::is_char_ptr(r) );
    }

    template< class Range >
    inline iterator_range<BOOST_DEDUCED_TYPENAME range_iterator<const Range>::type>
    as_literal( const Range& r )
    {
        return range_detail::make_range( r, range_detail::is_char_ptr(r) );
    }

    template< class Char, std::size_t sz >
    inline iterator_range<Char*> as_literal( Char (&arr)[sz] )
    {
        return range_detail::make_range( arr, range_detail::is_char_ptr(arr) );
    }

    template< class Char, std::size_t sz >
    inline iterator_range<const Char*> as_literal( const Char (&arr)[sz] )
    {
        return range_detail::make_range( arr, range_detail::is_char_ptr(arr) );
    }
}

#endif // BOOST_NO_FUNCTION_TEMPLATE_ORDERING

#endif
