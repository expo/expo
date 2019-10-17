#ifndef BOOST_METAPARSE_V1_IMPL_REMOVE_TRAILING_NO_CHARS_HPP
#define BOOST_METAPARSE_V1_IMPL_REMOVE_TRAILING_NO_CHARS_HPP

// Copyright Abel Sinkovics (abel@sinkovics.hu)  2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#include <boost/metaparse/config.hpp>
#include <boost/metaparse/v1/string.hpp>
#include <boost/metaparse/v1/impl/push_front_c.hpp>

namespace boost
{
  namespace metaparse
  {
    namespace v1
    {
      namespace impl
      {
        template <class S>
        struct remove_trailing_no_chars : S {};

#ifdef BOOST_METAPARSE_VARIADIC_STRING
        // this code assumes that BOOST_NO_CHARs are at the end of the string
        template <char... Cs>
        struct remove_trailing_no_chars<string<BOOST_NO_CHAR, Cs...>> :
          string<>
        {};

        template <char C, char... Cs>
        struct remove_trailing_no_chars<string<C, Cs...>> :
          push_front_c<typename remove_trailing_no_chars<string<Cs...>>::type,C>
        {};

#ifdef _MSC_VER
        /*
         * These specialisations are needed to avoid an internal compiler error
         * in Visual C++ 12
         */
        template <char C>
        struct remove_trailing_no_chars<string<C>> : string<C> {};

        template <>
        struct remove_trailing_no_chars<string<BOOST_NO_CHAR>> : string<> {};

        template <>
        struct remove_trailing_no_chars<string<>> : string<> {};
#endif
#endif
      }
    }
  }
}

#endif

