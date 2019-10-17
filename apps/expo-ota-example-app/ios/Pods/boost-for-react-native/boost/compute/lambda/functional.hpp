//---------------------------------------------------------------------------//
// Copyright (c) 2013 Kyle Lutz <kyle.r.lutz@gmail.com>
//
// Distributed under the Boost Software License, Version 1.0
// See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt
//
// See http://boostorg.github.com/compute for more information.
//---------------------------------------------------------------------------//

#ifndef BOOST_COMPUTE_LAMBDA_FUNCTIONAL_HPP
#define BOOST_COMPUTE_LAMBDA_FUNCTIONAL_HPP

#include <boost/tuple/tuple.hpp>
#include <boost/lexical_cast.hpp>

#include <boost/proto/core.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/preprocessor/stringize.hpp>

#include <boost/compute/functional/get.hpp>
#include <boost/compute/lambda/result_of.hpp>
#include <boost/compute/lambda/placeholder.hpp>

namespace boost {
namespace compute {
namespace lambda {

namespace mpl = boost::mpl;
namespace proto = boost::proto;

// wraps a unary boolean function
#define BOOST_COMPUTE_LAMBDA_WRAP_BOOLEAN_UNARY_FUNCTION(name) \
    namespace detail { \
        struct BOOST_PP_CAT(name, _func) \
        { \
            template<class Expr, class Args> \
            struct lambda_result \
            { \
                typedef int type; \
            }; \
            \
            template<class Context, class Arg> \
            static void apply(Context &ctx, const Arg &arg) \
            { \
                ctx.stream << #name << "("; \
                proto::eval(arg, ctx); \
                ctx.stream << ")"; \
            } \
        }; \
    } \
    template<class Arg> \
    inline typename proto::result_of::make_expr< \
        proto::tag::function, BOOST_PP_CAT(detail::name, _func), const Arg& \
    >::type const \
    name(const Arg &arg) \
    { \
        return proto::make_expr<proto::tag::function>( \
            BOOST_PP_CAT(detail::name, _func)(), ::boost::ref(arg) \
        ); \
    }

// wraps a unary function who's return type is the same as the argument type
#define BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(name) \
    namespace detail { \
        struct BOOST_PP_CAT(name, _func) \
        { \
            template<class Expr, class Args> \
            struct lambda_result \
            { \
                typedef typename proto::result_of::child_c<Expr, 1>::type Arg1; \
                typedef typename ::boost::compute::lambda::result_of<Arg1, Args>::type type; \
            }; \
            \
            template<class Context, class Arg> \
            static void apply(Context &ctx, const Arg &arg) \
            { \
                ctx.stream << #name << "("; \
                proto::eval(arg, ctx); \
                ctx.stream << ")"; \
            } \
        }; \
    } \
    template<class Arg> \
    inline typename proto::result_of::make_expr< \
        proto::tag::function, BOOST_PP_CAT(detail::name, _func), const Arg& \
    >::type const \
    name(const Arg &arg) \
    { \
        return proto::make_expr<proto::tag::function>( \
            BOOST_PP_CAT(detail::name, _func)(), ::boost::ref(arg) \
        ); \
    }

// wraps a binary function
#define BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION(name) \
    namespace detail { \
        struct BOOST_PP_CAT(name, _func) \
        { \
            template<class Expr, class Args> \
            struct lambda_result \
            { \
                typedef typename proto::result_of::child_c<Expr, 1>::type Arg1; \
                typedef typename ::boost::compute::lambda::result_of<Arg1, Args>::type type; \
            }; \
            \
            template<class Context, class Arg1, class Arg2> \
            static void apply(Context &ctx, const Arg1 &arg1, const Arg2 &arg2) \
            { \
                ctx.stream << #name << "("; \
                proto::eval(arg1, ctx); \
                ctx.stream << ", "; \
                proto::eval(arg2, ctx); \
                ctx.stream << ")"; \
            } \
        }; \
    } \
    template<class Arg1, class Arg2> \
    inline typename proto::result_of::make_expr< \
        proto::tag::function, BOOST_PP_CAT(detail::name, _func), const Arg1&, const Arg2& \
    >::type const \
    name(const Arg1 &arg1, const Arg2 &arg2) \
    { \
        return proto::make_expr<proto::tag::function>( \
            BOOST_PP_CAT(detail::name, _func)(), ::boost::ref(arg1), ::boost::ref(arg2) \
        ); \
    }

// wraps a binary function who's result type is the scalar type of the first argument
#define BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION_ST(name) \
    namespace detail { \
        struct BOOST_PP_CAT(name, _func) \
        { \
            template<class Expr, class Args> \
            struct lambda_result \
            { \
                typedef typename proto::result_of::child_c<Expr, 1>::type Arg1; \
                typedef typename ::boost::compute::lambda::result_of<Arg1, Args>::type result_type; \
                typedef typename ::boost::compute::scalar_type<result_type>::type type; \
            }; \
            \
            template<class Context, class Arg1, class Arg2> \
            static void apply(Context &ctx, const Arg1 &arg1, const Arg2 &arg2) \
            { \
                ctx.stream << #name << "("; \
                proto::eval(arg1, ctx); \
                ctx.stream << ", "; \
                proto::eval(arg2, ctx); \
                ctx.stream << ")"; \
            } \
        }; \
    } \
    template<class Arg1, class Arg2> \
    inline typename proto::result_of::make_expr< \
        proto::tag::function, BOOST_PP_CAT(detail::name, _func), const Arg1&, const Arg2& \
    >::type const \
    name(const Arg1 &arg1, const Arg2 &arg2) \
    { \
        return proto::make_expr<proto::tag::function>( \
            BOOST_PP_CAT(detail::name, _func)(), ::boost::ref(arg1), ::boost::ref(arg2) \
        ); \
    }

// wraps a ternary function
#define BOOST_COMPUTE_LAMBDA_WRAP_TERNARY_FUNCTION(name) \
    namespace detail { \
        struct BOOST_PP_CAT(name, _func) \
        { \
            template<class Expr, class Args> \
            struct lambda_result \
            { \
                typedef typename proto::result_of::child_c<Expr, 1>::type Arg1; \
                typedef typename ::boost::compute::lambda::result_of<Arg1, Args>::type type; \
            }; \
            \
            template<class Context, class Arg1, class Arg2, class Arg3> \
            static void apply(Context &ctx, const Arg1 &arg1, const Arg2 &arg2, const Arg3 &arg3) \
            { \
                ctx.stream << #name << "("; \
                proto::eval(arg1, ctx); \
                ctx.stream << ", "; \
                proto::eval(arg2, ctx); \
                ctx.stream << ", "; \
                proto::eval(arg3, ctx); \
                ctx.stream << ")"; \
            } \
        }; \
    } \
    template<class Arg1, class Arg2, class Arg3> \
    inline typename proto::result_of::make_expr< \
        proto::tag::function, BOOST_PP_CAT(detail::name, _func), const Arg1&, const Arg2&, const Arg3& \
    >::type const \
    name(const Arg1 &arg1, const Arg2 &arg2, const Arg3 &arg3) \
    { \
        return proto::make_expr<proto::tag::function>( \
            BOOST_PP_CAT(detail::name, _func)(), ::boost::ref(arg1), ::boost::ref(arg2), ::boost::ref(arg3) \
        ); \
    }


BOOST_COMPUTE_LAMBDA_WRAP_BOOLEAN_UNARY_FUNCTION(all)
BOOST_COMPUTE_LAMBDA_WRAP_BOOLEAN_UNARY_FUNCTION(any)
BOOST_COMPUTE_LAMBDA_WRAP_BOOLEAN_UNARY_FUNCTION(isinf)
BOOST_COMPUTE_LAMBDA_WRAP_BOOLEAN_UNARY_FUNCTION(isnan)
BOOST_COMPUTE_LAMBDA_WRAP_BOOLEAN_UNARY_FUNCTION(isfinite)

BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(abs)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(cos)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(acos)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(sin)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(asin)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(tan)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(atan)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(sqrt)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(rsqrt)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(exp)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(exp2)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(exp10)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(log)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(log2)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(log10)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(round)
BOOST_COMPUTE_LAMBDA_WRAP_UNARY_FUNCTION_T(length)

BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION(cross)
BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION(pow)
BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION(pown)
BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION(powr)

BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION_ST(dot)
BOOST_COMPUTE_LAMBDA_WRAP_BINARY_FUNCTION_ST(distance)

BOOST_COMPUTE_LAMBDA_WRAP_TERNARY_FUNCTION(clamp)
BOOST_COMPUTE_LAMBDA_WRAP_TERNARY_FUNCTION(fma)
BOOST_COMPUTE_LAMBDA_WRAP_TERNARY_FUNCTION(mad)
BOOST_COMPUTE_LAMBDA_WRAP_TERNARY_FUNCTION(smoothstep)

} // end lambda namespace
} // end compute namespace
} // end boost namespace

#endif // BOOST_COMPUTE_LAMBDA_FUNCTIONAL_HPP
