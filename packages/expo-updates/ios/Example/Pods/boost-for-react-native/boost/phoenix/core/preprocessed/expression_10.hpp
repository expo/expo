/*=============================================================================
    Copyright (c) 2005-2010 Joel de Guzman
    Copyright (c) 2010 Eric Niebler
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying 
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
namespace boost { namespace phoenix
{
    template <typename Expr> struct actor;
    
    template <
        template <typename> class Actor
      , typename Tag
      , typename A0 = void , typename A1 = void , typename A2 = void , typename A3 = void , typename A4 = void , typename A5 = void , typename A6 = void , typename A7 = void , typename A8 = void , typename A9 = void
      , typename Dummy = void>
    struct expr_ext;
    template <
        typename Tag
      , typename A0 = void , typename A1 = void , typename A2 = void , typename A3 = void , typename A4 = void , typename A5 = void , typename A6 = void , typename A7 = void , typename A8 = void , typename A9 = void
      , typename Dummy = void
    >
    struct expr : expr_ext<actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9> {};
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0>
    struct expr_ext<Actor, Tag, A0>
        : proto::transform<expr_ext<Actor, Tag, A0>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1>
    struct expr_ext<Actor, Tag, A0 , A1>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2>
    struct expr_ext<Actor, Tag, A0 , A1 , A2>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A4>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3 , A4>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3 , typename call_traits<A4>::param_type a4)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3 , a4)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3; typedef A4 proto_child4;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A4>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A5>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3 , A4 , A5>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3 , typename call_traits<A4>::param_type a4 , typename call_traits<A5>::param_type a5)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3 , a4 , a5)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3; typedef A4 proto_child4; typedef A5 proto_child5;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A4>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A5>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A6>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3 , typename call_traits<A4>::param_type a4 , typename call_traits<A5>::param_type a5 , typename call_traits<A6>::param_type a6)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3 , a4 , a5 , a6)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3; typedef A4 proto_child4; typedef A5 proto_child5; typedef A6 proto_child6;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A4>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A5>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A6>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A7>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3 , typename call_traits<A4>::param_type a4 , typename call_traits<A5>::param_type a5 , typename call_traits<A6>::param_type a6 , typename call_traits<A7>::param_type a7)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3 , a4 , a5 , a6 , a7)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3; typedef A4 proto_child4; typedef A5 proto_child5; typedef A6 proto_child6; typedef A7 proto_child7;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A4>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A5>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A6>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A7>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A8>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3 , typename call_traits<A4>::param_type a4 , typename call_traits<A5>::param_type a5 , typename call_traits<A6>::param_type a6 , typename call_traits<A7>::param_type a7 , typename call_traits<A8>::param_type a8)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3 , a4 , a5 , a6 , a7 , a8)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3; typedef A4 proto_child4; typedef A5 proto_child5; typedef A6 proto_child6; typedef A7 proto_child7; typedef A8 proto_child8;
    };
    
    
    
    
    
    
    
    template <template <typename> class Actor, typename Tag, typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
    struct expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>
        : proto::transform<expr_ext<Actor, Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>, int>
    {
        typedef
            typename proto::result_of::make_expr<
                Tag
              , proto::basic_default_domain
              , typename proto::detail::uncvref<typename call_traits<A0>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A1>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A2>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A3>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A4>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A5>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A6>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A7>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A8>::value_type>::type , typename proto::detail::uncvref<typename call_traits<A9>::value_type>::type
            >::type
            base_type;
        typedef Actor<base_type> type;
        typedef
            typename proto::nary_expr<Tag, A0 , A1 , A2 , A3 , A4 , A5 , A6 , A7 , A8 , A9>::proto_grammar
            proto_grammar;
        
        static type make(typename call_traits<A0>::param_type a0 , typename call_traits<A1>::param_type a1 , typename call_traits<A2>::param_type a2 , typename call_traits<A3>::param_type a3 , typename call_traits<A4>::param_type a4 , typename call_traits<A5>::param_type a5 , typename call_traits<A6>::param_type a6 , typename call_traits<A7>::param_type a7 , typename call_traits<A8>::param_type a8 , typename call_traits<A9>::param_type a9)
      { 
        
                actor<base_type> const e =
                {
                    proto::make_expr<
                        Tag
                      , proto::basic_default_domain
                    >(a0 , a1 , a2 , a3 , a4 , a5 , a6 , a7 , a8 , a9)
                };
            return e;
        }
        template<typename Expr, typename State, typename Data>
        struct impl
          : proto::pass_through<expr_ext>::template impl<Expr, State, Data>
        {};
        
        typedef Tag proto_tag;
        typedef A0 proto_child0; typedef A1 proto_child1; typedef A2 proto_child2; typedef A3 proto_child3; typedef A4 proto_child4; typedef A5 proto_child5; typedef A6 proto_child6; typedef A7 proto_child7; typedef A8 proto_child8; typedef A9 proto_child9;
    };
}}
