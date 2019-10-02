/*==============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
    
    
    
    
    
    
    
        template <typename A0>
        struct make_locals<A0>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0>
            > type;
            static type const make(A0 a0)
            {
                return
                    type(
                        proto::child_c<1>(a0)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1>
        struct make_locals<A0 , A1>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1>
            > type;
            static type const make(A0 a0 , A1 a1)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2>
        struct make_locals<A0 , A1 , A2>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3>
        struct make_locals<A0 , A1 , A2 , A3>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        struct make_locals<A0 , A1 , A2 , A3 , A4>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13; typedef typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type tag_type14; typedef typename proto::result_of::child_c< A14 , 1 >::type var_type14;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13> , fusion::pair<tag_type14, var_type14>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13 , A14 a14)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13; typedef typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type tag_type14; typedef typename proto::result_of::child_c< A14 , 1 >::type var_type14; typedef typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type tag_type15; typedef typename proto::result_of::child_c< A15 , 1 >::type var_type15;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13> , fusion::pair<tag_type14, var_type14> , fusion::pair<tag_type15, var_type15>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13 , A14 a14 , A15 a15)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13; typedef typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type tag_type14; typedef typename proto::result_of::child_c< A14 , 1 >::type var_type14; typedef typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type tag_type15; typedef typename proto::result_of::child_c< A15 , 1 >::type var_type15; typedef typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type tag_type16; typedef typename proto::result_of::child_c< A16 , 1 >::type var_type16;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13> , fusion::pair<tag_type14, var_type14> , fusion::pair<tag_type15, var_type15> , fusion::pair<tag_type16, var_type16>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13 , A14 a14 , A15 a15 , A16 a16)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13; typedef typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type tag_type14; typedef typename proto::result_of::child_c< A14 , 1 >::type var_type14; typedef typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type tag_type15; typedef typename proto::result_of::child_c< A15 , 1 >::type var_type15; typedef typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type tag_type16; typedef typename proto::result_of::child_c< A16 , 1 >::type var_type16; typedef typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type tag_type17; typedef typename proto::result_of::child_c< A17 , 1 >::type var_type17;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13> , fusion::pair<tag_type14, var_type14> , fusion::pair<tag_type15, var_type15> , fusion::pair<tag_type16, var_type16> , fusion::pair<tag_type17, var_type17>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13 , A14 a14 , A15 a15 , A16 a16 , A17 a17)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16) , proto::child_c<1>(a17)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13; typedef typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type tag_type14; typedef typename proto::result_of::child_c< A14 , 1 >::type var_type14; typedef typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type tag_type15; typedef typename proto::result_of::child_c< A15 , 1 >::type var_type15; typedef typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type tag_type16; typedef typename proto::result_of::child_c< A16 , 1 >::type var_type16; typedef typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type tag_type17; typedef typename proto::result_of::child_c< A17 , 1 >::type var_type17; typedef typename proto::result_of::value< typename proto::result_of::child_c< A18 , 0 >::type >::type tag_type18; typedef typename proto::result_of::child_c< A18 , 1 >::type var_type18;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13> , fusion::pair<tag_type14, var_type14> , fusion::pair<tag_type15, var_type15> , fusion::pair<tag_type16, var_type16> , fusion::pair<tag_type17, var_type17> , fusion::pair<tag_type18, var_type18>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13 , A14 a14 , A15 a15 , A16 a16 , A17 a17 , A18 a18)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16) , proto::child_c<1>(a17) , proto::child_c<1>(a18)
                    );
            }
        };
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18 , typename A19>
        struct make_locals<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18 , A19>
        {
            typedef typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type tag_type0; typedef typename proto::result_of::child_c< A0 , 1 >::type var_type0; typedef typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type tag_type1; typedef typename proto::result_of::child_c< A1 , 1 >::type var_type1; typedef typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type tag_type2; typedef typename proto::result_of::child_c< A2 , 1 >::type var_type2; typedef typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type tag_type3; typedef typename proto::result_of::child_c< A3 , 1 >::type var_type3; typedef typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type tag_type4; typedef typename proto::result_of::child_c< A4 , 1 >::type var_type4; typedef typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type tag_type5; typedef typename proto::result_of::child_c< A5 , 1 >::type var_type5; typedef typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type tag_type6; typedef typename proto::result_of::child_c< A6 , 1 >::type var_type6; typedef typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type tag_type7; typedef typename proto::result_of::child_c< A7 , 1 >::type var_type7; typedef typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type tag_type8; typedef typename proto::result_of::child_c< A8 , 1 >::type var_type8; typedef typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type tag_type9; typedef typename proto::result_of::child_c< A9 , 1 >::type var_type9; typedef typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type tag_type10; typedef typename proto::result_of::child_c< A10 , 1 >::type var_type10; typedef typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type tag_type11; typedef typename proto::result_of::child_c< A11 , 1 >::type var_type11; typedef typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type tag_type12; typedef typename proto::result_of::child_c< A12 , 1 >::type var_type12; typedef typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type tag_type13; typedef typename proto::result_of::child_c< A13 , 1 >::type var_type13; typedef typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type tag_type14; typedef typename proto::result_of::child_c< A14 , 1 >::type var_type14; typedef typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type tag_type15; typedef typename proto::result_of::child_c< A15 , 1 >::type var_type15; typedef typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type tag_type16; typedef typename proto::result_of::child_c< A16 , 1 >::type var_type16; typedef typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type tag_type17; typedef typename proto::result_of::child_c< A17 , 1 >::type var_type17; typedef typename proto::result_of::value< typename proto::result_of::child_c< A18 , 0 >::type >::type tag_type18; typedef typename proto::result_of::child_c< A18 , 1 >::type var_type18; typedef typename proto::result_of::value< typename proto::result_of::child_c< A19 , 0 >::type >::type tag_type19; typedef typename proto::result_of::child_c< A19 , 1 >::type var_type19;
            typedef fusion::map<
                fusion::pair<tag_type0, var_type0> , fusion::pair<tag_type1, var_type1> , fusion::pair<tag_type2, var_type2> , fusion::pair<tag_type3, var_type3> , fusion::pair<tag_type4, var_type4> , fusion::pair<tag_type5, var_type5> , fusion::pair<tag_type6, var_type6> , fusion::pair<tag_type7, var_type7> , fusion::pair<tag_type8, var_type8> , fusion::pair<tag_type9, var_type9> , fusion::pair<tag_type10, var_type10> , fusion::pair<tag_type11, var_type11> , fusion::pair<tag_type12, var_type12> , fusion::pair<tag_type13, var_type13> , fusion::pair<tag_type14, var_type14> , fusion::pair<tag_type15, var_type15> , fusion::pair<tag_type16, var_type16> , fusion::pair<tag_type17, var_type17> , fusion::pair<tag_type18, var_type18> , fusion::pair<tag_type19, var_type19>
            > type;
            static type const make(A0 a0 , A1 a1 , A2 a2 , A3 a3 , A4 a4 , A5 a5 , A6 a6 , A7 a7 , A8 a8 , A9 a9 , A10 a10 , A11 a11 , A12 a12 , A13 a13 , A14 a14 , A15 a15 , A16 a16 , A17 a17 , A18 a18 , A19 a19)
            {
                return
                    type(
                        proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16) , proto::child_c<1>(a17) , proto::child_c<1>(a18) , proto::child_c<1>(a19)
                    );
            }
        };
