/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_X3_NO_CASE_STRING_PARSE_APR_18_2014_1125PM)
#define BOOST_SPIRIT_X3_NO_CASE_STRING_PARSE_APR_18_2014_1125PM

#include <boost/spirit/home/x3/char/char.hpp>
#include <boost/spirit/home/x3/support/traits/move_to.hpp>

namespace boost { namespace spirit { namespace x3 { namespace detail
{
    template <typename Char, typename Encoding>
    struct no_case_string
    {
        typedef std::basic_string< Char >  string_type;
        typedef typename string_type::const_iterator const_iterator;

        no_case_string(char_type const* str)
          : lower(str)
          , upper(str)
        {
            typename string_type::iterator loi = lower.begin();
            typename string_type::iterator upi = upper.begin();

            typedef typename Encoding::char_type encoded_char_type;
            Encoding encoding;
            for (; loi != lower.end(); ++loi, ++upi)
            {
                *loi = static_cast<char_type>(encoding.tolower(encoded_char_type(*loi)));
                *upi = static_cast<char_type>(encoding.toupper(encoded_char_type(*upi)));
            }
        }
        string_type lower;
        string_type upper;
        
    };

    template <typename String, typename Iterator, typename Attribute>
    inline bool no_case_string_parse(
        String const& str
      , Iterator& first, Iterator const& last, Attribute& attr)
    {
        typename String::const_iterator uc_i = str.upper.begin();
        typename String::const_iterator uc_last = str.upper.end();
        typename String::const_iterator lc_i = str.lower.begin();
        Iterator i = first;

        for (; uc_i != uc_last; ++uc_i, ++lc_i, ++i)
            if (i == last || ((*uc_i != *i) && (*lc_i != *i)))
                return false;
        x3::traits::move_to(first, i, attr);
        first = i;
        return true;
    }
}}}}

#endif
