/*==============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !BOOST_PHOENIX_IS_ITERATING

#ifndef BOOST_PHOENIX_OPERATOR_DETAIL_MEM_FUN_PTR_EVAL_RESULT_OF_HPP
#define BOOST_PHOENIX_OPERATOR_DETAIL_MEM_FUN_PTR_EVAL_RESULT_OF_HPP

#define BOOST_PHOENIX_MEM_FUN_PTR_EVAL_RESULT_OF_CHILD(Z, N, D)                 \
            typedef                                                             \
                typename                                                        \
                evaluator::impl<                                                \
                    BOOST_PP_CAT(A, N)                                          \
                  , Context                                                     \
                  , proto::empty_env                                            \
                >::result_type                                                  \
                BOOST_PP_CAT(child, N);                                         \
        /**/

        #define BOOST_PHOENIX_ITERATION_PARAMS                                  \
            (3, (2, BOOST_PHOENIX_LIMIT,                                        \
                 <boost/phoenix/operator/detail/mem_fun_ptr_eval_result_of.hpp>))
        #include BOOST_PHOENIX_ITERATE()

#undef BOOST_PHOENIX_MEM_FUN_PTR_EVAL_RESULT_OF_CHILD

#endif

#else

        template <typename Context, BOOST_PHOENIX_typename_A>
        struct mem_fun_ptr_eval<Context, BOOST_PHOENIX_A>
        {
            BOOST_PP_REPEAT(
                BOOST_PHOENIX_ITERATION
              , BOOST_PHOENIX_MEM_FUN_PTR_EVAL_RESULT_OF_CHILD
              , _
            )

            typedef
                typename boost::result_of<
                    child1(
                        BOOST_PP_ENUM_SHIFTED_PARAMS(
                            BOOST_PHOENIX_ITERATION
                          , child
                        )
                    )
                >::type
                type;
        };

#endif
