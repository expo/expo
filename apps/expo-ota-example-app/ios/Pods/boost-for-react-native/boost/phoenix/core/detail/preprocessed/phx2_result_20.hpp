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
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 & , A17 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const& , A17 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>::type type;
        };
    
    
    
    
    
    
    
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        struct has_phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>
            : mpl::eval_if<
                has_result_type<F>
              , mpl::false_
              , has_phx2_result_impl<typename F::template result<F(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18)> >
            >::type
        {};
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        struct phx2_result<F, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        struct phx2_result<F, A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 & , A17 & , A18 &>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>::type type;
        };
        
        template <typename F, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        struct phx2_result<F, A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const& , A17 const& , A18 const&>
        {
            typedef typename F::template result<A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>::type type;
        };
