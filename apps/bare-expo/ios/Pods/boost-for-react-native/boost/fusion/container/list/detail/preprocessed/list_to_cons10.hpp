/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

    This is an auto-generated file. Do not edit!
==============================================================================*/
namespace boost { namespace fusion { namespace detail
{
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9>
    struct list_to_cons
    {
        typedef T0 head_type;
        typedef list_to_cons<
            T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9, void_>
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
    };
    template <>
    struct list_to_cons<void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_ , void_>
    {
        typedef nil_ type;
    };
}}}
