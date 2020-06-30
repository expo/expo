/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_UC_TYPES_NOVEMBER_23_2008_0840PM)
#define BOOST_SPIRIT_UC_TYPES_NOVEMBER_23_2008_0840PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/cstdint.hpp>
#include <boost/foreach.hpp>
#include <boost/regex/pending/unicode_iterator.hpp>
#include <boost/type_traits/make_unsigned.hpp>
#include <string>

namespace boost { namespace spirit
{
    typedef ::boost::uint32_t ucs4_char;
    typedef char utf8_char;
    typedef std::basic_string<ucs4_char> ucs4_string;
    typedef std::basic_string<utf8_char> utf8_string;

    template <typename Char>
    inline utf8_string to_utf8(Char value)
    {
        // always store as UTF8
        utf8_string result;
        typedef std::back_insert_iterator<utf8_string> insert_iter;
        insert_iter out_iter(result);
        utf8_output_iterator<insert_iter> utf8_iter(out_iter);
        typedef typename make_unsigned<Char>::type UChar;
        *utf8_iter = (UChar)value;
        return result;
    }

    template <typename Char>
    inline utf8_string to_utf8(Char const* str)
    {
        // always store as UTF8
        utf8_string result;
        typedef std::back_insert_iterator<utf8_string> insert_iter;
        insert_iter out_iter(result);
        utf8_output_iterator<insert_iter> utf8_iter(out_iter);
        typedef typename make_unsigned<Char>::type UChar;
        while (*str)
            *utf8_iter++ = (UChar)*str++;
        return result;
    }

    template <typename Char, typename Traits, typename Allocator>
    inline utf8_string 
    to_utf8(std::basic_string<Char, Traits, Allocator> const& str)
    {
        // always store as UTF8
        utf8_string result;
        typedef std::back_insert_iterator<utf8_string> insert_iter;
        insert_iter out_iter(result);
        utf8_output_iterator<insert_iter> utf8_iter(out_iter);
        typedef typename make_unsigned<Char>::type UChar;
        BOOST_FOREACH(Char ch, str)
        {
            *utf8_iter++ = (UChar)ch;
        }
        return result;
    }
}}

#endif
