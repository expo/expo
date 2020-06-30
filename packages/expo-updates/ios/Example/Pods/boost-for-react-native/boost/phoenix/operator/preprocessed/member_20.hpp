/*==============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
namespace boost { namespace phoenix
{
    namespace expression { template <typename Lhs, typename Rhs> struct mem_ptr : expr<proto::tag:: mem_ptr, Lhs, Rhs> {}; } namespace rule { struct mem_ptr : expression:: mem_ptr<meta_grammar, meta_grammar> {}; } template <typename Dummy> struct meta_grammar::case_<proto::tag:: mem_ptr, Dummy> : enable_rule<rule:: mem_ptr, Dummy> {}; namespace functional { typedef proto::functional::make_expr<proto::tag:: mem_ptr> make_mem_ptr; } namespace result_of { template <typename Lhs, typename Rhs> struct make_mem_ptr : boost::result_of< functional:: make_mem_ptr( Lhs, Rhs ) > {}; } template <typename Rhs, typename Lhs> inline typename result_of::make_mem_ptr<Rhs, Lhs>::type make_mem_ptr(Lhs const & lhs, Rhs const & rhs) { return functional::make_mem_ptr()(lhs, rhs); }
    template<>
    struct phoenix_generator::case_<proto::tag::mem_ptr>
      : proto::or_<
            proto::when<
                proto::and_<
                    proto::mem_ptr<meta_grammar, proto::terminal<proto::_> >
                  , proto::if_<is_member_function_pointer<boost::remove_reference<proto::call<proto::_value(proto::_right)> > >()>
                >
              , proto::call<detail::make_mem_fun_ptr_gen(proto::_left, proto::call<proto::_value(proto::_right)>)>
            >
          , proto::otherwise<
                proto::call<proto::pod_generator<actor>(proto::_)>
            >
        >
    {};
    namespace result_of
    {
        template <
            typename Context
          , typename A0 = void , typename A1 = void , typename A2 = void , typename A3 = void , typename A4 = void , typename A5 = void , typename A6 = void , typename A7 = void , typename A8 = void , typename A9 = void , typename A10 = void , typename A11 = void , typename A12 = void , typename A13 = void , typename A14 = void , typename A15 = void , typename A16 = void , typename A17 = void , typename A18 = void , typename A19 = void
          , typename Dummy = void
        >
        struct mem_fun_ptr_eval;
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1>
        struct mem_fun_ptr_eval<Context, A0 , A1>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1;
            typedef
                typename boost::result_of<
                    child1(
                        child1
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13; typedef typename evaluator::impl< A14 , Context , proto::empty_env >::result_type child14;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13 , child14
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13; typedef typename evaluator::impl< A14 , Context , proto::empty_env >::result_type child14; typedef typename evaluator::impl< A15 , Context , proto::empty_env >::result_type child15;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13 , child14 , child15
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13; typedef typename evaluator::impl< A14 , Context , proto::empty_env >::result_type child14; typedef typename evaluator::impl< A15 , Context , proto::empty_env >::result_type child15; typedef typename evaluator::impl< A16 , Context , proto::empty_env >::result_type child16;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13 , child14 , child15 , child16
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13; typedef typename evaluator::impl< A14 , Context , proto::empty_env >::result_type child14; typedef typename evaluator::impl< A15 , Context , proto::empty_env >::result_type child15; typedef typename evaluator::impl< A16 , Context , proto::empty_env >::result_type child16; typedef typename evaluator::impl< A17 , Context , proto::empty_env >::result_type child17;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13 , child14 , child15 , child16 , child17
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13; typedef typename evaluator::impl< A14 , Context , proto::empty_env >::result_type child14; typedef typename evaluator::impl< A15 , Context , proto::empty_env >::result_type child15; typedef typename evaluator::impl< A16 , Context , proto::empty_env >::result_type child16; typedef typename evaluator::impl< A17 , Context , proto::empty_env >::result_type child17; typedef typename evaluator::impl< A18 , Context , proto::empty_env >::result_type child18;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13 , child14 , child15 , child16 , child17 , child18
                    )
                >::type
                type;
        };
    
    
    
    
    
    
    
        template <typename Context, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18 , typename A19>
        struct mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18 , A19>
        {
            typedef typename evaluator::impl< A0 , Context , proto::empty_env >::result_type child0; typedef typename evaluator::impl< A1 , Context , proto::empty_env >::result_type child1; typedef typename evaluator::impl< A2 , Context , proto::empty_env >::result_type child2; typedef typename evaluator::impl< A3 , Context , proto::empty_env >::result_type child3; typedef typename evaluator::impl< A4 , Context , proto::empty_env >::result_type child4; typedef typename evaluator::impl< A5 , Context , proto::empty_env >::result_type child5; typedef typename evaluator::impl< A6 , Context , proto::empty_env >::result_type child6; typedef typename evaluator::impl< A7 , Context , proto::empty_env >::result_type child7; typedef typename evaluator::impl< A8 , Context , proto::empty_env >::result_type child8; typedef typename evaluator::impl< A9 , Context , proto::empty_env >::result_type child9; typedef typename evaluator::impl< A10 , Context , proto::empty_env >::result_type child10; typedef typename evaluator::impl< A11 , Context , proto::empty_env >::result_type child11; typedef typename evaluator::impl< A12 , Context , proto::empty_env >::result_type child12; typedef typename evaluator::impl< A13 , Context , proto::empty_env >::result_type child13; typedef typename evaluator::impl< A14 , Context , proto::empty_env >::result_type child14; typedef typename evaluator::impl< A15 , Context , proto::empty_env >::result_type child15; typedef typename evaluator::impl< A16 , Context , proto::empty_env >::result_type child16; typedef typename evaluator::impl< A17 , Context , proto::empty_env >::result_type child17; typedef typename evaluator::impl< A18 , Context , proto::empty_env >::result_type child18; typedef typename evaluator::impl< A19 , Context , proto::empty_env >::result_type child19;
            typedef
                typename boost::result_of<
                    child1(
                        child1 , child2 , child3 , child4 , child5 , child6 , child7 , child8 , child9 , child10 , child11 , child12 , child13 , child14 , child15 , child16 , child17 , child18 , child19
                    )
                >::type
                type;
        };
    }
    struct mem_fun_ptr_eval
    {
        template<typename Sig>
        struct result;
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1, typename Context>
        struct result<This(A0 , A1, Context)>
            : result<This(A0 const& , A1 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1, typename Context>
        struct result<This(A0 & , A1 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1>
        {};
        template <typename A0 , typename A1, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1>::type
        operator()(
            A0 const& a0 , A1 const& a1
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2, typename Context>
        struct result<This(A0 , A1 , A2, Context)>
            : result<This(A0 const& , A1 const& , A2 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2, typename Context>
        struct result<This(A0 & , A1 & , A2 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2>
        {};
        template <typename A0 , typename A1 , typename A2, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3, typename Context>
        struct result<This(A0 , A1 , A2 , A3, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx) , boost::phoenix::eval(a14, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx) , boost::phoenix::eval(a14, ctx) , boost::phoenix::eval(a15, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx) , boost::phoenix::eval(a14, ctx) , boost::phoenix::eval(a15, ctx) , boost::phoenix::eval(a16, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const& , A17 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 & , A17 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16 , A17 const& a17
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx) , boost::phoenix::eval(a14, ctx) , boost::phoenix::eval(a15, ctx) , boost::phoenix::eval(a16, ctx) , boost::phoenix::eval(a17, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const& , A17 const& , A18 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 & , A17 & , A18 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16 , A17 const& a17 , A18 const& a18
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx) , boost::phoenix::eval(a14, ctx) , boost::phoenix::eval(a15, ctx) , boost::phoenix::eval(a16, ctx) , boost::phoenix::eval(a17, ctx) , boost::phoenix::eval(a18, ctx)
                );
        }
        
    
    
    
    
    
    
    
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18 , typename A19, typename Context>
        struct result<This(A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18 , A19, Context)>
            : result<This(A0 const& , A1 const& , A2 const& , A3 const& , A4 const& , A5 const& , A6 const& , A7 const& , A8 const& , A9 const& , A10 const& , A11 const& , A12 const& , A13 const& , A14 const& , A15 const& , A16 const& , A17 const& , A18 const& , A19 const&, Context)>
        {};
        template <typename This, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18 , typename A19, typename Context>
        struct result<This(A0 & , A1 & , A2 & , A3 & , A4 & , A5 & , A6 & , A7 & , A8 & , A9 & , A10 & , A11 & , A12 & , A13 & , A14 & , A15 & , A16 & , A17 & , A18 & , A19 &, Context)>
            : result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18 , A19>
        {};
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18 , typename A19, typename Context>
        typename result_of::mem_fun_ptr_eval<Context, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9 , A10 , A11 , A12 , A13 , A14 , A15 , A16 , A17 , A18 , A19>::type
        operator()(
            A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16 , A17 const& a17 , A18 const& a18 , A19 const& a19
          , Context const & ctx
        ) const
        {
            return
                (
                    get_pointer(boost::phoenix::eval(a0, ctx))
                    ->*boost::phoenix::eval(a1, ctx)
                )(
                    boost::phoenix::eval(a2, ctx) , boost::phoenix::eval(a3, ctx) , boost::phoenix::eval(a4, ctx) , boost::phoenix::eval(a5, ctx) , boost::phoenix::eval(a6, ctx) , boost::phoenix::eval(a7, ctx) , boost::phoenix::eval(a8, ctx) , boost::phoenix::eval(a9, ctx) , boost::phoenix::eval(a10, ctx) , boost::phoenix::eval(a11, ctx) , boost::phoenix::eval(a12, ctx) , boost::phoenix::eval(a13, ctx) , boost::phoenix::eval(a14, ctx) , boost::phoenix::eval(a15, ctx) , boost::phoenix::eval(a16, ctx) , boost::phoenix::eval(a17, ctx) , boost::phoenix::eval(a18, ctx) , boost::phoenix::eval(a19, ctx)
                );
        }
        
    };
    template <typename Dummy>
    struct default_actions::when<rule::mem_fun_ptr, Dummy>
        : call<mem_fun_ptr_eval>
    {};
}}
