#ifndef BOOST_METAPARSE_V1_IMPL_SPLIT_AT_C_HPP
#define BOOST_METAPARSE_V1_IMPL_SPLIT_AT_C_HPP

// Copyright Abel Sinkovics (abel@sinkovics.hu)  2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#include <boost/metaparse/config.hpp>
#include <boost/metaparse/v1/fwd/string.hpp>
#include <boost/metaparse/v1/impl/push_front_c.hpp>

#include <boost/preprocessor/arithmetic/add.hpp>
#include <boost/preprocessor/arithmetic/sub.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/preprocessor/repetition/enum.hpp>
#include <boost/preprocessor/repetition/enum_params.hpp>
#include <boost/preprocessor/repetition/repeat.hpp>

#include <boost/mpl/pair.hpp>

namespace boost
{
  namespace metaparse
  {
    namespace v1
    {
      namespace impl
      {
        template <int N, class S>
        struct split_at_c;

#ifdef BOOST_METAPARSE_VARIADIC_STRING
        template <int N, char C, char... Cs>
        struct split_at_c<N, string<C, Cs...>> :
          boost::mpl::pair<
            typename push_front_c<
              typename split_at_c<N - 1, string<Cs...>>::type::first,
              C
            >::type,
            typename split_at_c<N - 1, string<Cs...>>::type::second
          >
        {};

        template <char C, char... Cs>
        struct split_at_c<0, string<C, Cs...>> :
          boost::mpl::pair<string<>, string<C, Cs...>>
        {};

        template <class S>
        struct split_at_c<0, S> : boost::mpl::pair<string<>, S> {};
#else
        #ifdef BOOST_METAPARSE_ARG
        #  error BOOST_METAPARSE_ARG already defined
        #endif
        #define BOOST_METAPARSE_ARG(z, n, d) BOOST_PP_CAT(C, BOOST_PP_ADD(n, d))

        #ifdef BOOST_METAPARSE_SPLIT_AT
        #  error BOOST_METAPARSE_SPLIT_AT already defined
        #endif
        #define BOOST_METAPARSE_SPLIT_AT(z, n, unused) \
          template < \
            BOOST_PP_ENUM_PARAMS(BOOST_METAPARSE_LIMIT_STRING_SIZE, int C) \
          > \
          struct \
            split_at_c< \
              n, \
              string<BOOST_PP_ENUM_PARAMS( \
                BOOST_METAPARSE_LIMIT_STRING_SIZE, C) \
              > \
            > : \
            boost::mpl::pair< \
              string<BOOST_PP_ENUM_PARAMS(n, C)>, \
              string< \
                BOOST_PP_ENUM( \
                  BOOST_PP_SUB(BOOST_METAPARSE_LIMIT_STRING_SIZE, n), \
                  BOOST_METAPARSE_ARG, \
                  n \
                ) \
              > \
            > \
          {};

        BOOST_PP_REPEAT(
          BOOST_METAPARSE_LIMIT_STRING_SIZE,
          BOOST_METAPARSE_SPLIT_AT,
          ~
        )

        #undef BOOST_METAPARSE_SPLIT_AT
        #undef BOOST_METAPARSE_ARG
#endif
      }
    }
  }
}

#endif

