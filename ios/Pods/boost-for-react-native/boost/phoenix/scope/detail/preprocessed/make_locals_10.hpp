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
