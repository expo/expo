// Copyright David Abrahams, Daniel Wallin 2003. Use, modification and 
// distribution is subject to the Boost Software License, Version 1.0. 
// (See accompanying file LICENSE_1_0.txt or copy at 
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_PARAMETER_MACROS_050412_HPP
#define BOOST_PARAMETER_MACROS_050412_HPP

#include <boost/preprocessor/tuple/elem.hpp>
#include <boost/preprocessor/repetition/repeat_from_to.hpp>
#include <boost/preprocessor/arithmetic/inc.hpp>
#include <boost/preprocessor/logical/bool.hpp>
#include <boost/preprocessor/punctuation/comma_if.hpp>
#include <boost/preprocessor/control/expr_if.hpp>
#include <boost/preprocessor/repetition/enum_params.hpp>
#include <boost/preprocessor/repetition/enum_binary_params.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/detail/workaround.hpp>

#define BOOST_PARAMETER_FUN_TEMPLATE_HEAD1(n) \
    template<BOOST_PP_ENUM_PARAMS(n, class T)>

#define BOOST_PARAMETER_FUN_TEMPLATE_HEAD0(n)

#if ! defined(BOOST_NO_SFINAE) && ! BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x592)) 

# define BOOST_PARAMETER_MATCH_TYPE(n, param)           \
            BOOST_PP_EXPR_IF(n, typename) param::match  \
            <                                           \
                BOOST_PP_ENUM_PARAMS(n, T)              \
            >::type 

#else

# define BOOST_PARAMETER_MATCH_TYPE(n, param) param

#endif

#define BOOST_PARAMETER_FUN_DECL(z, n, params)                                      \
                                                                                    \
    BOOST_PP_CAT(BOOST_PARAMETER_FUN_TEMPLATE_HEAD, BOOST_PP_BOOL(n))(n)            \
                                                                                    \
    BOOST_PP_TUPLE_ELEM(3, 0, params)                                               \
        BOOST_PP_TUPLE_ELEM(3, 1, params)(                                          \
            BOOST_PP_ENUM_BINARY_PARAMS(n, T, const& p)                             \
            BOOST_PP_COMMA_IF(n)                                                    \
            BOOST_PARAMETER_MATCH_TYPE(n,BOOST_PP_TUPLE_ELEM(3, 2, params))         \
            kw = BOOST_PP_TUPLE_ELEM(3, 2, params)()                                \
        )                                                                           \
    {                                                                               \
        return BOOST_PP_CAT(BOOST_PP_TUPLE_ELEM(3, 1, params), _with_named_params)( \
            kw(BOOST_PP_ENUM_PARAMS(n, p))                                          \
        );                                                                          \
    }

// Generates:
//
// template<class Params>
// ret name ## _with_named_params(Params const&);
//
// template<class T0>
// ret name(T0 const& p0, typename parameters::match<T0>::type kw = parameters())
// {
//     return name ## _with_named_params(kw(p0));
// }
//
// template<class T0, ..., class TN>
// ret name(T0 const& p0, ..., TN const& PN
//    , typename parameters::match<T0, ..., TN>::type kw = parameters())
// {
//     return name ## _with_named_params(kw(p0, ..., pN));
// }
//
// template<class Params>
// ret name ## _with_named_params(Params const&)
//
// lo and hi determines the min and max arity of the generated functions.

#define BOOST_PARAMETER_FUN(ret, name, lo, hi, parameters)                          \
                                                                                    \
    template<class Params>                                                          \
    ret BOOST_PP_CAT(name, _with_named_params)(Params const& p);                    \
                                                                                    \
    BOOST_PP_REPEAT_FROM_TO(                                                        \
        lo, BOOST_PP_INC(hi), BOOST_PARAMETER_FUN_DECL, (ret, name, parameters))    \
                                                                                    \
    template<class Params>                                                          \
    ret BOOST_PP_CAT(name, _with_named_params)(Params const& p)

#define BOOST_PARAMETER_MEMFUN(ret, name, lo, hi, parameters)                       \
                                                                                    \
    BOOST_PP_REPEAT_FROM_TO(                                                        \
        lo, BOOST_PP_INC(hi), BOOST_PARAMETER_FUN_DECL, (ret, name, parameters))    \
                                                                                    \
    template<class Params>                                                          \
    ret BOOST_PP_CAT(name, _with_named_params)(Params const& p)

#endif // BOOST_PARAMETER_MACROS_050412_HPP

