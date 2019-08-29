/*==============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#ifndef BOOST_PHOENIX_CORE_DETAIL_FUNCTION_EQUAL_HPP
#define BOOST_PHOENIX_CORE_DETAIL_FUNCTION_EQUAL_HPP

#include <boost/preprocessor/arithmetic/inc.hpp>
#include <boost/preprocessor/repetition/repeat_from_to.hpp>

#if !defined(BOOST_PHOENIX_DONT_USE_PREPROCESSED_FILES)
#include <boost/phoenix/core/detail/cpp03/preprocessed/function_equal.hpp>
#else
#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(preserve: 2, line: 0, output: "preprocessed/function_equal_" BOOST_PHOENIX_LIMIT_STR ".hpp")
#endif
/*==============================================================================
    Copyright (c) 2001-2010 Joel de Guzman
    Copyright (c) 2004 Daniel Wallin
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(preserve: 1)
#endif

                #define BOOST_PHOENIX_FUNCTION_EQUAL_R(Z, N, DATA)              \
                    && function_equal_()(                                       \
                            proto::child_c< N >(e1)                             \
                          , proto::child_c< N >(e2)                             \
                        )                                                       \
                /**/

                #define BOOST_PHOENIX_FUNCTION_EQUAL(Z, N, DATA)                \
                    template <typename Expr1>                                   \
                    result_type                                                 \
                    evaluate(                                                   \
                        Expr1 const& e1                                         \
                      , Expr1 const& e2                                         \
                      , mpl::long_< N >                                         \
                    ) const                                                     \
                    {                                                           \
                        return                                                  \
                            function_equal_()(                                  \
                                proto::child_c<0>(e1)                           \
                              , proto::child_c<0>(e2)                           \
                            )                                                   \
                            BOOST_PP_REPEAT_FROM_TO(                            \
                                1                                               \
                              , N                                               \
                              , BOOST_PHOENIX_FUNCTION_EQUAL_R                  \
                              , _                                               \
                            );                                                  \
                    }                                                           \
                /**/

                BOOST_PP_REPEAT_FROM_TO(
                    1
                  , BOOST_PP_INC(BOOST_PROTO_MAX_ARITY)
                  , BOOST_PHOENIX_FUNCTION_EQUAL
                  , _
                )
                #undef BOOST_PHOENIX_FUNCTION_EQUAL_R
                #undef BOOST_PHOENIX_FUNCTION_EQUAL

#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(output: null)
#endif
#endif

#endif

