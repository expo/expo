/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

    This is an auto-generated file. Do not edit!
==============================================================================*/
namespace boost { namespace fusion
{
    struct vector_tag;
    struct fusion_sequence_tag;
    struct random_access_traversal_tag;
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20>
    struct vector_data21
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data21()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20>
        BOOST_FUSION_GPU_ENABLED
        vector_data21(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) {}
        vector_data21(
            vector_data21&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data21(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data21(
            vector_data21 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data21&
        operator=(vector_data21 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data21
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19);
            return vector_data21(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data21
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19);
            return vector_data21(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20>
    struct vector21
      : vector_data21<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20>
      , sequence_base<vector21<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20> >
    {
        typedef vector21<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20> this_type;
        typedef vector_data21<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20> base_type;
        typedef mpl::vector21<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<21> size;
        BOOST_FUSION_GPU_ENABLED
        vector21() {}
        BOOST_FUSION_GPU_ENABLED
        vector21(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20>
        BOOST_FUSION_GPU_ENABLED
        vector21(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20)) {}
        BOOST_FUSION_GPU_ENABLED
        vector21(vector21&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector21(vector21 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector21&
        operator=(vector21 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector21&
        operator=(vector21&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20>
        BOOST_FUSION_GPU_ENABLED
        vector21(
            vector21<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector21(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector21(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20>
        BOOST_FUSION_GPU_ENABLED
        vector21&
        operator=(vector21<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21>
    struct vector_data22
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data22()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21>
        BOOST_FUSION_GPU_ENABLED
        vector_data22(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) {}
        vector_data22(
            vector_data22&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data22(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data22(
            vector_data22 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data22&
        operator=(vector_data22 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data22
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20);
            return vector_data22(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data22
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20);
            return vector_data22(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21>
    struct vector22
      : vector_data22<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21>
      , sequence_base<vector22<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21> >
    {
        typedef vector22<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21> this_type;
        typedef vector_data22<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21> base_type;
        typedef mpl::vector22<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<22> size;
        BOOST_FUSION_GPU_ENABLED
        vector22() {}
        BOOST_FUSION_GPU_ENABLED
        vector22(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21>
        BOOST_FUSION_GPU_ENABLED
        vector22(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21)) {}
        BOOST_FUSION_GPU_ENABLED
        vector22(vector22&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector22(vector22 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector22&
        operator=(vector22 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector22&
        operator=(vector22&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21>
        BOOST_FUSION_GPU_ENABLED
        vector22(
            vector22<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector22(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector22(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21>
        BOOST_FUSION_GPU_ENABLED
        vector22&
        operator=(vector22<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22>
    struct vector_data23
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data23()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22>
        BOOST_FUSION_GPU_ENABLED
        vector_data23(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) {}
        vector_data23(
            vector_data23&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data23(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data23(
            vector_data23 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data23&
        operator=(vector_data23 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data23
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21);
            return vector_data23(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data23
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21);
            return vector_data23(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22>
    struct vector23
      : vector_data23<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22>
      , sequence_base<vector23<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22> >
    {
        typedef vector23<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22> this_type;
        typedef vector_data23<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22> base_type;
        typedef mpl::vector23<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<23> size;
        BOOST_FUSION_GPU_ENABLED
        vector23() {}
        BOOST_FUSION_GPU_ENABLED
        vector23(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22>
        BOOST_FUSION_GPU_ENABLED
        vector23(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22)) {}
        BOOST_FUSION_GPU_ENABLED
        vector23(vector23&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector23(vector23 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector23&
        operator=(vector23 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector23&
        operator=(vector23&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22>
        BOOST_FUSION_GPU_ENABLED
        vector23(
            vector23<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector23(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector23(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22>
        BOOST_FUSION_GPU_ENABLED
        vector23&
        operator=(vector23<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23>
    struct vector_data24
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data24()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23>
        BOOST_FUSION_GPU_ENABLED
        vector_data24(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) {}
        vector_data24(
            vector_data24&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data24(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data24(
            vector_data24 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data24&
        operator=(vector_data24 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data24
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22);
            return vector_data24(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data24
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22);
            return vector_data24(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23>
    struct vector24
      : vector_data24<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23>
      , sequence_base<vector24<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23> >
    {
        typedef vector24<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23> this_type;
        typedef vector_data24<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23> base_type;
        typedef mpl::vector24<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<24> size;
        BOOST_FUSION_GPU_ENABLED
        vector24() {}
        BOOST_FUSION_GPU_ENABLED
        vector24(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23>
        BOOST_FUSION_GPU_ENABLED
        vector24(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23)) {}
        BOOST_FUSION_GPU_ENABLED
        vector24(vector24&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector24(vector24 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector24&
        operator=(vector24 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector24&
        operator=(vector24&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23>
        BOOST_FUSION_GPU_ENABLED
        vector24(
            vector24<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector24(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector24(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23>
        BOOST_FUSION_GPU_ENABLED
        vector24&
        operator=(vector24<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24>
    struct vector_data25
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data25()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() , m24() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24>
        BOOST_FUSION_GPU_ENABLED
        vector_data25(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) , m24(std::forward<U24>(_24)) {}
        vector_data25(
            vector_data25&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) , m24(std::forward<T24>(other.m24)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data25(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) , m24(_24) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data25(
            vector_data25 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) , m24(other.m24) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data25&
        operator=(vector_data25 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data25
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23);
            return vector_data25(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data25
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23);
            return vector_data25(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23; T24 m24;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24>
    struct vector25
      : vector_data25<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24>
      , sequence_base<vector25<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24> >
    {
        typedef vector25<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24> this_type;
        typedef vector_data25<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24> base_type;
        typedef mpl::vector25<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<25> size;
        BOOST_FUSION_GPU_ENABLED
        vector25() {}
        BOOST_FUSION_GPU_ENABLED
        vector25(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24>
        BOOST_FUSION_GPU_ENABLED
        vector25(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23) , std::forward<U24>(_24)) {}
        BOOST_FUSION_GPU_ENABLED
        vector25(vector25&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector25(vector25 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector25&
        operator=(vector25 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector25&
        operator=(vector25&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23); this->m24 = std::forward< T24>(vec.m24);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24>
        BOOST_FUSION_GPU_ENABLED
        vector25(
            vector25<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23 , vec.m24) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector25(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector25(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24>
        BOOST_FUSION_GPU_ENABLED
        vector25&
        operator=(vector25<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23; this->m24 = *i24;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<T24>::type at_impl(mpl::int_<24>) { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T24>::type>::type at_impl(mpl::int_<24>) const { return this->m24; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25>
    struct vector_data26
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data26()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() , m24() , m25() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25>
        BOOST_FUSION_GPU_ENABLED
        vector_data26(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) , m24(std::forward<U24>(_24)) , m25(std::forward<U25>(_25)) {}
        vector_data26(
            vector_data26&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) , m24(std::forward<T24>(other.m24)) , m25(std::forward<T25>(other.m25)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data26(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) , m24(_24) , m25(_25) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data26(
            vector_data26 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) , m24(other.m24) , m25(other.m25) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data26&
        operator=(vector_data26 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data26
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24);
            return vector_data26(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data26
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24);
            return vector_data26(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23; T24 m24; T25 m25;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25>
    struct vector26
      : vector_data26<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25>
      , sequence_base<vector26<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25> >
    {
        typedef vector26<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25> this_type;
        typedef vector_data26<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25> base_type;
        typedef mpl::vector26<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<26> size;
        BOOST_FUSION_GPU_ENABLED
        vector26() {}
        BOOST_FUSION_GPU_ENABLED
        vector26(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25>
        BOOST_FUSION_GPU_ENABLED
        vector26(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23) , std::forward<U24>(_24) , std::forward<U25>(_25)) {}
        BOOST_FUSION_GPU_ENABLED
        vector26(vector26&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector26(vector26 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector26&
        operator=(vector26 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector26&
        operator=(vector26&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23); this->m24 = std::forward< T24>(vec.m24); this->m25 = std::forward< T25>(vec.m25);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25>
        BOOST_FUSION_GPU_ENABLED
        vector26(
            vector26<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23 , vec.m24 , vec.m25) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector26(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector26(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25>
        BOOST_FUSION_GPU_ENABLED
        vector26&
        operator=(vector26<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23; this->m24 = *i24; this->m25 = *i25;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<T24>::type at_impl(mpl::int_<24>) { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T24>::type>::type at_impl(mpl::int_<24>) const { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<T25>::type at_impl(mpl::int_<25>) { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T25>::type>::type at_impl(mpl::int_<25>) const { return this->m25; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26>
    struct vector_data27
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data27()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() , m24() , m25() , m26() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26>
        BOOST_FUSION_GPU_ENABLED
        vector_data27(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) , m24(std::forward<U24>(_24)) , m25(std::forward<U25>(_25)) , m26(std::forward<U26>(_26)) {}
        vector_data27(
            vector_data27&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) , m24(std::forward<T24>(other.m24)) , m25(std::forward<T25>(other.m25)) , m26(std::forward<T26>(other.m26)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data27(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) , m24(_24) , m25(_25) , m26(_26) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data27(
            vector_data27 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) , m24(other.m24) , m25(other.m25) , m26(other.m26) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data27&
        operator=(vector_data27 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data27
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25);
            return vector_data27(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data27
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25);
            return vector_data27(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23; T24 m24; T25 m25; T26 m26;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26>
    struct vector27
      : vector_data27<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26>
      , sequence_base<vector27<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26> >
    {
        typedef vector27<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26> this_type;
        typedef vector_data27<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26> base_type;
        typedef mpl::vector27<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<27> size;
        BOOST_FUSION_GPU_ENABLED
        vector27() {}
        BOOST_FUSION_GPU_ENABLED
        vector27(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26>
        BOOST_FUSION_GPU_ENABLED
        vector27(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23) , std::forward<U24>(_24) , std::forward<U25>(_25) , std::forward<U26>(_26)) {}
        BOOST_FUSION_GPU_ENABLED
        vector27(vector27&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector27(vector27 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector27&
        operator=(vector27 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector27&
        operator=(vector27&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23); this->m24 = std::forward< T24>(vec.m24); this->m25 = std::forward< T25>(vec.m25); this->m26 = std::forward< T26>(vec.m26);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26>
        BOOST_FUSION_GPU_ENABLED
        vector27(
            vector27<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23 , vec.m24 , vec.m25 , vec.m26) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector27(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector27(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26>
        BOOST_FUSION_GPU_ENABLED
        vector27&
        operator=(vector27<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23; this->m24 = *i24; this->m25 = *i25; this->m26 = *i26;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<T24>::type at_impl(mpl::int_<24>) { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T24>::type>::type at_impl(mpl::int_<24>) const { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<T25>::type at_impl(mpl::int_<25>) { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T25>::type>::type at_impl(mpl::int_<25>) const { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<T26>::type at_impl(mpl::int_<26>) { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T26>::type>::type at_impl(mpl::int_<26>) const { return this->m26; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27>
    struct vector_data28
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data28()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() , m24() , m25() , m26() , m27() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27>
        BOOST_FUSION_GPU_ENABLED
        vector_data28(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26 , U27 && _27
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) , m24(std::forward<U24>(_24)) , m25(std::forward<U25>(_25)) , m26(std::forward<U26>(_26)) , m27(std::forward<U27>(_27)) {}
        vector_data28(
            vector_data28&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) , m24(std::forward<T24>(other.m24)) , m25(std::forward<T25>(other.m25)) , m26(std::forward<T26>(other.m26)) , m27(std::forward<T27>(other.m27)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data28(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) , m24(_24) , m25(_25) , m26(_26) , m27(_27) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data28(
            vector_data28 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) , m24(other.m24) , m25(other.m25) , m26(other.m26) , m27(other.m27) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data28&
        operator=(vector_data28 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26; this->m27 = vec.m27;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data28
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26);
            return vector_data28(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26 , *i27);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data28
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26);
            return vector_data28(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26 , *i27);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23; T24 m24; T25 m25; T26 m26; T27 m27;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27>
    struct vector28
      : vector_data28<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27>
      , sequence_base<vector28<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27> >
    {
        typedef vector28<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27> this_type;
        typedef vector_data28<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27> base_type;
        typedef mpl::vector28<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<28> size;
        BOOST_FUSION_GPU_ENABLED
        vector28() {}
        BOOST_FUSION_GPU_ENABLED
        vector28(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27>
        BOOST_FUSION_GPU_ENABLED
        vector28(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26 , U27 && _27)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23) , std::forward<U24>(_24) , std::forward<U25>(_25) , std::forward<U26>(_26) , std::forward<U27>(_27)) {}
        BOOST_FUSION_GPU_ENABLED
        vector28(vector28&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector28(vector28 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector28&
        operator=(vector28 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector28&
        operator=(vector28&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23); this->m24 = std::forward< T24>(vec.m24); this->m25 = std::forward< T25>(vec.m25); this->m26 = std::forward< T26>(vec.m26); this->m27 = std::forward< T27>(vec.m27);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27>
        BOOST_FUSION_GPU_ENABLED
        vector28(
            vector28<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23 , vec.m24 , vec.m25 , vec.m26 , vec.m27) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector28(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector28(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27>
        BOOST_FUSION_GPU_ENABLED
        vector28&
        operator=(vector28<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26; this->m27 = vec.m27;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23; this->m24 = *i24; this->m25 = *i25; this->m26 = *i26; this->m27 = *i27;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<T24>::type at_impl(mpl::int_<24>) { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T24>::type>::type at_impl(mpl::int_<24>) const { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<T25>::type at_impl(mpl::int_<25>) { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T25>::type>::type at_impl(mpl::int_<25>) const { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<T26>::type at_impl(mpl::int_<26>) { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T26>::type>::type at_impl(mpl::int_<26>) const { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<T27>::type at_impl(mpl::int_<27>) { return this->m27; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T27>::type>::type at_impl(mpl::int_<27>) const { return this->m27; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27 , typename T28>
    struct vector_data29
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data29()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() , m24() , m25() , m26() , m27() , m28() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28>
        BOOST_FUSION_GPU_ENABLED
        vector_data29(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26 , U27 && _27 , U28 && _28
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) , m24(std::forward<U24>(_24)) , m25(std::forward<U25>(_25)) , m26(std::forward<U26>(_26)) , m27(std::forward<U27>(_27)) , m28(std::forward<U28>(_28)) {}
        vector_data29(
            vector_data29&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) , m24(std::forward<T24>(other.m24)) , m25(std::forward<T25>(other.m25)) , m26(std::forward<T26>(other.m26)) , m27(std::forward<T27>(other.m27)) , m28(std::forward<T28>(other.m28)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data29(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) , m24(_24) , m25(_25) , m26(_26) , m27(_27) , m28(_28) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data29(
            vector_data29 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) , m24(other.m24) , m25(other.m25) , m26(other.m26) , m27(other.m27) , m28(other.m28) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data29&
        operator=(vector_data29 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26; this->m27 = vec.m27; this->m28 = vec.m28;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data29
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26); typedef typename result_of::next< I27>::type I28; I28 i28 = fusion::next(i27);
            return vector_data29(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26 , *i27 , *i28);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data29
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26); typedef typename result_of::next< I27>::type I28; I28 i28 = fusion::next(i27);
            return vector_data29(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26 , *i27 , *i28);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23; T24 m24; T25 m25; T26 m26; T27 m27; T28 m28;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27 , typename T28>
    struct vector29
      : vector_data29<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28>
      , sequence_base<vector29<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28> >
    {
        typedef vector29<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28> this_type;
        typedef vector_data29<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28> base_type;
        typedef mpl::vector29<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<29> size;
        BOOST_FUSION_GPU_ENABLED
        vector29() {}
        BOOST_FUSION_GPU_ENABLED
        vector29(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28>
        BOOST_FUSION_GPU_ENABLED
        vector29(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26 , U27 && _27 , U28 && _28)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23) , std::forward<U24>(_24) , std::forward<U25>(_25) , std::forward<U26>(_26) , std::forward<U27>(_27) , std::forward<U28>(_28)) {}
        BOOST_FUSION_GPU_ENABLED
        vector29(vector29&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector29(vector29 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector29&
        operator=(vector29 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector29&
        operator=(vector29&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23); this->m24 = std::forward< T24>(vec.m24); this->m25 = std::forward< T25>(vec.m25); this->m26 = std::forward< T26>(vec.m26); this->m27 = std::forward< T27>(vec.m27); this->m28 = std::forward< T28>(vec.m28);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28>
        BOOST_FUSION_GPU_ENABLED
        vector29(
            vector29<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27 , U28> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23 , vec.m24 , vec.m25 , vec.m26 , vec.m27 , vec.m28) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector29(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector29(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28>
        BOOST_FUSION_GPU_ENABLED
        vector29&
        operator=(vector29<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27 , U28> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26; this->m27 = vec.m27; this->m28 = vec.m28;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26); typedef typename result_of::next< I27>::type I28; I28 i28 = fusion::next(i27);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23; this->m24 = *i24; this->m25 = *i25; this->m26 = *i26; this->m27 = *i27; this->m28 = *i28;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<T24>::type at_impl(mpl::int_<24>) { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T24>::type>::type at_impl(mpl::int_<24>) const { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<T25>::type at_impl(mpl::int_<25>) { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T25>::type>::type at_impl(mpl::int_<25>) const { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<T26>::type at_impl(mpl::int_<26>) { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T26>::type>::type at_impl(mpl::int_<26>) const { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<T27>::type at_impl(mpl::int_<27>) { return this->m27; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T27>::type>::type at_impl(mpl::int_<27>) const { return this->m27; } BOOST_FUSION_GPU_ENABLED typename add_reference<T28>::type at_impl(mpl::int_<28>) { return this->m28; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T28>::type>::type at_impl(mpl::int_<28>) const { return this->m28; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27 , typename T28 , typename T29>
    struct vector_data30
    {
        BOOST_FUSION_GPU_ENABLED
        vector_data30()
            : m0() , m1() , m2() , m3() , m4() , m5() , m6() , m7() , m8() , m9() , m10() , m11() , m12() , m13() , m14() , m15() , m16() , m17() , m18() , m19() , m20() , m21() , m22() , m23() , m24() , m25() , m26() , m27() , m28() , m29() {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28 , typename U29>
        BOOST_FUSION_GPU_ENABLED
        vector_data30(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26 , U27 && _27 , U28 && _28 , U29 && _29
          , typename boost::enable_if<is_convertible<U0, T0> >::type* = 0
        )
            : m0(std::forward<U0>(_0)) , m1(std::forward<U1>(_1)) , m2(std::forward<U2>(_2)) , m3(std::forward<U3>(_3)) , m4(std::forward<U4>(_4)) , m5(std::forward<U5>(_5)) , m6(std::forward<U6>(_6)) , m7(std::forward<U7>(_7)) , m8(std::forward<U8>(_8)) , m9(std::forward<U9>(_9)) , m10(std::forward<U10>(_10)) , m11(std::forward<U11>(_11)) , m12(std::forward<U12>(_12)) , m13(std::forward<U13>(_13)) , m14(std::forward<U14>(_14)) , m15(std::forward<U15>(_15)) , m16(std::forward<U16>(_16)) , m17(std::forward<U17>(_17)) , m18(std::forward<U18>(_18)) , m19(std::forward<U19>(_19)) , m20(std::forward<U20>(_20)) , m21(std::forward<U21>(_21)) , m22(std::forward<U22>(_22)) , m23(std::forward<U23>(_23)) , m24(std::forward<U24>(_24)) , m25(std::forward<U25>(_25)) , m26(std::forward<U26>(_26)) , m27(std::forward<U27>(_27)) , m28(std::forward<U28>(_28)) , m29(std::forward<U29>(_29)) {}
        vector_data30(
            vector_data30&& other)
            : m0(std::forward<T0>(other.m0)) , m1(std::forward<T1>(other.m1)) , m2(std::forward<T2>(other.m2)) , m3(std::forward<T3>(other.m3)) , m4(std::forward<T4>(other.m4)) , m5(std::forward<T5>(other.m5)) , m6(std::forward<T6>(other.m6)) , m7(std::forward<T7>(other.m7)) , m8(std::forward<T8>(other.m8)) , m9(std::forward<T9>(other.m9)) , m10(std::forward<T10>(other.m10)) , m11(std::forward<T11>(other.m11)) , m12(std::forward<T12>(other.m12)) , m13(std::forward<T13>(other.m13)) , m14(std::forward<T14>(other.m14)) , m15(std::forward<T15>(other.m15)) , m16(std::forward<T16>(other.m16)) , m17(std::forward<T17>(other.m17)) , m18(std::forward<T18>(other.m18)) , m19(std::forward<T19>(other.m19)) , m20(std::forward<T20>(other.m20)) , m21(std::forward<T21>(other.m21)) , m22(std::forward<T22>(other.m22)) , m23(std::forward<T23>(other.m23)) , m24(std::forward<T24>(other.m24)) , m25(std::forward<T25>(other.m25)) , m26(std::forward<T26>(other.m26)) , m27(std::forward<T27>(other.m27)) , m28(std::forward<T28>(other.m28)) , m29(std::forward<T29>(other.m29)) {}
# endif
        BOOST_FUSION_GPU_ENABLED
        vector_data30(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29)
            : m0(_0) , m1(_1) , m2(_2) , m3(_3) , m4(_4) , m5(_5) , m6(_6) , m7(_7) , m8(_8) , m9(_9) , m10(_10) , m11(_11) , m12(_12) , m13(_13) , m14(_14) , m15(_15) , m16(_16) , m17(_17) , m18(_18) , m19(_19) , m20(_20) , m21(_21) , m22(_22) , m23(_23) , m24(_24) , m25(_25) , m26(_26) , m27(_27) , m28(_28) , m29(_29) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data30(
            vector_data30 const& other)
            : m0(other.m0) , m1(other.m1) , m2(other.m2) , m3(other.m3) , m4(other.m4) , m5(other.m5) , m6(other.m6) , m7(other.m7) , m8(other.m8) , m9(other.m9) , m10(other.m10) , m11(other.m11) , m12(other.m12) , m13(other.m13) , m14(other.m14) , m15(other.m15) , m16(other.m16) , m17(other.m17) , m18(other.m18) , m19(other.m19) , m20(other.m20) , m21(other.m21) , m22(other.m22) , m23(other.m23) , m24(other.m24) , m25(other.m25) , m26(other.m26) , m27(other.m27) , m28(other.m28) , m29(other.m29) {}
        BOOST_FUSION_GPU_ENABLED
        vector_data30&
        operator=(vector_data30 const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26; this->m27 = vec.m27; this->m28 = vec.m28; this->m29 = vec.m29;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data30
        init_from_sequence(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26); typedef typename result_of::next< I27>::type I28; I28 i28 = fusion::next(i27); typedef typename result_of::next< I28>::type I29; I29 i29 = fusion::next(i28);
            return vector_data30(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26 , *i27 , *i28 , *i29);
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        static vector_data30
        init_from_sequence(Sequence& seq)
        {
            typedef typename result_of::begin<Sequence>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26); typedef typename result_of::next< I27>::type I28; I28 i28 = fusion::next(i27); typedef typename result_of::next< I28>::type I29; I29 i29 = fusion::next(i28);
            return vector_data30(*i0 , *i1 , *i2 , *i3 , *i4 , *i5 , *i6 , *i7 , *i8 , *i9 , *i10 , *i11 , *i12 , *i13 , *i14 , *i15 , *i16 , *i17 , *i18 , *i19 , *i20 , *i21 , *i22 , *i23 , *i24 , *i25 , *i26 , *i27 , *i28 , *i29);
        }
        T0 m0; T1 m1; T2 m2; T3 m3; T4 m4; T5 m5; T6 m6; T7 m7; T8 m8; T9 m9; T10 m10; T11 m11; T12 m12; T13 m13; T14 m14; T15 m15; T16 m16; T17 m17; T18 m18; T19 m19; T20 m20; T21 m21; T22 m22; T23 m23; T24 m24; T25 m25; T26 m26; T27 m27; T28 m28; T29 m29;
    };
    template <typename T0 , typename T1 , typename T2 , typename T3 , typename T4 , typename T5 , typename T6 , typename T7 , typename T8 , typename T9 , typename T10 , typename T11 , typename T12 , typename T13 , typename T14 , typename T15 , typename T16 , typename T17 , typename T18 , typename T19 , typename T20 , typename T21 , typename T22 , typename T23 , typename T24 , typename T25 , typename T26 , typename T27 , typename T28 , typename T29>
    struct vector30
      : vector_data30<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29>
      , sequence_base<vector30<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29> >
    {
        typedef vector30<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29> this_type;
        typedef vector_data30<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29> base_type;
        typedef mpl::vector30<T0 , T1 , T2 , T3 , T4 , T5 , T6 , T7 , T8 , T9 , T10 , T11 , T12 , T13 , T14 , T15 , T16 , T17 , T18 , T19 , T20 , T21 , T22 , T23 , T24 , T25 , T26 , T27 , T28 , T29> types;
        typedef vector_tag fusion_tag;
        typedef fusion_sequence_tag tag; 
        typedef mpl::false_ is_view;
        typedef random_access_traversal_tag category;
        typedef mpl::int_<30> size;
        BOOST_FUSION_GPU_ENABLED
        vector30() {}
        BOOST_FUSION_GPU_ENABLED
        vector30(
            typename detail::call_param<T0 >::type _0 , typename detail::call_param<T1 >::type _1 , typename detail::call_param<T2 >::type _2 , typename detail::call_param<T3 >::type _3 , typename detail::call_param<T4 >::type _4 , typename detail::call_param<T5 >::type _5 , typename detail::call_param<T6 >::type _6 , typename detail::call_param<T7 >::type _7 , typename detail::call_param<T8 >::type _8 , typename detail::call_param<T9 >::type _9 , typename detail::call_param<T10 >::type _10 , typename detail::call_param<T11 >::type _11 , typename detail::call_param<T12 >::type _12 , typename detail::call_param<T13 >::type _13 , typename detail::call_param<T14 >::type _14 , typename detail::call_param<T15 >::type _15 , typename detail::call_param<T16 >::type _16 , typename detail::call_param<T17 >::type _17 , typename detail::call_param<T18 >::type _18 , typename detail::call_param<T19 >::type _19 , typename detail::call_param<T20 >::type _20 , typename detail::call_param<T21 >::type _21 , typename detail::call_param<T22 >::type _22 , typename detail::call_param<T23 >::type _23 , typename detail::call_param<T24 >::type _24 , typename detail::call_param<T25 >::type _25 , typename detail::call_param<T26 >::type _26 , typename detail::call_param<T27 >::type _27 , typename detail::call_param<T28 >::type _28 , typename detail::call_param<T29 >::type _29)
            : base_type(_0 , _1 , _2 , _3 , _4 , _5 , _6 , _7 , _8 , _9 , _10 , _11 , _12 , _13 , _14 , _15 , _16 , _17 , _18 , _19 , _20 , _21 , _22 , _23 , _24 , _25 , _26 , _27 , _28 , _29) {}
# if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28 , typename U29>
        BOOST_FUSION_GPU_ENABLED
        vector30(U0 && _0 , U1 && _1 , U2 && _2 , U3 && _3 , U4 && _4 , U5 && _5 , U6 && _6 , U7 && _7 , U8 && _8 , U9 && _9 , U10 && _10 , U11 && _11 , U12 && _12 , U13 && _13 , U14 && _14 , U15 && _15 , U16 && _16 , U17 && _17 , U18 && _18 , U19 && _19 , U20 && _20 , U21 && _21 , U22 && _22 , U23 && _23 , U24 && _24 , U25 && _25 , U26 && _26 , U27 && _27 , U28 && _28 , U29 && _29)
            : base_type(std::forward<U0>(_0) , std::forward<U1>(_1) , std::forward<U2>(_2) , std::forward<U3>(_3) , std::forward<U4>(_4) , std::forward<U5>(_5) , std::forward<U6>(_6) , std::forward<U7>(_7) , std::forward<U8>(_8) , std::forward<U9>(_9) , std::forward<U10>(_10) , std::forward<U11>(_11) , std::forward<U12>(_12) , std::forward<U13>(_13) , std::forward<U14>(_14) , std::forward<U15>(_15) , std::forward<U16>(_16) , std::forward<U17>(_17) , std::forward<U18>(_18) , std::forward<U19>(_19) , std::forward<U20>(_20) , std::forward<U21>(_21) , std::forward<U22>(_22) , std::forward<U23>(_23) , std::forward<U24>(_24) , std::forward<U25>(_25) , std::forward<U26>(_26) , std::forward<U27>(_27) , std::forward<U28>(_28) , std::forward<U29>(_29)) {}
        BOOST_FUSION_GPU_ENABLED
        vector30(vector30&& rhs)
            : base_type(std::forward<base_type>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector30(vector30 const& rhs)
            : base_type(static_cast<base_type const&>(rhs)) {}
        BOOST_FUSION_GPU_ENABLED
        vector30&
        operator=(vector30 const& vec)
        {
            base_type::operator=(vec);
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED
        vector30&
        operator=(vector30&& vec)
        {
            this->m0 = std::forward< T0>(vec.m0); this->m1 = std::forward< T1>(vec.m1); this->m2 = std::forward< T2>(vec.m2); this->m3 = std::forward< T3>(vec.m3); this->m4 = std::forward< T4>(vec.m4); this->m5 = std::forward< T5>(vec.m5); this->m6 = std::forward< T6>(vec.m6); this->m7 = std::forward< T7>(vec.m7); this->m8 = std::forward< T8>(vec.m8); this->m9 = std::forward< T9>(vec.m9); this->m10 = std::forward< T10>(vec.m10); this->m11 = std::forward< T11>(vec.m11); this->m12 = std::forward< T12>(vec.m12); this->m13 = std::forward< T13>(vec.m13); this->m14 = std::forward< T14>(vec.m14); this->m15 = std::forward< T15>(vec.m15); this->m16 = std::forward< T16>(vec.m16); this->m17 = std::forward< T17>(vec.m17); this->m18 = std::forward< T18>(vec.m18); this->m19 = std::forward< T19>(vec.m19); this->m20 = std::forward< T20>(vec.m20); this->m21 = std::forward< T21>(vec.m21); this->m22 = std::forward< T22>(vec.m22); this->m23 = std::forward< T23>(vec.m23); this->m24 = std::forward< T24>(vec.m24); this->m25 = std::forward< T25>(vec.m25); this->m26 = std::forward< T26>(vec.m26); this->m27 = std::forward< T27>(vec.m27); this->m28 = std::forward< T28>(vec.m28); this->m29 = std::forward< T29>(vec.m29);
            return *this;
        }
# endif
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28 , typename U29>
        BOOST_FUSION_GPU_ENABLED
        vector30(
            vector30<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27 , U28 , U29> const& vec)
            : base_type(vec.m0 , vec.m1 , vec.m2 , vec.m3 , vec.m4 , vec.m5 , vec.m6 , vec.m7 , vec.m8 , vec.m9 , vec.m10 , vec.m11 , vec.m12 , vec.m13 , vec.m14 , vec.m15 , vec.m16 , vec.m17 , vec.m18 , vec.m19 , vec.m20 , vec.m21 , vec.m22 , vec.m23 , vec.m24 , vec.m25 , vec.m26 , vec.m27 , vec.m28 , vec.m29) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector30(
            Sequence const& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        vector30(
            Sequence& seq
            )
            : base_type(base_type::init_from_sequence(seq)) {}
        template <typename U0 , typename U1 , typename U2 , typename U3 , typename U4 , typename U5 , typename U6 , typename U7 , typename U8 , typename U9 , typename U10 , typename U11 , typename U12 , typename U13 , typename U14 , typename U15 , typename U16 , typename U17 , typename U18 , typename U19 , typename U20 , typename U21 , typename U22 , typename U23 , typename U24 , typename U25 , typename U26 , typename U27 , typename U28 , typename U29>
        BOOST_FUSION_GPU_ENABLED
        vector30&
        operator=(vector30<U0 , U1 , U2 , U3 , U4 , U5 , U6 , U7 , U8 , U9 , U10 , U11 , U12 , U13 , U14 , U15 , U16 , U17 , U18 , U19 , U20 , U21 , U22 , U23 , U24 , U25 , U26 , U27 , U28 , U29> const& vec)
        {
            this->m0 = vec.m0; this->m1 = vec.m1; this->m2 = vec.m2; this->m3 = vec.m3; this->m4 = vec.m4; this->m5 = vec.m5; this->m6 = vec.m6; this->m7 = vec.m7; this->m8 = vec.m8; this->m9 = vec.m9; this->m10 = vec.m10; this->m11 = vec.m11; this->m12 = vec.m12; this->m13 = vec.m13; this->m14 = vec.m14; this->m15 = vec.m15; this->m16 = vec.m16; this->m17 = vec.m17; this->m18 = vec.m18; this->m19 = vec.m19; this->m20 = vec.m20; this->m21 = vec.m21; this->m22 = vec.m22; this->m23 = vec.m23; this->m24 = vec.m24; this->m25 = vec.m25; this->m26 = vec.m26; this->m27 = vec.m27; this->m28 = vec.m28; this->m29 = vec.m29;
            return *this;
        }
        template <typename Sequence>
        BOOST_FUSION_GPU_ENABLED
        typename boost::disable_if<is_convertible<Sequence, T0>, this_type&>::type
        operator=(Sequence const& seq)
        {
            typedef typename result_of::begin<Sequence const>::type I0;
            I0 i0 = fusion::begin(seq);
            typedef typename result_of::next< I0>::type I1; I1 i1 = fusion::next(i0); typedef typename result_of::next< I1>::type I2; I2 i2 = fusion::next(i1); typedef typename result_of::next< I2>::type I3; I3 i3 = fusion::next(i2); typedef typename result_of::next< I3>::type I4; I4 i4 = fusion::next(i3); typedef typename result_of::next< I4>::type I5; I5 i5 = fusion::next(i4); typedef typename result_of::next< I5>::type I6; I6 i6 = fusion::next(i5); typedef typename result_of::next< I6>::type I7; I7 i7 = fusion::next(i6); typedef typename result_of::next< I7>::type I8; I8 i8 = fusion::next(i7); typedef typename result_of::next< I8>::type I9; I9 i9 = fusion::next(i8); typedef typename result_of::next< I9>::type I10; I10 i10 = fusion::next(i9); typedef typename result_of::next< I10>::type I11; I11 i11 = fusion::next(i10); typedef typename result_of::next< I11>::type I12; I12 i12 = fusion::next(i11); typedef typename result_of::next< I12>::type I13; I13 i13 = fusion::next(i12); typedef typename result_of::next< I13>::type I14; I14 i14 = fusion::next(i13); typedef typename result_of::next< I14>::type I15; I15 i15 = fusion::next(i14); typedef typename result_of::next< I15>::type I16; I16 i16 = fusion::next(i15); typedef typename result_of::next< I16>::type I17; I17 i17 = fusion::next(i16); typedef typename result_of::next< I17>::type I18; I18 i18 = fusion::next(i17); typedef typename result_of::next< I18>::type I19; I19 i19 = fusion::next(i18); typedef typename result_of::next< I19>::type I20; I20 i20 = fusion::next(i19); typedef typename result_of::next< I20>::type I21; I21 i21 = fusion::next(i20); typedef typename result_of::next< I21>::type I22; I22 i22 = fusion::next(i21); typedef typename result_of::next< I22>::type I23; I23 i23 = fusion::next(i22); typedef typename result_of::next< I23>::type I24; I24 i24 = fusion::next(i23); typedef typename result_of::next< I24>::type I25; I25 i25 = fusion::next(i24); typedef typename result_of::next< I25>::type I26; I26 i26 = fusion::next(i25); typedef typename result_of::next< I26>::type I27; I27 i27 = fusion::next(i26); typedef typename result_of::next< I27>::type I28; I28 i28 = fusion::next(i27); typedef typename result_of::next< I28>::type I29; I29 i29 = fusion::next(i28);
            this->m0 = *i0; this->m1 = *i1; this->m2 = *i2; this->m3 = *i3; this->m4 = *i4; this->m5 = *i5; this->m6 = *i6; this->m7 = *i7; this->m8 = *i8; this->m9 = *i9; this->m10 = *i10; this->m11 = *i11; this->m12 = *i12; this->m13 = *i13; this->m14 = *i14; this->m15 = *i15; this->m16 = *i16; this->m17 = *i17; this->m18 = *i18; this->m19 = *i19; this->m20 = *i20; this->m21 = *i21; this->m22 = *i22; this->m23 = *i23; this->m24 = *i24; this->m25 = *i25; this->m26 = *i26; this->m27 = *i27; this->m28 = *i28; this->m29 = *i29;
            return *this;
        }
        BOOST_FUSION_GPU_ENABLED typename add_reference<T0>::type at_impl(mpl::int_<0>) { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T0>::type>::type at_impl(mpl::int_<0>) const { return this->m0; } BOOST_FUSION_GPU_ENABLED typename add_reference<T1>::type at_impl(mpl::int_<1>) { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T1>::type>::type at_impl(mpl::int_<1>) const { return this->m1; } BOOST_FUSION_GPU_ENABLED typename add_reference<T2>::type at_impl(mpl::int_<2>) { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T2>::type>::type at_impl(mpl::int_<2>) const { return this->m2; } BOOST_FUSION_GPU_ENABLED typename add_reference<T3>::type at_impl(mpl::int_<3>) { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T3>::type>::type at_impl(mpl::int_<3>) const { return this->m3; } BOOST_FUSION_GPU_ENABLED typename add_reference<T4>::type at_impl(mpl::int_<4>) { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T4>::type>::type at_impl(mpl::int_<4>) const { return this->m4; } BOOST_FUSION_GPU_ENABLED typename add_reference<T5>::type at_impl(mpl::int_<5>) { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T5>::type>::type at_impl(mpl::int_<5>) const { return this->m5; } BOOST_FUSION_GPU_ENABLED typename add_reference<T6>::type at_impl(mpl::int_<6>) { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T6>::type>::type at_impl(mpl::int_<6>) const { return this->m6; } BOOST_FUSION_GPU_ENABLED typename add_reference<T7>::type at_impl(mpl::int_<7>) { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T7>::type>::type at_impl(mpl::int_<7>) const { return this->m7; } BOOST_FUSION_GPU_ENABLED typename add_reference<T8>::type at_impl(mpl::int_<8>) { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T8>::type>::type at_impl(mpl::int_<8>) const { return this->m8; } BOOST_FUSION_GPU_ENABLED typename add_reference<T9>::type at_impl(mpl::int_<9>) { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T9>::type>::type at_impl(mpl::int_<9>) const { return this->m9; } BOOST_FUSION_GPU_ENABLED typename add_reference<T10>::type at_impl(mpl::int_<10>) { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T10>::type>::type at_impl(mpl::int_<10>) const { return this->m10; } BOOST_FUSION_GPU_ENABLED typename add_reference<T11>::type at_impl(mpl::int_<11>) { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T11>::type>::type at_impl(mpl::int_<11>) const { return this->m11; } BOOST_FUSION_GPU_ENABLED typename add_reference<T12>::type at_impl(mpl::int_<12>) { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T12>::type>::type at_impl(mpl::int_<12>) const { return this->m12; } BOOST_FUSION_GPU_ENABLED typename add_reference<T13>::type at_impl(mpl::int_<13>) { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T13>::type>::type at_impl(mpl::int_<13>) const { return this->m13; } BOOST_FUSION_GPU_ENABLED typename add_reference<T14>::type at_impl(mpl::int_<14>) { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T14>::type>::type at_impl(mpl::int_<14>) const { return this->m14; } BOOST_FUSION_GPU_ENABLED typename add_reference<T15>::type at_impl(mpl::int_<15>) { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T15>::type>::type at_impl(mpl::int_<15>) const { return this->m15; } BOOST_FUSION_GPU_ENABLED typename add_reference<T16>::type at_impl(mpl::int_<16>) { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T16>::type>::type at_impl(mpl::int_<16>) const { return this->m16; } BOOST_FUSION_GPU_ENABLED typename add_reference<T17>::type at_impl(mpl::int_<17>) { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T17>::type>::type at_impl(mpl::int_<17>) const { return this->m17; } BOOST_FUSION_GPU_ENABLED typename add_reference<T18>::type at_impl(mpl::int_<18>) { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T18>::type>::type at_impl(mpl::int_<18>) const { return this->m18; } BOOST_FUSION_GPU_ENABLED typename add_reference<T19>::type at_impl(mpl::int_<19>) { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T19>::type>::type at_impl(mpl::int_<19>) const { return this->m19; } BOOST_FUSION_GPU_ENABLED typename add_reference<T20>::type at_impl(mpl::int_<20>) { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T20>::type>::type at_impl(mpl::int_<20>) const { return this->m20; } BOOST_FUSION_GPU_ENABLED typename add_reference<T21>::type at_impl(mpl::int_<21>) { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T21>::type>::type at_impl(mpl::int_<21>) const { return this->m21; } BOOST_FUSION_GPU_ENABLED typename add_reference<T22>::type at_impl(mpl::int_<22>) { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T22>::type>::type at_impl(mpl::int_<22>) const { return this->m22; } BOOST_FUSION_GPU_ENABLED typename add_reference<T23>::type at_impl(mpl::int_<23>) { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T23>::type>::type at_impl(mpl::int_<23>) const { return this->m23; } BOOST_FUSION_GPU_ENABLED typename add_reference<T24>::type at_impl(mpl::int_<24>) { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T24>::type>::type at_impl(mpl::int_<24>) const { return this->m24; } BOOST_FUSION_GPU_ENABLED typename add_reference<T25>::type at_impl(mpl::int_<25>) { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T25>::type>::type at_impl(mpl::int_<25>) const { return this->m25; } BOOST_FUSION_GPU_ENABLED typename add_reference<T26>::type at_impl(mpl::int_<26>) { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T26>::type>::type at_impl(mpl::int_<26>) const { return this->m26; } BOOST_FUSION_GPU_ENABLED typename add_reference<T27>::type at_impl(mpl::int_<27>) { return this->m27; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T27>::type>::type at_impl(mpl::int_<27>) const { return this->m27; } BOOST_FUSION_GPU_ENABLED typename add_reference<T28>::type at_impl(mpl::int_<28>) { return this->m28; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T28>::type>::type at_impl(mpl::int_<28>) const { return this->m28; } BOOST_FUSION_GPU_ENABLED typename add_reference<T29>::type at_impl(mpl::int_<29>) { return this->m29; } BOOST_FUSION_GPU_ENABLED typename add_reference<typename add_const<T29>::type>::type at_impl(mpl::int_<29>) const { return this->m29; }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename mpl::at<types, I>::type>::type
        at_impl(I)
        {
            return this->at_impl(mpl::int_<I::value>());
        }
        template<typename I>
        BOOST_FUSION_GPU_ENABLED
        typename add_reference<typename add_const<typename mpl::at<types, I>::type>::type>::type
        at_impl(I) const
        {
            return this->at_impl(mpl::int_<I::value>());
        }
    };
}}
