#ifndef BOOST_METAPARSE_V1_IMPL_EMPTY_STRING_HPP
#define BOOST_METAPARSE_V1_IMPL_EMPTY_STRING_HPP

// Copyright Abel Sinkovics (abel@sinkovics.hu)  2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#include <boost/metaparse/config.hpp>

namespace boost
{
  namespace metaparse
  {
    namespace v1
    {
      namespace impl
      {
        template <class Ignore = int>
        struct empty_string
        {
          typedef empty_string type;

          #ifdef BOOST_NO_CONSTEXPR_C_STR
            static const char value[1];
          #else
            static constexpr char value[1] = {0};
          #endif
        };

        #ifdef BOOST_NO_CONSTEXPR_C_STR
          template <class Ignore>
          const char empty_string<Ignore>::value[1] = {0};
        #else
          template <class Ignore>
          constexpr char empty_string<Ignore>::value[1];
        #endif
      }
    }
  }
}

#endif

