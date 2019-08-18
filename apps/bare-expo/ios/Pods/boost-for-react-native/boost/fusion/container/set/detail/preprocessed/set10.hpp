/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

    This is an auto-generated file. Do not edit!
==============================================================================*/
namespace boost { namespace fusion
{
    struct void_;
    struct fusion_sequence_tag;
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9>
    struct set : sequence_base<set<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9> >
    {
        struct category : forward_traversal_tag, associative_tag {};
        typedef set_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef vector<
            T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9>
        storage_type;
        typedef typename storage_type::size size;
        BOOST_FUSION_GPU_ENABLED
        set()
            : data() {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        set(Sequence const& rhs)
            : data(rhs) {}
    BOOST_FUSION_GPU_ENABLED
    explicit
    set(typename detail::call_param<T0 >::type _0)
        : data(_0) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1)
        : data(_0 , _1) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2)
        : data(_0 , _1 , _2) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3)
        : data(_0 , _1 , _2 , _3) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4)
        : data(_0 , _1 , _2 , _3 , _4) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5)
        : data(_0 , _1 , _2 , _3 , _4 , _5) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6)
        : data(_0 , _1 , _2 , _3 , _4 , _5 , _6) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7)
        : data(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8)
        : data(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8) {}
    BOOST_FUSION_GPU_ENABLED
    set(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9)
        : data(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9) {}
        template <typename T>
        BOOST_FUSION_GPU_ENABLED
        set&
        operator=(T const& rhs)
        {
            data = rhs;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        storage_type& get_data() { return data; }
        BOOST_FUSION_GPU_ENABLED
        storage_type const& get_data() const { return data; }
    private:
        storage_type data;
    };
}}
