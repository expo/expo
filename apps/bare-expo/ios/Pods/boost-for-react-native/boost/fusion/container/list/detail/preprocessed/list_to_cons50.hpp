/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

    This is an auto-generated file. Do not edit!
==============================================================================*/
namespace boost { namespace fusion { namespace detail
{
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27 , typename T28 , typename T29 , typename T30 , typename T31 , typename T32 , typename T33 , typename T34 , typename T35 , typename T36 , typename T37 , typename T38 , typename T39 , typename T40 , typename T41 , typename T42 , typename T43 , typename T44 , typename T45 , typename T46 , typename T47 , typename T48 , typename T49>
    struct list_to_cons
    {
        typedef T0 head_type;
        typedef list_to_cons<
            T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29 , T30 , T31 , T32 , T33 , T34 , T35 , T36 , T37 , T38 , T39 , T40 , T41 , T42 , T43 , T44 , T45 , T46 , T47 , T48 , T49, void_>
        tail_list_to_cons;
        typedef typename tail_list_to_cons::type tail_type;
        typedef cons<head_type, tail_type> type;
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0)
    {
        return type(_0 
            );
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1)
    {
        return type(_0 
            , tail_list_to_cons::call(_1));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43 , typename detail::call_param<T44 >::type _44)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43 , _44));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43 , typename detail::call_param<T44 >::type _44 , typename detail::call_param<T45 >::type _45)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43 , _44 , _45));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43 , typename detail::call_param<T44 >::type _44 , typename detail::call_param<T45 >::type _45 , typename detail::call_param<T46 >::type _46)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43 , _44 , _45 , _46));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43 , typename detail::call_param<T44 >::type _44 , typename detail::call_param<T45 >::type _45 , typename detail::call_param<T46 >::type _46 , typename detail::call_param<T47 >::type _47)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43 , _44 , _45 , _46 , _47));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43 , typename detail::call_param<T44 >::type _44 , typename detail::call_param<T45 >::type _45 , typename detail::call_param<T46 >::type _46 , typename detail::call_param<T47 >::type _47 , typename detail::call_param<T48 >::type _48)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43 , _44 , _45 , _46 , _47 , _48));
    }
    BOOST_FUSION_GPU_ENABLED
    static type
    call(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29 , typename detail::call_param<T30 >::type _30 , typename detail::call_param<T31 >::type _31 , typename detail::call_param<T32 >::type _32 , typename detail::call_param<T33 >::type _33 , typename detail::call_param<T34 >::type _34 , typename detail::call_param<T35 >::type _35 , typename detail::call_param<T36 >::type _36 , typename detail::call_param<T37 >::type _37 , typename detail::call_param<T38 >::type _38 , typename detail::call_param<T39 >::type _39 , typename detail::call_param<T40 >::type _40 , typename detail::call_param<T41 >::type _41 , typename detail::call_param<T42 >::type _42 , typename detail::call_param<T43 >::type _43 , typename detail::call_param<T44 >::type _44 , typename detail::call_param<T45 >::type _45 , typename detail::call_param<T46 >::type _46 , typename detail::call_param<T47 >::type _47 , typename detail::call_param<T48 >::type _48 , typename detail::call_param<T49 >::type _49)
    {
        return type(_0 
            , tail_list_to_cons::call(_1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29 , _30 , _31 , _32 , _33 , _34 , _35 , _36 , _37 , _38 , _39 , _40 , _41 , _42 , _43 , _44 , _45 , _46 , _47 , _48 , _49));
    }
    };
    template <>
    struct list_to_cons<void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_>
    {
        typedef nil_ type;
    };
}}}
