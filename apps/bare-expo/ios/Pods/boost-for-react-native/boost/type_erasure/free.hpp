// Boost.TypeErasure library
//
// Copyright 2012 Steven Watanabe
//
// Distributed under the Boost Software License Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// $Id$

#ifndef BOOST_TYPE_ERASURE_FREE_HPP_INCLUDED
#define BOOST_TYPE_ERASURE_FREE_HPP_INCLUDED

#include <boost/detail/workaround.hpp>
#include <boost/preprocessor/repetition/enum.hpp>
#include <boost/preprocessor/repetition/enum_trailing.hpp>
#include <boost/preprocessor/repetition/enum_params.hpp>
#include <boost/preprocessor/repetition/enum_shifted_params.hpp>
#include <boost/preprocessor/repetition/enum_params_with_a_default.hpp>
#include <boost/preprocessor/repetition/enum_binary_params.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/type_traits/remove_reference.hpp>
#include <boost/type_traits/remove_cv.hpp>
#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/identity.hpp>
#include <boost/mpl/int.hpp>
#include <boost/mpl/next.hpp>
#include <boost/type_erasure/detail/macro.hpp>
#include <boost/type_erasure/detail/const.hpp>
#include <boost/type_erasure/config.hpp>
#include <boost/type_erasure/derived.hpp>
#include <boost/type_erasure/rebind_any.hpp>
#include <boost/type_erasure/param.hpp>
#include <boost/type_erasure/is_placeholder.hpp>
#include <boost/type_erasure/call.hpp>
#include <boost/type_erasure/concept_interface.hpp>

#if defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES) || \
    defined(BOOST_NO_CXX11_RVALUE_REFERENCES) || \
    defined(BOOST_TYPE_ERASURE_DOXYGEN) || \
    BOOST_WORKAROUND(BOOST_MSVC, == 1800)

namespace boost {
namespace type_erasure {
namespace detail {

template<BOOST_PP_ENUM_PARAMS_WITH_A_DEFAULT(BOOST_TYPE_ERASURE_MAX_ARITY, class T, void)>
struct first_placeholder {
    typedef typename ::boost::mpl::eval_if<is_placeholder<T0>,
        ::boost::mpl::identity<T0>,
        first_placeholder<BOOST_PP_ENUM_SHIFTED_PARAMS(BOOST_TYPE_ERASURE_MAX_ARITY, T)>
    >::type type;
};

template<>
struct first_placeholder<> {};

template<BOOST_PP_ENUM_PARAMS_WITH_A_DEFAULT(BOOST_TYPE_ERASURE_MAX_ARITY, class T, void)>
struct first_placeholder_index :
    ::boost::mpl::eval_if<is_placeholder<T0>,
        ::boost::mpl::int_<0>,
        ::boost::mpl::next<first_placeholder_index<BOOST_PP_ENUM_SHIFTED_PARAMS(BOOST_TYPE_ERASURE_MAX_ARITY, T)> >
    >::type
{};

}
}
}

/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_QUALIFIED_ID(seq, N) \
    BOOST_TYPE_ERASURE_QUALIFIED_NAME(seq)<R(BOOST_PP_ENUM_PARAMS(N, T))>

/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_UNQUALIFIED_PARAM_TYPE(z, n, data) \
    typename ::boost::remove_cv<typename ::boost::remove_reference<BOOST_PP_CAT(T, n)>::type>::type

/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_PARAM_TYPE(z, n, data)                      \
    typename ::boost::mpl::eval_if_c<(_boost_type_erasure_free_p_idx::value == n), \
        ::boost::type_erasure::detail::maybe_const_this_param<BOOST_PP_CAT(T, n), Base>,    \
        ::boost::type_erasure::as_param<Base, BOOST_PP_CAT(T, n)>           \
    >::type BOOST_PP_CAT(t, n)

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES

/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_FORWARD_I(z, n, data) ::std::forward<BOOST_PP_CAT(T, n)>(BOOST_PP_CAT(t, n))
/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_FORWARD(n) BOOST_PP_ENUM(n, BOOST_TYPE_ERASURE_FREE_FORWARD_I, ~)
/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_FORWARD_PARAM_I(z, n, data) \
    ::std::forward<typename ::boost::mpl::eval_if_c<(_boost_type_erasure_free_p_idx::value == n), \
        ::boost::type_erasure::detail::maybe_const_this_param<BOOST_PP_CAT(T, n), Base>,    \
        ::boost::type_erasure::as_param<Base, BOOST_PP_CAT(T, n)>           \
    >::type>(BOOST_PP_CAT(t, n))

#else

#define BOOST_TYPE_ERASURE_FREE_FORWARD(n) BOOST_PP_ENUM_PARAMS(n, t)
#define BOOST_TYPE_ERASURE_FREE_FORWARD_PARAM_I(z, n, data) BOOST_PP_CAT(t, n)

#endif

/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_II(qual_name, concept_name, function_name, N)  \
    BOOST_TYPE_ERASURE_OPEN_NAMESPACE(qual_name)                        \
                                                                        \
    template<class Sig>                                                 \
    struct concept_name;                                                \
                                                                        \
    template<class R BOOST_PP_ENUM_TRAILING_PARAMS(N, class T)>         \
    struct concept_name<R(BOOST_PP_ENUM_PARAMS(N, T))> {                \
        static R apply(BOOST_PP_ENUM_BINARY_PARAMS(N, T, t))            \
        { return function_name(BOOST_TYPE_ERASURE_FREE_FORWARD(N)); }   \
    };                                                                  \
                                                                        \
    template<BOOST_PP_ENUM_PARAMS(N, class T)>                          \
    struct concept_name<void(BOOST_PP_ENUM_PARAMS(N, T))> {             \
        static void apply(BOOST_PP_ENUM_BINARY_PARAMS(N, T, t))         \
        { function_name(BOOST_TYPE_ERASURE_FREE_FORWARD(N)); }          \
    };                                                                  \
                                                                        \
    BOOST_TYPE_ERASURE_CLOSE_NAMESPACE(qual_name)                       \
                                                                        \
    namespace boost {                                                   \
    namespace type_erasure {                                            \
                                                                        \
    template<class R BOOST_PP_ENUM_TRAILING_PARAMS(N, class T), class Base> \
    struct concept_interface<                                           \
        BOOST_TYPE_ERASURE_FREE_QUALIFIED_ID(qual_name, N),             \
        Base,                                                           \
        typename ::boost::type_erasure::detail::first_placeholder<      \
            BOOST_PP_ENUM(N, BOOST_TYPE_ERASURE_FREE_UNQUALIFIED_PARAM_TYPE, ~)>::type  \
    > : Base {                                                          \
        typedef typename ::boost::type_erasure::detail::first_placeholder_index<    \
            BOOST_PP_ENUM(N, BOOST_TYPE_ERASURE_FREE_UNQUALIFIED_PARAM_TYPE, ~)>::type  \
            _boost_type_erasure_free_p_idx;                             \
        friend typename ::boost::type_erasure::rebind_any<Base, R>::type function_name(  \
            BOOST_PP_ENUM(N, BOOST_TYPE_ERASURE_FREE_PARAM_TYPE, ~))    \
        {                                                               \
            return ::boost::type_erasure::call(                         \
                BOOST_TYPE_ERASURE_FREE_QUALIFIED_ID(qual_name, N)()    \
                BOOST_PP_ENUM_TRAILING(N, BOOST_TYPE_ERASURE_FREE_FORWARD_PARAM_I, ~)); \
        }                                                               \
    };                                                                  \
                                                                        \
    }                                                                   \
    }

#else

namespace boost {
namespace type_erasure {
    
template<int... N>
struct index_list {};

namespace detail {
    
template<class... T>
struct first_placeholder;

template<class T0, class... T>
struct first_placeholder<T0, T...> {
    typedef typename ::boost::mpl::eval_if<is_placeholder<T0>,
        ::boost::mpl::identity<T0>,
        first_placeholder<T...>
    >::type type;
};

template<>
struct first_placeholder<> {};

template<class... T>
struct first_placeholder_index;

template<class T0, class... T>
struct first_placeholder_index<T0, T...> :
    ::boost::mpl::eval_if<is_placeholder<T0>,
        ::boost::mpl::int_<0>,
        ::boost::mpl::next<first_placeholder_index<T...> >
    >::type
{};

template<class Sig>
struct transform_free_signature;

template<class T, int N>
struct push_back_index;

template<int... N, int X>
struct push_back_index<index_list<N...>, X>
{
    typedef index_list<N..., X> type;
};

template<int N>
struct make_index_list {
    typedef typename push_back_index<
        typename make_index_list<N-1>::type,
        N-1
    >::type type;
};

template<>
struct make_index_list<0> {
    typedef index_list<> type;
};

}
}
}

/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_II(qual_name, concept_name, function_name, N)  \
    BOOST_TYPE_ERASURE_OPEN_NAMESPACE(qual_name)                        \
                                                                        \
    template<class Sig>                                                 \
    struct concept_name;                                                \
                                                                        \
    template<class R, class... T>                                       \
    struct concept_name<R(T...)> {                                      \
        static R apply(T... t)                                          \
        { return function_name(std::forward<T>(t)...); }                \
    };                                                                  \
                                                                        \
    template<class... T>                                                \
    struct concept_name<void(T...)> {                                   \
        static void apply(T... t)                                       \
        { function_name(std::forward<T>(t)...); }                       \
    };                                                                  \
                                                                        \
    BOOST_TYPE_ERASURE_CLOSE_NAMESPACE(qual_name)                       \
                                                                        \
    namespace boost {                                                   \
    namespace type_erasure {                                            \
                                                                        \
    template<class Sig, class Base, class Idx>                          \
    struct inject ## concept_name;                                      \
    template<class R, class... T, class Base, int... I>                 \
    struct inject ## concept_name<R(T...), Base, index_list<I...> > : Base {\
        typedef typename ::boost::type_erasure::detail::first_placeholder_index<    \
            typename ::boost::remove_cv<                                \
                typename ::boost::remove_reference<T>::type             \
            >::type...                                                  \
        >::type _boost_type_erasure_free_p_idx;                         \
        friend typename ::boost::type_erasure::rebind_any<Base, R>::type\
        function_name(                                                  \
            typename ::boost::mpl::eval_if_c<(_boost_type_erasure_free_p_idx::value == I), \
                ::boost::type_erasure::detail::maybe_const_this_param<T, Base>, \
                ::boost::type_erasure::as_param<Base, T>                \
            >::type... t)                                               \
       {                                                                \
            return ::boost::type_erasure::call(                         \
                BOOST_TYPE_ERASURE_QUALIFIED_NAME(qual_name)<R(T...)>(),\
                std::forward<typename ::boost::mpl::eval_if_c<(_boost_type_erasure_free_p_idx::value == I), \
                    ::boost::type_erasure::detail::maybe_const_this_param<T, Base>, \
                    ::boost::type_erasure::as_param<Base, T>            \
                >::type>(t)...);                                        \
        }                                                               \
    };                                                                  \
                                                                        \
    template<class R, class... T, class Base>                           \
    struct concept_interface<                                           \
        BOOST_TYPE_ERASURE_QUALIFIED_NAME(qual_name)<R(T...)>,          \
        Base,                                                           \
        typename ::boost::type_erasure::detail::first_placeholder<      \
            typename ::boost::remove_cv<typename ::boost::remove_reference<T>::type>::type...>::type  \
    > :  inject ## concept_name<R(T...), Base, typename ::boost::type_erasure::detail::make_index_list<sizeof...(T)>::type>\
    {};                                                                 \
                                                                        \
    }                                                                   \
    }

#endif
    
/** INTERNAL ONLY */
#define BOOST_TYPE_ERASURE_FREE_I(namespace_name, concept_name, function_name, N)\
    BOOST_TYPE_ERASURE_FREE_II(namespace_name, concept_name, function_name, N)

/**
 * \brief Defines a primitive concept for a free function.
 *
 * \param qualified_name should be a preprocessor sequence
 * of the form (namespace1)(namespace2)...(concept_name).
 * \param function_name is the name of the function.
 * \param N is the number of arguments of the function.
 *
 * The declaration of the concept is
 * \code
 * template<class Sig>
 * struct ::namespace1::namespace2::...::concept_name;
 * \endcode
 * where Sig is a function type giving the
 * signature of the function.
 *
 * This macro can only be used in the global namespace.
 *
 * Example:
 *
 * \code
 * BOOST_TYPE_ERASURE_FREE((boost)(has_to_string), to_string, 1)
 * \endcode
 */
#define BOOST_TYPE_ERASURE_FREE(qualified_name, function_name, N)                           \
    BOOST_TYPE_ERASURE_FREE_I(                                                              \
        qualified_name,                                                                     \
        BOOST_PP_SEQ_ELEM(BOOST_PP_DEC(BOOST_PP_SEQ_SIZE(qualified_name)), qualified_name), \
        function_name,                                                                             \
        N)

#endif
