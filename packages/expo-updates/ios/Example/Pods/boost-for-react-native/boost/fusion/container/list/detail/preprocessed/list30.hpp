/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

    This is an auto-generated file. Do not edit!
==============================================================================*/
namespace boost { namespace fusion
{
    struct nil_;
    struct void_;
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27 , typename T28 , typename T29>
    struct list
        : detail::list_to_cons<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29>::type
    {
    private:
        typedef
            detail::list_to_cons<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29>
        list_to_cons;
    public:
        typedef typename list_to_cons::type inherited_type;
        BOOST_FUSION_GPU_ENABLED
        list()
            : inherited_type() {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28 , typename U29>
        BOOST_FUSION_GPU_ENABLED
        list(list<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27 , U28 , U29> const& rhs)
            : inherited_type(rhs) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        list(Sequence const& rhs)
            : inherited_type(rhs) {}
        
        
        
        
        
        
        
    BOOST_FUSION_GPU_ENABLED
    explicit
    list(typename detail::call_param<T0 >::type _0)
        : inherited_type(list_to_cons::call(_0))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1)
        : inherited_type(list_to_cons::call(_0 , _1))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2)
        : inherited_type(list_to_cons::call(_0 , _1 , _2))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28))
    {}
    BOOST_FUSION_GPU_ENABLED
    list(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29)
        : inherited_type(list_to_cons::call(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29))
    {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28 , typename U29>
        BOOST_FUSION_GPU_ENABLED
        list&
        operator=(list<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27 , U28 , U29> const& rhs)
        {
            inherited_type::operator=(rhs);
            return *this;
        }
        template <typename T>
        BOOST_FUSION_GPU_ENABLED
        list&
        operator=(T const& rhs)
        {
            inherited_type::operator=(rhs);
            return *this;
        }
    };
}}
