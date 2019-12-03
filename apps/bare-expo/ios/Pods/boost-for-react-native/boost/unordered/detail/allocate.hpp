
// Copyright 2005-2011 Daniel James.
// Copyright 2009 Pablo Halpern.
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/unordered for documentation

#ifndef BOOST_UNORDERED_ALLOCATE_HPP
#define BOOST_UNORDERED_ALLOCATE_HPP

#include <boost/config.hpp>
#if defined(BOOST_HAS_PRAGMA_ONCE)
#pragma once
#endif

// Some of these includes are required for other detail headers.
#include <boost/unordered/detail/fwd.hpp>
#include <boost/move/move.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/preprocessor/repetition/enum.hpp>
#include <boost/preprocessor/repetition/enum_params.hpp>
#include <boost/preprocessor/repetition/enum_binary_params.hpp>
#include <boost/preprocessor/repetition/repeat_from_to.hpp>
#include <boost/type_traits/is_class.hpp>
#include <boost/type_traits/add_lvalue_reference.hpp>
#include <boost/type_traits/aligned_storage.hpp>
#include <boost/type_traits/alignment_of.hpp>
#include <boost/type_traits/is_nothrow_move_constructible.hpp>
#include <boost/type_traits/is_nothrow_move_assignable.hpp>
#include <boost/tuple/tuple.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/utility/addressof.hpp>
#include <boost/detail/no_exceptions_support.hpp>
#include <boost/detail/select_type.hpp>
#include <boost/swap.hpp>
#include <boost/assert.hpp>
#include <boost/limits.hpp>
#include <iterator>
#include <utility>
#include <cmath>

#if !defined(BOOST_NO_CXX11_HDR_TUPLE)
#include <tuple>
#endif

#if defined(BOOST_MSVC)
#pragma warning(push)
#pragma warning(disable:4512) // assignment operator could not be generated.
#pragma warning(disable:4345) // behavior change: an object of POD type
                              // constructed with an initializer of the form ()
                              // will be default-initialized.
#endif

// Maximum number of arguments supported by emplace + 1.
#define BOOST_UNORDERED_EMPLACE_LIMIT 11

namespace boost { namespace unordered { namespace detail {

    ////////////////////////////////////////////////////////////////////////////
    // Bits and pieces for implementing traits

    template <typename T> typename boost::add_lvalue_reference<T>::type make();
    struct choice9 { typedef char (&type)[9]; };
    struct choice8 : choice9 { typedef char (&type)[8]; };
    struct choice7 : choice8 { typedef char (&type)[7]; };
    struct choice6 : choice7 { typedef char (&type)[6]; };
    struct choice5 : choice6 { typedef char (&type)[5]; };
    struct choice4 : choice5 { typedef char (&type)[4]; };
    struct choice3 : choice4 { typedef char (&type)[3]; };
    struct choice2 : choice3 { typedef char (&type)[2]; };
    struct choice1 : choice2 { typedef char (&type)[1]; };
    choice1 choose();

    typedef choice1::type yes_type;
    typedef choice2::type no_type;

    struct private_type
    {
       private_type const &operator,(int) const;
    };

    template <typename T>
    no_type is_private_type(T const&);
    yes_type is_private_type(private_type const&);

    struct convert_from_anything {
        template <typename T>
        convert_from_anything(T const&);
    };

    namespace func {
        // This is a bit nasty, when constructing the individual members
        // of a std::pair, need to cast away 'const'. For modern compilers,
        // should be able to use std::piecewise_construct instead.
        template <typename T> T* const_cast_pointer(T* x) { return x; }
        template <typename T> T* const_cast_pointer(T const* x) {
            return const_cast<T*>(x);
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // emplace_args
    //
    // Either forwarding variadic arguments, or storing the arguments in
    // emplace_args##n

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

#define BOOST_UNORDERED_EMPLACE_ARGS1(a0) a0
#define BOOST_UNORDERED_EMPLACE_ARGS2(a0, a1) a0, a1
#define BOOST_UNORDERED_EMPLACE_ARGS3(a0, a1, a2) a0, a1, a2

#define BOOST_UNORDERED_EMPLACE_TEMPLATE typename... Args
#define BOOST_UNORDERED_EMPLACE_ARGS BOOST_FWD_REF(Args)... args
#define BOOST_UNORDERED_EMPLACE_FORWARD boost::forward<Args>(args)...

#else

#define BOOST_UNORDERED_EMPLACE_ARGS1 create_emplace_args
#define BOOST_UNORDERED_EMPLACE_ARGS2 create_emplace_args
#define BOOST_UNORDERED_EMPLACE_ARGS3 create_emplace_args

#define BOOST_UNORDERED_EMPLACE_TEMPLATE typename Args
#define BOOST_UNORDERED_EMPLACE_ARGS Args const& args
#define BOOST_UNORDERED_EMPLACE_FORWARD args

#if defined(BOOST_NO_CXX11_RVALUE_REFERENCES)

#define BOOST_UNORDERED_EARGS_MEMBER(z, n, _)                               \
    typedef BOOST_FWD_REF(BOOST_PP_CAT(A, n)) BOOST_PP_CAT(Arg, n);         \
    BOOST_PP_CAT(Arg, n) BOOST_PP_CAT(a, n);

#else

#define BOOST_UNORDERED_EARGS_MEMBER(z, n, _)                               \
    typedef typename boost::add_lvalue_reference<BOOST_PP_CAT(A, n)>::type  \
        BOOST_PP_CAT(Arg, n);                                               \
    BOOST_PP_CAT(Arg, n) BOOST_PP_CAT(a, n);

#endif

template <typename A0>
struct emplace_args1
{
    BOOST_UNORDERED_EARGS_MEMBER(1, 0, _)

    emplace_args1(Arg0 b0) : a0(b0) {}
};

template <typename A0>
inline emplace_args1<A0> create_emplace_args(
        BOOST_FWD_REF(A0) b0)
{
    emplace_args1<A0> e(b0);
    return e;
}

template <typename A0, typename A1>
struct emplace_args2
{
    BOOST_UNORDERED_EARGS_MEMBER(1, 0, _)
    BOOST_UNORDERED_EARGS_MEMBER(1, 1, _)

    emplace_args2(Arg0 b0, Arg1 b1) : a0(b0), a1(b1) {}
};

template <typename A0, typename A1>
inline emplace_args2<A0, A1> create_emplace_args(
        BOOST_FWD_REF(A0) b0,
        BOOST_FWD_REF(A1) b1)
{
    emplace_args2<A0, A1> e(b0, b1);
    return e;
}

template <typename A0, typename A1, typename A2>
struct emplace_args3
{
    BOOST_UNORDERED_EARGS_MEMBER(1, 0, _)
    BOOST_UNORDERED_EARGS_MEMBER(1, 1, _)
    BOOST_UNORDERED_EARGS_MEMBER(1, 2, _)

    emplace_args3(Arg0 b0, Arg1 b1, Arg2 b2) : a0(b0), a1(b1), a2(b2) {}
};

template <typename A0, typename A1, typename A2>
inline emplace_args3<A0, A1, A2> create_emplace_args(
        BOOST_FWD_REF(A0) b0,
        BOOST_FWD_REF(A1) b1,
        BOOST_FWD_REF(A2) b2)
{
    emplace_args3<A0, A1, A2> e(b0, b1, b2);
    return e;
}

#define BOOST_UNORDERED_FWD_PARAM(z, n, a) \
    BOOST_FWD_REF(BOOST_PP_CAT(A, n)) BOOST_PP_CAT(a, n)

#define BOOST_UNORDERED_CALL_FORWARD(z, i, a) \
    boost::forward<BOOST_PP_CAT(A,i)>(BOOST_PP_CAT(a,i))

#define BOOST_UNORDERED_EARGS_INIT(z, n, _)                                 \
BOOST_PP_CAT(a, n)(BOOST_PP_CAT(b, n))

#define BOOST_UNORDERED_EARGS(z, n, _)                                      \
    template <BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)>                     \
    struct BOOST_PP_CAT(emplace_args, n)                                    \
    {                                                                       \
        BOOST_PP_REPEAT_##z(n, BOOST_UNORDERED_EARGS_MEMBER, _)             \
        BOOST_PP_CAT(emplace_args, n) (                                     \
            BOOST_PP_ENUM_BINARY_PARAMS_Z(z, n, Arg, b)                     \
        ) : BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_EARGS_INIT, _)             \
        {}                                                                  \
                                                                            \
    };                                                                      \
                                                                            \
    template <BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)>                     \
    inline BOOST_PP_CAT(emplace_args, n) <                                  \
        BOOST_PP_ENUM_PARAMS_Z(z, n, A)                                     \
    > create_emplace_args(                                                  \
        BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_FWD_PARAM, b)                  \
    )                                                                       \
    {                                                                       \
        BOOST_PP_CAT(emplace_args, n) <                                     \
            BOOST_PP_ENUM_PARAMS_Z(z, n, A)                                 \
        > e(BOOST_PP_ENUM_PARAMS_Z(z, n, b));                               \
        return e;                                                           \
    }

BOOST_PP_REPEAT_FROM_TO(4, BOOST_UNORDERED_EMPLACE_LIMIT, BOOST_UNORDERED_EARGS,
    _)

#undef BOOST_UNORDERED_DEFINE_EMPLACE_ARGS
#undef BOOST_UNORDERED_EARGS_MEMBER
#undef BOOST_UNORDERED_EARGS_INIT

#endif

}}}

////////////////////////////////////////////////////////////////////////////////
//
// Pick which version of allocator_traits to use
//
// 0 = Own partial implementation
// 1 = std::allocator_traits
// 2 = boost::container::allocator_traits

#if !defined(BOOST_UNORDERED_USE_ALLOCATOR_TRAITS)
#   if !defined(BOOST_NO_CXX11_ALLOCATOR)
#       define BOOST_UNORDERED_USE_ALLOCATOR_TRAITS 1
#   elif defined(BOOST_MSVC)
#       if BOOST_MSVC < 1400
            // Use container's allocator_traits for older versions of Visual
            // C++ as I don't test with them.
#           define BOOST_UNORDERED_USE_ALLOCATOR_TRAITS 2
#       endif
#   endif
#endif

#if !defined(BOOST_UNORDERED_USE_ALLOCATOR_TRAITS)
#   define BOOST_UNORDERED_USE_ALLOCATOR_TRAITS 0
#endif

////////////////////////////////////////////////////////////////////////////////
//
// Some utilities for implementing allocator_traits, but useful elsewhere so
// they're always defined.

#if !defined(BOOST_NO_CXX11_HDR_TYPE_TRAITS)
#  include <type_traits>
#endif

namespace boost { namespace unordered { namespace detail {

    ////////////////////////////////////////////////////////////////////////////
    // Integral_constrant, true_type, false_type
    //
    // Uses the standard versions if available.

#if !defined(BOOST_NO_CXX11_HDR_TYPE_TRAITS)

    using std::integral_constant;
    using std::true_type;
    using std::false_type;

#else

    template <typename T, T Value>
    struct integral_constant { enum { value = Value }; };

    typedef boost::unordered::detail::integral_constant<bool, true> true_type;
    typedef boost::unordered::detail::integral_constant<bool, false> false_type;

#endif

    ////////////////////////////////////////////////////////////////////////////
    // Explicitly call a destructor

#if defined(BOOST_MSVC)
#pragma warning(push)
#pragma warning(disable:4100) // unreferenced formal parameter
#endif

    namespace func {
        template <class T>
        inline void destroy(T* x) {
            x->~T();
        }
    }

#if defined(BOOST_MSVC)
#pragma warning(pop)
#endif

    ////////////////////////////////////////////////////////////////////////////
    // Expression test mechanism
    //
    // When SFINAE expressions are available, define
    // BOOST_UNORDERED_HAS_FUNCTION which can check if a function call is
    // supported by a class, otherwise define BOOST_UNORDERED_HAS_MEMBER which
    // can detect if a class has the specified member, but not that it has the
    // correct type, this is good enough for a passable impression of
    // allocator_traits.

#if !defined(BOOST_NO_SFINAE_EXPR)

    template <typename T, long unsigned int> struct expr_test;
    template <typename T> struct expr_test<T, sizeof(char)> : T {};

#   define BOOST_UNORDERED_CHECK_EXPRESSION(count, result, expression)      \
        template <typename U>                                               \
        static typename boost::unordered::detail::expr_test<                \
            BOOST_PP_CAT(choice, result),                                   \
            sizeof(for_expr_test((                                          \
                (expression),                                               \
            0)))>::type test(                                               \
            BOOST_PP_CAT(choice, count))

#   define BOOST_UNORDERED_DEFAULT_EXPRESSION(count, result)                \
        template <typename U>                                               \
        static BOOST_PP_CAT(choice, result)::type test(                     \
            BOOST_PP_CAT(choice, count))

#   define BOOST_UNORDERED_HAS_FUNCTION(name, thing, args, _)               \
    struct BOOST_PP_CAT(has_, name)                                         \
    {                                                                       \
        template <typename U> static char for_expr_test(U const&);          \
        BOOST_UNORDERED_CHECK_EXPRESSION(1, 1,                              \
            boost::unordered::detail::make< thing >().name args);           \
        BOOST_UNORDERED_DEFAULT_EXPRESSION(2, 2);                           \
                                                                            \
        enum { value = sizeof(test<T>(choose())) == sizeof(choice1::type) };\
    }

#else

    template <typename T> struct identity { typedef T type; };

#   define BOOST_UNORDERED_CHECK_MEMBER(count, result, name, member)        \
                                                                            \
    typedef typename boost::unordered::detail::identity<member>::type       \
        BOOST_PP_CAT(check, count);                                         \
                                                                            \
    template <BOOST_PP_CAT(check, count) e>                                 \
    struct BOOST_PP_CAT(test, count) {                                      \
        typedef BOOST_PP_CAT(choice, result) type;                          \
    };                                                                      \
                                                                            \
    template <class U> static typename                                      \
        BOOST_PP_CAT(test, count)<&U::name>::type                           \
        test(BOOST_PP_CAT(choice, count))

#   define BOOST_UNORDERED_DEFAULT_MEMBER(count, result)                    \
    template <class U> static BOOST_PP_CAT(choice, result)::type            \
        test(BOOST_PP_CAT(choice, count))

#   define BOOST_UNORDERED_HAS_MEMBER(name)                                 \
    struct BOOST_PP_CAT(has_, name)                                         \
    {                                                                       \
        struct impl {                                                       \
            struct base_mixin { int name; };                                \
            struct base : public T, public base_mixin {};                   \
                                                                            \
            BOOST_UNORDERED_CHECK_MEMBER(1, 1, name, int base_mixin::*);    \
            BOOST_UNORDERED_DEFAULT_MEMBER(2, 2);                           \
                                                                            \
            enum { value = sizeof(choice2::type) ==                         \
                sizeof(test<base>(choose()))                                \
            };                                                              \
        };                                                                  \
                                                                            \
        enum { value = impl::value };                                       \
    }

#endif

}}}

////////////////////////////////////////////////////////////////////////////////
//
// Allocator traits
//
// First our implementation, then later light wrappers around the alternatives

#if BOOST_UNORDERED_USE_ALLOCATOR_TRAITS == 0

#   include <boost/limits.hpp>
#   include <boost/utility/enable_if.hpp>
#   include <boost/pointer_to_other.hpp>
#   if defined(BOOST_NO_SFINAE_EXPR)
#       include <boost/type_traits/is_same.hpp>
#   endif

#   if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES) && \
        !defined(BOOST_NO_SFINAE_EXPR)
#       define BOOST_UNORDERED_DETAIL_FULL_CONSTRUCT 1
#   else
#       define BOOST_UNORDERED_DETAIL_FULL_CONSTRUCT 0
#   endif

namespace boost { namespace unordered { namespace detail {

    template <typename Alloc, typename T>
    struct rebind_alloc;

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

    template <template<typename, typename...> class Alloc,
        typename U, typename T, typename... Args>
    struct rebind_alloc<Alloc<U, Args...>, T>
    {
        typedef Alloc<T, Args...> type;
    };

#else

    template <
        template<typename> class Alloc,
        typename U, typename T>
    struct rebind_alloc<Alloc<U>, T>
    {
        typedef Alloc<T> type;
    };

    template <
        template<typename, typename> class Alloc,
        typename U, typename T,
        typename A0>
    struct rebind_alloc<Alloc<U, A0>, T>
    {
        typedef Alloc<T, A0> type;
    };

    template <
        template<typename, typename, typename> class Alloc,
        typename U, typename T,
        typename A0, typename A1>
    struct rebind_alloc<Alloc<U, A0, A1>, T>
    {
        typedef Alloc<T, A0, A1> type;
    };

#endif

    template <typename Alloc, typename T>
    struct rebind_wrap
    {
        template <typename X>
        static choice1::type test(choice1,
            typename X::BOOST_NESTED_TEMPLATE rebind<T>::other* = 0);
        template <typename X>
        static choice2::type test(choice2, void* = 0);

        enum { value = (1 == sizeof(test<Alloc>(choose()))) };

        struct fallback {
            template <typename U>
            struct rebind {
                typedef typename rebind_alloc<Alloc, T>::type other;
            };
        };

        typedef typename boost::detail::if_true<value>::
            BOOST_NESTED_TEMPLATE then<Alloc, fallback>
            ::type::BOOST_NESTED_TEMPLATE rebind<T>::other type;
    };

#   if defined(BOOST_MSVC) && BOOST_MSVC <= 1400

#       define BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(tname)                    \
    template <typename Tp, typename Default>                                \
    struct default_type_ ## tname {                                         \
                                                                            \
        template <typename X>                                               \
        static choice1::type test(choice1, typename X::tname* = 0);         \
                                                                            \
        template <typename X>                                               \
        static choice2::type test(choice2, void* = 0);                      \
                                                                            \
        struct DefaultWrap { typedef Default tname; };                      \
                                                                            \
        enum { value = (1 == sizeof(test<Tp>(choose()))) };                 \
                                                                            \
        typedef typename boost::detail::if_true<value>::                    \
            BOOST_NESTED_TEMPLATE then<Tp, DefaultWrap>                     \
            ::type::tname type;                                             \
    }

#   else

    template <typename T, typename T2>
    struct sfinae : T2 {};

#       define BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(tname)                    \
    template <typename Tp, typename Default>                                \
    struct default_type_ ## tname {                                         \
                                                                            \
        template <typename X>                                               \
        static typename boost::unordered::detail::sfinae<                   \
                typename X::tname, choice1>::type                           \
            test(choice1);                                                  \
                                                                            \
        template <typename X>                                               \
        static choice2::type test(choice2);                                 \
                                                                            \
        struct DefaultWrap { typedef Default tname; };                      \
                                                                            \
        enum { value = (1 == sizeof(test<Tp>(choose()))) };                 \
                                                                            \
        typedef typename boost::detail::if_true<value>::                    \
            BOOST_NESTED_TEMPLATE then<Tp, DefaultWrap>                     \
            ::type::tname type;                                             \
    }

#   endif

#   define BOOST_UNORDERED_DEFAULT_TYPE(T,tname, arg)                   \
    typename default_type_ ## tname<T, arg>::type

    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(pointer);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(const_pointer);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(void_pointer);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(const_void_pointer);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(difference_type);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(size_type);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(propagate_on_container_copy_assignment);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(propagate_on_container_move_assignment);
    BOOST_UNORDERED_DEFAULT_TYPE_TMPLT(propagate_on_container_swap);

#   if !defined(BOOST_NO_SFINAE_EXPR)

    template <typename T>
    BOOST_UNORDERED_HAS_FUNCTION(
        select_on_container_copy_construction, U const, (), 0
    );

    template <typename T>
    BOOST_UNORDERED_HAS_FUNCTION(
        max_size, U const, (), 0
    );

#       if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

    template <typename T, typename ValueType, typename... Args>
    BOOST_UNORDERED_HAS_FUNCTION(
    construct, U, (
        boost::unordered::detail::make<ValueType*>(),
        boost::unordered::detail::make<Args const>()...), 2
    );

#       else

    template <typename T, typename ValueType>
    BOOST_UNORDERED_HAS_FUNCTION(
    construct, U, (
        boost::unordered::detail::make<ValueType*>(),
        boost::unordered::detail::make<ValueType const>()), 2
    );

#       endif

    template <typename T, typename ValueType>
    BOOST_UNORDERED_HAS_FUNCTION(
        destroy, U, (boost::unordered::detail::make<ValueType*>()), 1
    );

#   else

    template <typename T>
    BOOST_UNORDERED_HAS_MEMBER(select_on_container_copy_construction);

    template <typename T>
    BOOST_UNORDERED_HAS_MEMBER(max_size);

    template <typename T, typename ValueType>
    BOOST_UNORDERED_HAS_MEMBER(construct);

    template <typename T, typename ValueType>
    BOOST_UNORDERED_HAS_MEMBER(destroy);

#   endif

    namespace func
    {

    template <typename Alloc>
    inline Alloc call_select_on_container_copy_construction(const Alloc& rhs,
        typename boost::enable_if_c<
            boost::unordered::detail::
            has_select_on_container_copy_construction<Alloc>::value, void*
        >::type = 0)
    {
        return rhs.select_on_container_copy_construction();
    }

    template <typename Alloc>
    inline Alloc call_select_on_container_copy_construction(const Alloc& rhs,
        typename boost::disable_if_c<
            boost::unordered::detail::
            has_select_on_container_copy_construction<Alloc>::value, void*
        >::type = 0)
    {
        return rhs;
    }

    template <typename SizeType, typename Alloc>
    inline SizeType call_max_size(const Alloc& a,
        typename boost::enable_if_c<
            boost::unordered::detail::has_max_size<Alloc>::value, void*
        >::type = 0)
    {
        return a.max_size();
    }

    template <typename SizeType, typename Alloc>
    inline SizeType call_max_size(const Alloc&, typename boost::disable_if_c<
            boost::unordered::detail::has_max_size<Alloc>::value, void*
        >::type = 0)
    {
        return (std::numeric_limits<SizeType>::max)();
    }

    } // namespace func.

    template <typename Alloc>
    struct allocator_traits
    {
        typedef Alloc allocator_type;
        typedef typename Alloc::value_type value_type;

        typedef BOOST_UNORDERED_DEFAULT_TYPE(Alloc, pointer, value_type*)
            pointer;

        template <typename T>
        struct pointer_to_other : boost::pointer_to_other<pointer, T> {};

        typedef BOOST_UNORDERED_DEFAULT_TYPE(Alloc, const_pointer,
            typename pointer_to_other<const value_type>::type)
            const_pointer;

        //typedef BOOST_UNORDERED_DEFAULT_TYPE(Alloc, void_pointer,
        //    typename pointer_to_other<void>::type)
        //    void_pointer;
        //
        //typedef BOOST_UNORDERED_DEFAULT_TYPE(Alloc, const_void_pointer,
        //    typename pointer_to_other<const void>::type)
        //    const_void_pointer;

        typedef BOOST_UNORDERED_DEFAULT_TYPE(Alloc, difference_type,
            std::ptrdiff_t) difference_type;

        typedef BOOST_UNORDERED_DEFAULT_TYPE(Alloc, size_type, std::size_t)
            size_type;

#if !defined(BOOST_NO_CXX11_TEMPLATE_ALIASES)
        template <typename T>
        using rebind_alloc = typename rebind_wrap<Alloc, T>::type;

        template <typename T>
        using rebind_traits =
            boost::unordered::detail::allocator_traits<rebind_alloc<T> >;
#endif

        static pointer allocate(Alloc& a, size_type n)
            { return a.allocate(n); }

        // I never use this, so I'll just comment it out for now.
        //
        //static pointer allocate(Alloc& a, size_type n,
        //        const_void_pointer hint)
        //    { return DEFAULT_FUNC(allocate, pointer)(a, n, hint); }

        static void deallocate(Alloc& a, pointer p, size_type n)
            { a.deallocate(p, n); }

    public:

#   if BOOST_UNORDERED_DETAIL_FULL_CONSTRUCT

        template <typename T, typename... Args>
        static typename boost::enable_if_c<
                boost::unordered::detail::has_construct<Alloc, T, Args...>
                ::value>::type
            construct(Alloc& a, T* p, BOOST_FWD_REF(Args)... x)
        {
            a.construct(p, boost::forward<Args>(x)...);
        }

        template <typename T, typename... Args>
        static typename boost::disable_if_c<
                boost::unordered::detail::has_construct<Alloc, T, Args...>
                ::value>::type
            construct(Alloc&, T* p, BOOST_FWD_REF(Args)... x)
        {
            new (static_cast<void*>(p)) T(boost::forward<Args>(x)...);
        }

        template <typename T>
        static typename boost::enable_if_c<
                boost::unordered::detail::has_destroy<Alloc, T>::value>::type
            destroy(Alloc& a, T* p)
        {
            a.destroy(p);
        }

        template <typename T>
        static typename boost::disable_if_c<
                boost::unordered::detail::has_destroy<Alloc, T>::value>::type
            destroy(Alloc&, T* p)
        {
            boost::unordered::detail::func::destroy(p);
        }

#   elif !defined(BOOST_NO_SFINAE_EXPR)

        template <typename T>
        static typename boost::enable_if_c<
                boost::unordered::detail::has_construct<Alloc, T>::value>::type
            construct(Alloc& a, T* p, T const& x)
        {
            a.construct(p, x);
        }

        template <typename T>
        static typename boost::disable_if_c<
                boost::unordered::detail::has_construct<Alloc, T>::value>::type
            construct(Alloc&, T* p, T const& x)
        {
            new (static_cast<void*>(p)) T(x);
        }

        template <typename T>
        static typename boost::enable_if_c<
                boost::unordered::detail::has_destroy<Alloc, T>::value>::type
            destroy(Alloc& a, T* p)
        {
            a.destroy(p);
        }

        template <typename T>
        static typename boost::disable_if_c<
                boost::unordered::detail::has_destroy<Alloc, T>::value>::type
            destroy(Alloc&, T* p)
        {
            boost::unordered::detail::func::destroy(p);
        }

#   else

        // If we don't have SFINAE expressions, only call construct for the
        // copy constructor for the allocator's value_type - as that's
        // the only construct method that old fashioned allocators support.

        template <typename T>
        static void construct(Alloc& a, T* p, T const& x,
            typename boost::enable_if_c<
                    boost::unordered::detail::has_construct<Alloc, T>::value &&
                    boost::is_same<T, value_type>::value,
                    void*>::type = 0)
        {
            a.construct(p, x);
        }

        template <typename T>
        static void construct(Alloc&, T* p, T const& x,
            typename boost::disable_if_c<
                boost::unordered::detail::has_construct<Alloc, T>::value &&
                boost::is_same<T, value_type>::value,
                void*>::type = 0)
        {
            new (static_cast<void*>(p)) T(x);
        }

        template <typename T>
        static void destroy(Alloc& a, T* p,
            typename boost::enable_if_c<
                boost::unordered::detail::has_destroy<Alloc, T>::value &&
                boost::is_same<T, value_type>::value,
                void*>::type = 0)
        {
            a.destroy(p);
        }

        template <typename T>
        static void destroy(Alloc&, T* p,
            typename boost::disable_if_c<
                boost::unordered::detail::has_destroy<Alloc, T>::value &&
                boost::is_same<T, value_type>::value,
                void*>::type = 0)
        {
            boost::unordered::detail::func::destroy(p);
        }

#   endif

        static size_type max_size(const Alloc& a)
        {
            return boost::unordered::detail::func::
                call_max_size<size_type>(a);
        }

        // Allocator propagation on construction

        static Alloc select_on_container_copy_construction(Alloc const& rhs)
        {
            return boost::unordered::detail::func::
                call_select_on_container_copy_construction(rhs);
        }

        // Allocator propagation on assignment and swap.
        // Return true if lhs is modified.
        typedef BOOST_UNORDERED_DEFAULT_TYPE(
            Alloc, propagate_on_container_copy_assignment, false_type)
            propagate_on_container_copy_assignment;
        typedef BOOST_UNORDERED_DEFAULT_TYPE(
            Alloc,propagate_on_container_move_assignment, false_type)
            propagate_on_container_move_assignment;
        typedef BOOST_UNORDERED_DEFAULT_TYPE(
            Alloc,propagate_on_container_swap,false_type)
            propagate_on_container_swap;
    };
}}}

#   undef BOOST_UNORDERED_DEFAULT_TYPE_TMPLT
#   undef BOOST_UNORDERED_DEFAULT_TYPE

////////////////////////////////////////////////////////////////////////////////
//
// std::allocator_traits

#elif BOOST_UNORDERED_USE_ALLOCATOR_TRAITS == 1

#   include <memory>

#   define BOOST_UNORDERED_DETAIL_FULL_CONSTRUCT 1

namespace boost { namespace unordered { namespace detail {

    template <typename Alloc>
    struct allocator_traits : std::allocator_traits<Alloc> {};

    template <typename Alloc, typename T>
    struct rebind_wrap
    {
        typedef typename std::allocator_traits<Alloc>::
            template rebind_alloc<T> type;
    };
}}}

////////////////////////////////////////////////////////////////////////////////
//
// boost::container::allocator_traits

#elif BOOST_UNORDERED_USE_ALLOCATOR_TRAITS == 2

#   include <boost/container/allocator_traits.hpp>

#   define BOOST_UNORDERED_DETAIL_FULL_CONSTRUCT 0

namespace boost { namespace unordered { namespace detail {

    template <typename Alloc>
    struct allocator_traits :
        boost::container::allocator_traits<Alloc> {};

    template <typename Alloc, typename T>
    struct rebind_wrap :
        boost::container::allocator_traits<Alloc>::
            template portable_rebind_alloc<T>
    {};

}}}

#else

#error "Invalid BOOST_UNORDERED_USE_ALLOCATOR_TRAITS value."

#endif


namespace boost { namespace unordered { namespace detail { namespace func {

    ////////////////////////////////////////////////////////////////////////////
    // call_construct

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

#   if BOOST_UNORDERED_DETAIL_FULL_CONSTRUCT

    template <typename Alloc, typename T, typename... Args>
    inline void call_construct(Alloc& alloc, T* address,
        BOOST_FWD_REF(Args)... args)
    {
        boost::unordered::detail::allocator_traits<Alloc>::construct(alloc,
            address, boost::forward<Args>(args)...);
    }

    template <typename Alloc, typename T>
    inline void call_destroy(Alloc& alloc, T* x) {
        boost::unordered::detail::allocator_traits<Alloc>::destroy(alloc, x);
    }


#   else

    template <typename Alloc, typename T, typename... Args>
    inline void call_construct(Alloc&, T* address,
        BOOST_FWD_REF(Args)... args)
    {
        new((void*) address) T(boost::forward<Args>(args)...);
    }

    template <typename Alloc, typename T>
    inline void call_destroy(Alloc&, T* x) {
        boost::unordered::detail::func::destroy(x);
    }


#   endif

#else
    template <typename Alloc, typename T>
    inline void call_construct(Alloc&, T* address)
    {
        new ((void*) address) T();
    }

    template <typename Alloc, typename T, typename A0>
    inline void call_construct(Alloc&, T* address,
        BOOST_FWD_REF(A0) a0)
    {
        new ((void*) address) T(boost::forward<A0>(a0));
    }

    template <typename Alloc, typename T>
    inline void call_destroy(Alloc&, T* x) {
        boost::unordered::detail::func::destroy(x);
    }

#endif

    ////////////////////////////////////////////////////////////////////////////
    // Construct from tuple
    //
    // Used for piecewise construction.

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

#   define BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE(n, namespace_)              \
    template<typename Alloc, typename T>                                    \
    void construct_from_tuple(Alloc& alloc, T* ptr, namespace_ tuple<>)     \
    {                                                                       \
        boost::unordered::detail::func::call_construct(alloc, ptr);         \
    }                                                                       \
                                                                            \
    BOOST_PP_REPEAT_FROM_TO(1, n,                                           \
        BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL, namespace_)

#   define BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL(z, n, namespace_)      \
    template<typename Alloc, typename T,                                    \
        BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)>                           \
    void construct_from_tuple(Alloc& alloc, T* ptr,                         \
            namespace_ tuple<BOOST_PP_ENUM_PARAMS_Z(z, n, A)> const& x)     \
    {                                                                       \
        boost::unordered::detail::func::call_construct(alloc, ptr,          \
            BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_GET_TUPLE_ARG, namespace_) \
        );                                                                  \
    }

#   define BOOST_UNORDERED_GET_TUPLE_ARG(z, n, namespace_)                  \
    namespace_ get<n>(x)

#elif !defined(__SUNPRO_CC)

#   define BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE(n, namespace_)              \
    template<typename Alloc, typename T>                                    \
    void construct_from_tuple(Alloc&, T* ptr, namespace_ tuple<>)           \
    {                                                                       \
        new ((void*) ptr) T();                                              \
    }                                                                       \
                                                                            \
    BOOST_PP_REPEAT_FROM_TO(1, n,                                           \
        BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL, namespace_)

#   define BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL(z, n, namespace_)      \
    template<typename Alloc, typename T,                                    \
        BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)>                           \
    void construct_from_tuple(Alloc&, T* ptr,                               \
            namespace_ tuple<BOOST_PP_ENUM_PARAMS_Z(z, n, A)> const& x)     \
    {                                                                       \
        new ((void*) ptr) T(                                                \
            BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_GET_TUPLE_ARG, namespace_) \
        );                                                                  \
    }

#   define BOOST_UNORDERED_GET_TUPLE_ARG(z, n, namespace_)                  \
    namespace_ get<n>(x)

#else

    template <int N> struct length {};

#   define BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE(n, namespace_)              \
    template<typename Alloc, typename T>                                    \
    void construct_from_tuple_impl(                                         \
            boost::unordered::detail::func::length<0>, Alloc&, T* ptr,      \
            namespace_ tuple<>)                                             \
    {                                                                       \
        new ((void*) ptr) T();                                              \
    }                                                                       \
                                                                            \
    BOOST_PP_REPEAT_FROM_TO(1, n,                                           \
        BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL, namespace_)

#   define BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL(z, n, namespace_)      \
    template<typename Alloc, typename T,                                    \
        BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)>                           \
    void construct_from_tuple_impl(                                         \
            boost::unordered::detail::func::length<n>, Alloc&, T* ptr,      \
            namespace_ tuple<BOOST_PP_ENUM_PARAMS_Z(z, n, A)> const& x)     \
    {                                                                       \
        new ((void*) ptr) T(                                                \
            BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_GET_TUPLE_ARG, namespace_) \
        );                                                                  \
    }

#   define BOOST_UNORDERED_GET_TUPLE_ARG(z, n, namespace_)                  \
    namespace_ get<n>(x)

#endif

BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE(10, boost::)

#if !defined(__SUNPRO_CC) && !defined(BOOST_NO_CXX11_HDR_TUPLE)
   BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE(10, std::)
#endif

#undef BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE
#undef BOOST_UNORDERED_CONSTRUCT_FROM_TUPLE_IMPL
#undef BOOST_UNORDERED_GET_TUPLE_ARG

#if defined(__SUNPRO_CC)

    template <typename Alloc, typename T, typename Tuple>
    void construct_from_tuple(Alloc& alloc, T* ptr, Tuple const& x)
    {
        construct_from_tuple_impl(
            boost::unordered::detail::func::length<
                boost::tuples::length<Tuple>::value>(),
            alloc, ptr, x);
    }

#endif

    ////////////////////////////////////////////////////////////////////////////
    // Trait to check for piecewise construction.

    template <typename A0>
    struct use_piecewise {
        static choice1::type test(choice1,
            boost::unordered::piecewise_construct_t);

        static choice2::type test(choice2, ...);

        enum { value = sizeof(choice1::type) ==
            sizeof(test(choose(), boost::unordered::detail::make<A0>())) };
    };

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

    ////////////////////////////////////////////////////////////////////////////
    // Construct from variadic parameters

    // For the standard pair constructor.

    template <typename Alloc, typename T, typename... Args>
    inline void construct_from_args(Alloc& alloc, T* address,
        BOOST_FWD_REF(Args)... args)
    {
        boost::unordered::detail::func::call_construct(alloc,
            address, boost::forward<Args>(args)...);
    }

    // Special case for piece_construct
    //
    // TODO: When possible, it might be better to use std::pair's
    // constructor for std::piece_construct with std::tuple.

    template <typename Alloc, typename A, typename B,
        typename A0, typename A1, typename A2>
    inline typename enable_if<use_piecewise<A0>, void>::type
        construct_from_args(Alloc& alloc, std::pair<A, B>* address,
            BOOST_FWD_REF(A0), BOOST_FWD_REF(A1) a1, BOOST_FWD_REF(A2) a2)
    {
        boost::unordered::detail::func::construct_from_tuple(alloc,
            boost::unordered::detail::func::const_cast_pointer(
                boost::addressof(address->first)),
            boost::forward<A1>(a1));
        boost::unordered::detail::func::construct_from_tuple(alloc,
            boost::unordered::detail::func::const_cast_pointer(
                boost::addressof(address->second)),
            boost::forward<A2>(a2));
    }

#else // BOOST_NO_CXX11_VARIADIC_TEMPLATES

    ////////////////////////////////////////////////////////////////////////////
    // Construct from emplace_args

    // Explicitly write out first three overloads for the sake of sane
    // error messages.

    template <typename Alloc, typename T, typename A0>
    inline void construct_from_args(Alloc&, T* address,
            emplace_args1<A0> const& args)
    {
        new((void*) address) T(boost::forward<A0>(args.a0));
    }

    template <typename Alloc, typename T, typename A0, typename A1>
    inline void construct_from_args(Alloc&, T* address,
            emplace_args2<A0, A1> const& args)
    {
        new((void*) address) T(
            boost::forward<A0>(args.a0),
            boost::forward<A1>(args.a1)
        );
    }

    template <typename Alloc, typename T, typename A0, typename A1, typename A2>
    inline void construct_from_args(Alloc&, T* address,
            emplace_args3<A0, A1, A2> const& args)
    {
        new((void*) address) T(
            boost::forward<A0>(args.a0),
            boost::forward<A1>(args.a1),
            boost::forward<A2>(args.a2)
        );
    }

    // Use a macro for the rest.

#define BOOST_UNORDERED_CONSTRUCT_IMPL(z, num_params, _)                    \
    template <                                                              \
        typename Alloc, typename T,                                         \
        BOOST_PP_ENUM_PARAMS_Z(z, num_params, typename A)                   \
    >                                                                       \
    inline void construct_from_args(Alloc&, T* address,                     \
        boost::unordered::detail::BOOST_PP_CAT(emplace_args,num_params) <   \
            BOOST_PP_ENUM_PARAMS_Z(z, num_params, A)                        \
        > const& args)                                                      \
    {                                                                       \
        new((void*) address) T(                                             \
            BOOST_PP_ENUM_##z(num_params, BOOST_UNORDERED_CALL_FORWARD,     \
                args.a));                                                   \
    }

    BOOST_PP_REPEAT_FROM_TO(4, BOOST_UNORDERED_EMPLACE_LIMIT,
        BOOST_UNORDERED_CONSTRUCT_IMPL, _)

#undef BOOST_UNORDERED_CONSTRUCT_IMPL

    // Construct with piece_construct

    template <typename Alloc, typename A, typename B,
        typename A0, typename A1, typename A2>
    inline void construct_from_args(Alloc& alloc, std::pair<A, B>* address,
            boost::unordered::detail::emplace_args3<A0, A1, A2> const& args,
            typename enable_if<use_piecewise<A0>, void*>::type = 0)
    {
        boost::unordered::detail::func::construct_from_tuple(alloc,
            boost::unordered::detail::func::const_cast_pointer(
                boost::addressof(address->first)),
            args.a1);
        boost::unordered::detail::func::construct_from_tuple(alloc,
            boost::unordered::detail::func::const_cast_pointer(
                boost::addressof(address->second)),
            args.a2);
    }

#endif // BOOST_NO_CXX11_VARIADIC_TEMPLATES

}}}}

namespace boost { namespace unordered { namespace detail {

    ///////////////////////////////////////////////////////////////////
    //
    // Node construction

    template <typename NodeAlloc>
    struct node_constructor
    {
        typedef NodeAlloc node_allocator;
        typedef boost::unordered::detail::allocator_traits<NodeAlloc>
            node_allocator_traits;
        typedef typename node_allocator_traits::value_type node;
        typedef typename node_allocator_traits::pointer node_pointer;
        typedef typename node::value_type value_type;

        node_allocator& alloc_;
        node_pointer node_;
        bool node_constructed_;

        node_constructor(node_allocator& n) :
            alloc_(n),
            node_(),
            node_constructed_(false)
        {
        }

        ~node_constructor();

        void create_node();

        // no throw
        node_pointer release()
        {
            BOOST_ASSERT(node_ && node_constructed_);
            node_pointer p = node_;
            node_ = node_pointer();
            return p;
        }

        void reclaim(node_pointer p) {
            BOOST_ASSERT(!node_);
            node_ = p;
            node_constructed_ = true;
            boost::unordered::detail::func::call_destroy(alloc_,
                node_->value_ptr());
        }

    private:
        node_constructor(node_constructor const&);
        node_constructor& operator=(node_constructor const&);
    };

    template <typename Alloc>
    node_constructor<Alloc>::~node_constructor()
    {
        if (node_) {
            if (node_constructed_) {
                boost::unordered::detail::func::destroy(
                    boost::addressof(*node_));
            }

            node_allocator_traits::deallocate(alloc_, node_, 1);
        }
    }

    template <typename Alloc>
    void node_constructor<Alloc>::create_node()
    {
        BOOST_ASSERT(!node_);
        node_constructed_ = false;

        node_ = node_allocator_traits::allocate(alloc_, 1);

        new ((void*) boost::addressof(*node_)) node();
        node_->init(node_);
        node_constructed_ = true;
    }

    template <typename NodeAlloc>
    struct node_tmp
    {
        typedef boost::unordered::detail::allocator_traits<NodeAlloc>
            node_allocator_traits;
        typedef typename node_allocator_traits::pointer node_pointer;

        NodeAlloc& alloc_;
        node_pointer node_;

        explicit node_tmp(node_pointer n, NodeAlloc& a):
            alloc_(a),
            node_(n)
        {
        }

        ~node_tmp();

        // no throw
        node_pointer release()
        {
            node_pointer p = node_;
            node_ = node_pointer();
            return p;
        }
    };

    template <typename Alloc>
    node_tmp<Alloc>::~node_tmp()
    {
        if (node_) {
            boost::unordered::detail::func::call_destroy(alloc_,
                node_->value_ptr());
            boost::unordered::detail::func::destroy(
                boost::addressof(*node_));
            node_allocator_traits::deallocate(alloc_, node_, 1);
        }
    }
}}}

namespace boost { namespace unordered { namespace detail { namespace func {

    // Some nicer construct_node functions, might try to
    // improve implementation later.

    template <typename Alloc, BOOST_UNORDERED_EMPLACE_TEMPLATE>
    inline typename boost::unordered::detail::allocator_traits<Alloc>::pointer
    construct_node_from_args(Alloc& alloc, BOOST_UNORDERED_EMPLACE_ARGS)
    {
        node_constructor<Alloc> a(alloc);
        a.create_node();
        construct_from_args(alloc, a.node_->value_ptr(),
                BOOST_UNORDERED_EMPLACE_FORWARD);
        return a.release();
    }

    template <typename Alloc, typename U>
    inline typename boost::unordered::detail::allocator_traits<Alloc>::pointer
    construct_node(Alloc& alloc, BOOST_FWD_REF(U) x)
    {
        node_constructor<Alloc> a(alloc);
        a.create_node();
        boost::unordered::detail::func::call_construct(
                alloc, a.node_->value_ptr(), boost::forward<U>(x));
        return a.release();
    }

    // TODO: When possible, it might be better to use std::pair's
    // constructor for std::piece_construct with std::tuple.
    template <typename Alloc, typename Key>
    inline typename boost::unordered::detail::allocator_traits<Alloc>::pointer
    construct_node_pair(Alloc& alloc, BOOST_FWD_REF(Key) k)
    {
        node_constructor<Alloc> a(alloc);
        a.create_node();
        boost::unordered::detail::func::call_construct(alloc,
                boost::unordered::detail::func::const_cast_pointer(
                    boost::addressof(a.node_->value_ptr()->first)),
                boost::forward<Key>(k));
        boost::unordered::detail::func::call_construct(alloc,
                boost::unordered::detail::func::const_cast_pointer(
                    boost::addressof(a.node_->value_ptr()->second)));
        return a.release();
    }

    template <typename Alloc, typename Key, typename Mapped>
    inline typename boost::unordered::detail::allocator_traits<Alloc>::pointer
    construct_node_pair(Alloc& alloc, BOOST_FWD_REF(Key) k, BOOST_FWD_REF(Mapped) m)
    {
        node_constructor<Alloc> a(alloc);
        a.create_node();
        boost::unordered::detail::func::call_construct(alloc,
                boost::unordered::detail::func::const_cast_pointer(
                    boost::addressof(a.node_->value_ptr()->first)),
                boost::forward<Key>(k));
        boost::unordered::detail::func::call_construct(alloc,
                boost::unordered::detail::func::const_cast_pointer(
                    boost::addressof(a.node_->value_ptr()->second)),
                boost::forward<Mapped>(m));
        return a.release();
    }
}}}}

#if defined(BOOST_MSVC)
#pragma warning(pop)
#endif

#endif
