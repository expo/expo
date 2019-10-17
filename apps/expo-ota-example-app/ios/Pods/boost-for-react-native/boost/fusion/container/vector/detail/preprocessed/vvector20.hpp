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
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19>
    struct vector
        : sequence_base<vector<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19> >
    {
    private:
        typedef typename detail::vector_n_chooser<
            T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19>::type
        vector_n;
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19>
        friend struct vector;
    public:
        typedef typename vector_n::types types;
        typedef typename vector_n::fusion_tag fusion_tag;
        typedef typename vector_n::tag tag;
        typedef typename vector_n::size size;
        typedef typename vector_n::category category;
        typedef typename vector_n::is_view is_view;
        BOOST_FUSION_GPU_ENABLED
        vector()
            : vec() {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19>
        BOOST_FUSION_GPU_ENABLED
        vector(vector<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19> const& rhs)
            : vec(rhs.vec) {}
        BOOST_FUSION_GPU_ENABLED
        vector(vector const& rhs)
            : vec(rhs.vec) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector(Sequence const& rhs)
            : vec(BOOST_FUSION_VECTOR_COPY_INIT()) {}
        
        
        
        
        
        
        
    BOOST_FUSION_GPU_ENABLED
    explicit
    vector(typename detail::call_param<T0 >::type _0)
        : vec(_0) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0>
    BOOST_FUSION_GPU_ENABLED
    explicit
    vector(U0 && _0)
        : vec(std::forward<U0>(_0)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1)
        : vec(_0 , _1) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2)
        : vec(_0 , _1 , _2) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3)
        : vec(_0 , _1 , _2 , _3) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4)
        : vec(_0 , _1 , _2 , _3 , _4) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5)
        : vec(_0 , _1 , _2 , _3 , _4 , _5) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18)) {}
# endif
    BOOST_FUSION_GPU_ENABLED
    vector(typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19)
        : vec(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
    template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19>
    BOOST_FUSION_GPU_ENABLED
    vector(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19)
        : vec(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19)) {}
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19>
        BOOST_FUSION_GPU_ENABLED
        vector&
        operator=(vector<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19> const& rhs)
        {
            vec = rhs.vec;
            return *this;
        }
        template <typename T>
        BOOST_FUSION_GPU_ENABLED
        vector&
        operator=(T const& rhs)
        {
            vec = rhs;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector&
        operator=(vector const& rhs)
        {
            vec = rhs.vec;
            return *this;
        }
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        BOOST_FUSION_GPU_ENABLED
        vector(vector&& rhs)
            : vec(std::forward<vector_n>(rhs.vec)) {}
        BOOST_FUSION_GPU_ENABLED
        vector&
        operator=(vector&& rhs)
        {
            vec = std::forward<vector_n>(rhs.vec);
            return *this;
        }
        template <typename T>
        BOOST_FUSION_GPU_ENABLED
        vector&
        operator=(T&& rhs)
        {
            vec = std::forward<T>(rhs);
            return *this;
        }
# endif
        template <int N>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<
            typename mpl::at_c<types, N>::type
        >::type
        at_impl(mpl::int_<N> index)
        {
            return vec.at_impl(index);
        }
        template <int N>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<
            typename add_const<
                typename mpl::at_c<types, N>::type
            >::type
        >::type
        at_impl(mpl::int_<N> index) const
        {
            return vec.at_impl(index);
        }
        template <typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<
            typename mpl::at<types, I>::type
        >::type
        at_impl(I )
        {
            return vec.at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<
            typename add_const<
                typename mpl::at<types, I>::type
            >::type
        >::type
        at_impl(I ) const
        {
            return vec.at_impl(mpl::int_<I::value>());
        }
    private:
        BOOST_FUSION_VECTOR_CTOR_HELPER()
        vector_n vec;
    };
}}
