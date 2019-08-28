// Copyright Daniel Wallin 2005. Use, modification and distribution is
// subject to the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_PARAMETER_FOR_EACH_051217_HPP
# define BOOST_PARAMETER_FOR_EACH_051217_HPP

# include <boost/preprocessor/cat.hpp>
# include <boost/preprocessor/detail/split.hpp>
# include <boost/preprocessor/logical/not.hpp>
# include <boost/preprocessor/facilities/is_empty.hpp>
# include <boost/preprocessor/tuple/eat.hpp>
# include <boost/preprocessor/arithmetic/inc.hpp>
# include <boost/preprocessor/repeat.hpp>
# include <boost/preprocessor/punctuation/comma_if.hpp>
# include <boost/preprocessor/for.hpp>
# include <boost/preprocessor/repetition/deduce_r.hpp>

# define BOOST_PARAMETER_FOR_EACH_head_aux2(x,y) (x,y), ~
# define BOOST_PARAMETER_FOR_EACH_head_aux3(x,y,z) (x,y,z), ~
# define BOOST_PARAMETER_FOR_EACH_head_aux4(x,y,z,u) (x,y,z,u), ~
# define BOOST_PARAMETER_FOR_EACH_head(n,x) \
    BOOST_PP_SPLIT(0, BOOST_PP_CAT(BOOST_PARAMETER_FOR_EACH_head_aux,n) x)

# define BOOST_PARAMETER_FOR_EACH_pred_aux_BOOST_PARAMETER_FOR_EACH_END_SENTINEL
# define BOOST_PARAMETER_FOR_EACH_pred_aux_check(x) \
    BOOST_PP_NOT(BOOST_PP_IS_EMPTY( \
        BOOST_PP_CAT(BOOST_PARAMETER_FOR_EACH_pred_aux_, x) \
    )), ~

# define BOOST_PARAMETER_FOR_EACH_pred_aux2(x,y) \
    BOOST_PARAMETER_FOR_EACH_pred_aux_check(x)
# define BOOST_PARAMETER_FOR_EACH_pred_aux3(x,y,z) \
    BOOST_PARAMETER_FOR_EACH_pred_aux_check(x)
# define BOOST_PARAMETER_FOR_EACH_pred_aux4(x,y,z,u) \
    BOOST_PARAMETER_FOR_EACH_pred_aux_check(x)

# define BOOST_PARAMETER_FOR_EACH_pred_aux0(n,x) \
    BOOST_PP_CAT(BOOST_PARAMETER_FOR_EACH_pred_aux,n) x

# if BOOST_PP_CONFIG_FLAGS() & BOOST_PP_CONFIG_MSVC()
#  define BOOST_PARAMETER_FOR_EACH_pred_SPLIT_FIRST(x) \
    BOOST_PP_SPLIT(0, x)

#  define BOOST_PARAMETER_FOR_EACH_pred(r, state) \
    BOOST_PARAMETER_FOR_EACH_pred_SPLIT_FIRST( \
        BOOST_PARAMETER_FOR_EACH_pred_aux0( \
            BOOST_PP_TUPLE_ELEM(5,3,state) \
          , BOOST_PP_TUPLE_ELEM(5,0,state) \
        ) \
    )
# else
#  define BOOST_PARAMETER_FOR_EACH_pred(r, state) \
    BOOST_PP_SPLIT( \
        0 \
      , BOOST_PARAMETER_FOR_EACH_pred_aux0( \
            BOOST_PP_TUPLE_ELEM(5,3,state) \
          , BOOST_PP_TUPLE_ELEM(5,0,state) \
        ) \
    )
# endif

# define BOOST_PARAMETER_FOR_EACH_op(r, state) \
    ( \
        BOOST_PP_TUPLE_EAT(BOOST_PP_TUPLE_ELEM(5,3,state)) \
          BOOST_PP_TUPLE_ELEM(5,0,state) \
      , BOOST_PP_TUPLE_ELEM(5,1,state) \
      , BOOST_PP_TUPLE_ELEM(5,2,state) \
      , BOOST_PP_TUPLE_ELEM(5,3,state) \
      , BOOST_PP_INC(BOOST_PP_TUPLE_ELEM(5,4,state)) \
    )

# define BOOST_PARAMETER_FOR_EACH_macro(r, state) \
    BOOST_PP_TUPLE_ELEM(5,2,state)( \
        r \
      , BOOST_PP_TUPLE_ELEM(5,4,state) \
      , BOOST_PARAMETER_FOR_EACH_head( \
            BOOST_PP_TUPLE_ELEM(5,3,state) \
          , BOOST_PP_TUPLE_ELEM(5,0,state) \
        ) \
      , BOOST_PP_TUPLE_ELEM(5,1,state) \
    )

# define BOOST_PARAMETER_FOR_EACH_build_end_sentinel(z,n,text) \
    BOOST_PP_COMMA_IF(n) BOOST_PARAMETER_FOR_EACH_END_SENTINEL
# define BOOST_PARAMETER_FOR_EACH_build_end_sentinel_tuple(arity) \
    ( \
        BOOST_PP_REPEAT(arity, BOOST_PARAMETER_FOR_EACH_build_end_sentinel, _) \
    )

# define BOOST_PARAMETER_FOR_EACH_R(r, arity, list, data, macro) \
    BOOST_PP_CAT(BOOST_PP_FOR_, r)( \
        (list BOOST_PARAMETER_FOR_EACH_build_end_sentinel_tuple(arity), data, macro, arity, 0) \
      , BOOST_PARAMETER_FOR_EACH_pred \
      , BOOST_PARAMETER_FOR_EACH_op \
      , BOOST_PARAMETER_FOR_EACH_macro \
    )

# define BOOST_PARAMETER_FOR_EACH(arity, list, data, macro) \
    BOOST_PARAMETER_FOR_EACH_R(BOOST_PP_DEDUCE_R(), arity, list, data, macro)

#endif // BOOST_PARAMETER_FOR_EACH_051217_HPP

