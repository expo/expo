/*=============================================================================
    Copyright (c) 2011 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
    
    
    
    
    
    
    
        template <typename F, typename A0>
        struct has_phx2_result<F, A0>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0)> >
            >::type
        {};
        template <typename F, typename A0>
        struct phx2_result<F, A0>
        {
            typedef typename F::template result<A0>::type type;
        };
        
        template <typename F, typename A0>
        struct phx2_result<F, A0 &>
        {
            typedef typename F::template result<A0>::type type;
        };
        
        template <typename F, typename A0>
        struct phx2_result<F, A0 const&>
        {
            typedef typename F::template result<A0>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1>
        struct has_phx2_result<F, A0 , A1>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1>
        struct phx2_result<F, A0 , A1>
        {
            typedef typename F::template result<A0 , A1>::type type;
        };
        
        template <typename F, typename A0 , typename A1>
        struct phx2_result<F, A0 & , A1 &>
        {
            typedef typename F::template result<A0 , A1>::type type;
        };
        
        template <typename F, typename A0 , typename A1>
        struct phx2_result<F, A0 const& , A1 const&>
        {
            typedef typename F::template result<A0 , A1>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2>
        struct has_phx2_result<F, A0 , A1 , A2>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2>
        struct phx2_result<F, A0 , A1 , A2>
        {
            typedef typename F::template result<A0 , A1 , A2>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2>
        struct phx2_result<F, A0 & , A1 & , A2 &>
        {
            typedef typename F::template result<A0 , A1 , A2>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2>
        struct phx2_result<F, A0 const& , A1 const& , A2 const&>
        {
            typedef typename F::template result<A0 , A1 , A2>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3>
        struct has_phx2_result<F, A0 , A1 , A2 , A3>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3>
        struct phx2_result<F, A0 , A1 , A2 , A3>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>::type type;
        };
