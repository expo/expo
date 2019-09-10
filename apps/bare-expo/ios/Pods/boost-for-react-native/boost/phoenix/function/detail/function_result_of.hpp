
#if !defined(BOOST_PHOENIX_DONT_USE_PREPROCESSED_FILES)
#ifndef BOOST_PHOENIX_FUNCTION_DETAIL_FUNCTION_RESULT_OF_HPP
#define BOOST_PHOENIX_FUNCTION_DETAIL_FUNCTION_RESULT_OF_HPP

#include <boost/phoenix/function/detail/preprocessed/function_result_of.hpp>

#endif
#else

#if !BOOST_PHOENIX_IS_ITERATING

#ifndef BOOST_PHOENIX_FUNCTION_DETAIL_FUNCTION_RESULT_OF_HPP
#define BOOST_PHOENIX_FUNCTION_DETAIL_FUNCTION_RESULT_OF_HPP

#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(preserve: 2, line: 0, output: "preprocessed/function_result_of_" BOOST_PHOENIX_LIMIT_STR ".hpp")
#endif

/*==============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/

#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(preserve: 1)
#endif

#define BOOST_PHOENIX_ITERATION_PARAMS                                          \
    (3, (1, BOOST_PHOENIX_ACTOR_LIMIT,                                          \
    <boost/phoenix/function/detail/function_result_of.hpp>))
#include PHOENIX_ITERATE()

#if defined(__WAVE__) && defined(BOOST_PHOENIX_CREATE_PREPROCESSED_FILES)
#pragma wave option(output: null)
#endif

#endif

#else

        template <typename F, BOOST_PHOENIX_typename_A>
        struct function<F, BOOST_PHOENIX_A>
            : proto::result_of::make_expr<
                proto::tag::function
              , phoenix_domain
              , F
              , BOOST_PHOENIX_A
            >
        {};

#endif

#endif // PHOENIX_DONT_USE_PREPROCESSED_FILES
