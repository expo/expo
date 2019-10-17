/*=============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Eric Niebler
    Copyright (c) 2010 Thomas Heller
    Copyright (c) 2014 John Fletcher

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#ifndef BOOST_PHOENIX_CORE_ASSIGN_HPP
#define BOOST_PHOENIX_CORE_ASSIGN_HPP

    #define BOOST_PHOENIX_ACTOR_ASSIGN_CHILD(N)                                 \
        assign(                                                                 \
            proto::_child_c<N>                                                  \
          , proto::call<                                                        \
                proto::_child_c<N>(proto::_state)                               \
            >                                                                   \
        )                                                                       \
    /**/
    #define BOOST_PHOENIX_ACTOR_START_ASSIGN_CHILD(Z, N, D)                     \
       proto::and_<                                                             \
            BOOST_PHOENIX_ACTOR_ASSIGN_CHILD(N)                                 \
    /**/
    #define BOOST_PHOENIX_ACTOR_END_ASSIGN(Z, N, D)                             \
        >                                                                       \
    /**/
    #define BOOST_PHOENIX_ACTOR_ASSIGN_CALL(N)                                  \
           proto::when<                                                        \
                proto::nary_expr<proto::_ ,                                     \
                  BOOST_PP_ENUM_PARAMS(N, proto::_ BOOST_PP_INTERCEPT)          \
                >                                                               \
                , BOOST_PP_ENUM(                                                 \
                     N                                                          \
                  , BOOST_PHOENIX_ACTOR_START_ASSIGN_CHILD                     \
                  , _                                                          \
                 )                                                              \
                 BOOST_PP_REPEAT(                                               \
                     N                                                          \
                   , BOOST_PHOENIX_ACTOR_END_ASSIGN                             \
                   , _                                                          \
                 )                                                              \
            >                                                                   \
      /**/
    #define BOOST_PHOENIX_ACTOR_START_ASSIGN_CALL(Z, N, D)                      \
        proto::or_<                                                             \
            BOOST_PHOENIX_ACTOR_ASSIGN_CALL(N)                                  \
    /**/

#if !defined(BOOST_PHOENIX_DONT_USE_PREPROCESSED_FILES)
#include <boost/phoenix/core/detail/cpp03/preprocessed/assign.hpp>
#else
#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(preserve: 2, line: 0, output: "preprocessed/assign_" BOOST_PHOENIX_LIMIT_STR ".hpp")
#endif
/*==============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010-2011 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/

#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(preserve: 1)
#endif

        struct assign
            : BOOST_PP_ENUM_SHIFTED(
                  BOOST_PHOENIX_LIMIT
                , BOOST_PHOENIX_ACTOR_START_ASSIGN_CALL
                , _
              )
              , proto::when<
                    proto::terminal<proto::_>
                  , do_assign(proto::_, proto::_state)
                >
              BOOST_PP_REPEAT(
                  BOOST_PP_DEC(BOOST_PHOENIX_LIMIT)
                , BOOST_PHOENIX_ACTOR_END_ASSIGN
                , _
              )
        {};

#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(output: null)
#endif

#endif
    #undef BOOST_PHOENIX_ACTOR_ASSIGN_CALL
    #undef BOOST_PHOENIX_ACTOR_START_ASSIGN_CALL
    #undef BOOST_PHOENIX_ACTOR_END_ASSIGN_CALL
    #undef BOOST_PHOENIX_ACTOR_ASSIGN_CHILD
    #undef BOOST_PHOENIX_ACTOR_START_ASSIGN_CHILD
    #undef BOOST_PHOENIX_ACTOR_END_ASSIGN_CHILD
#endif

