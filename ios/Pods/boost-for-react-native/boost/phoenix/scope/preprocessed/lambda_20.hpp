/*==============================================================================
    Copyright (c) 2001-2010 Joel de Guzman
    Copyright (c) 2004 Daniel Wallin
    Copyright (c) 2010 Thomas Heller

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
namespace boost { namespace phoenix { namespace tag { struct lambda_actor {}; template <typename Ostream> inline Ostream &operator<<( Ostream & os , lambda_actor) { os << "lambda_actor"; return os; } } namespace expression { template <typename A0 , typename A1 , typename A2> struct lambda_actor : boost::phoenix::expr< :: boost :: phoenix :: tag:: lambda_actor , A0 , A1 , A2> {}; } namespace rule { struct lambda_actor : expression:: lambda_actor <proto::terminal<proto::_>, proto::terminal<proto::_>, meta_grammar> {}; } namespace functional { typedef boost::proto::functional::make_expr< tag:: lambda_actor > make_lambda_actor; } namespace result_of { template <typename A0 , typename A1 , typename A2> struct make_lambda_actor : boost::result_of< functional:: make_lambda_actor(A0 , A1 , A2) > {}; } template <typename A0 , typename A1 , typename A2> inline typename result_of::make_lambda_actor< A0 , A1 , A2 >::type const make_lambda_actor( A0 const& a0 , A1 const& a1 , A2 const& a2 ) { return functional::make_lambda_actor()( a0 , a1 , a2 ); } } } namespace boost { namespace phoenix { template <typename Dummy> struct meta_grammar::case_< :: boost :: phoenix :: tag:: lambda_actor , Dummy > : enable_rule< :: boost :: phoenix :: rule:: lambda_actor , Dummy > {}; } }
namespace boost { namespace phoenix { namespace tag { struct lambda {}; template <typename Ostream> inline Ostream &operator<<( Ostream & os , lambda) { os << "lambda"; return os; } } namespace expression { template <typename A0 , typename A1 , typename A2 , typename A3> struct lambda : boost::phoenix::expr< :: boost :: phoenix :: tag:: lambda , A0 , A1 , A2 , A3> {}; } namespace rule { struct lambda : expression:: lambda <proto::terminal<proto::_>, proto::terminal<proto::_>, proto::terminal<proto::_>, meta_grammar> {}; } namespace functional { typedef boost::proto::functional::make_expr< tag:: lambda > make_lambda; } namespace result_of { template <typename A0 , typename A1 , typename A2 , typename A3> struct make_lambda : boost::result_of< functional:: make_lambda(A0 , A1 , A2 , A3) > {}; } template <typename A0 , typename A1 , typename A2 , typename A3> inline typename result_of::make_lambda< A0 , A1 , A2 , A3 >::type const make_lambda( A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 ) { return functional::make_lambda()( a0 , a1 , a2 , a3 ); } } } namespace boost { namespace phoenix { template <typename Dummy> struct meta_grammar::case_< :: boost :: phoenix :: tag:: lambda , Dummy > : enable_rule< :: boost :: phoenix :: rule:: lambda , Dummy > {}; } }
namespace boost { namespace phoenix
{
    struct lambda_eval
    {
        BOOST_PROTO_CALLABLE()
        template <typename Sig>
        struct result;
        template <
            typename This
          , typename OuterEnv
          , typename Locals
          , typename Map
          , typename Lambda
          , typename Context
        >
        struct result<This(OuterEnv, Locals, Map, Lambda, Context)>
        {
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<
                        OuterEnv
                    >::type
                >::type
                outer_env_type;
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<
                        Locals
                    >::type
                >::type
                locals_type;
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<
                        Map
                    >::type
                >::type
                map_type;
            
            typedef
                typename proto::detail::uncvref<
                    typename result_of::env<Context>::type
                >::type
                env_type;
                    typedef
                            typename result_of::eval<
                                Lambda
                                     , typename result_of::context<
                                       scoped_environment<
                                              env_type
                                            , outer_env_type
                                            , locals_type
                                            , map_type
                                            >
                          , typename result_of::actions<
                                Context
                                            >::type
                                       >::type
                                    >::type
                             type;
        };
        template <typename OuterEnv, typename Locals, typename Map, typename Lambda, typename Context>
        typename result<lambda_eval(OuterEnv const &, Locals const &, Map const &, Lambda const &, Context const &)>::type
        operator()(OuterEnv const & outer_env, Locals const & locals, Map const &, Lambda const & lambda, Context const & ctx) const
        {
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<
                        OuterEnv
                    >::type
                >::type
                outer_env_type;
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<
                        Locals
                    >::type
                >::type
                locals_type;
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<
                        Map
                    >::type
                >::type
                map_type;
            
            typedef
                typename proto::detail::uncvref<
                    typename result_of::env<Context>::type
                >::type
                env_type;
            
                scoped_environment<
                env_type
              , outer_env_type
              , locals_type
              , map_type
            >
            env(phoenix::env(ctx), proto::value(outer_env), proto::value(locals));
            return eval(lambda, phoenix::context(env, phoenix::actions(ctx)));
        }
    };
    template <typename Dummy>
    struct default_actions::when<rule::lambda, Dummy>
        : call<lambda_eval, Dummy>
    {};
    template <typename Dummy>
    struct is_nullary::when<rule::lambda, Dummy>
        : proto::call<
            evaluator(
                proto::_child_c<3>
              , proto::call<
                    functional::context(
                        proto::make<
                            mpl::true_()
                        >
                      , proto::make<
                            detail::scope_is_nullary_actions()
                        >
                    )
                >
              , proto::make<
                    proto::empty_env()
                >
            )
        >
    {};
    template <typename Dummy>
    struct is_nullary::when<rule::lambda_actor, Dummy>
        : proto::or_<
            proto::when<
                expression::lambda_actor<
                    proto::terminal<vector0<> >
                  , proto::terminal<proto::_>
                  , meta_grammar
                >
              , mpl::true_()
            >
          , proto::when<
                expression::lambda_actor<
                    proto::terminal<proto::_>
                  , proto::terminal<proto::_>
                  , meta_grammar
                >
              , proto::fold<
                    proto::call<proto::_value(proto::_child_c<0>)>
                  , proto::make<mpl::true_()>
                  , proto::make<
                        mpl::and_<
                            proto::_state
                          , proto::call<
                                evaluator(
                                    proto::_
                                  , _context
                                  , proto::make<proto::empty_env()>
                                )
                            >
                        >()
                    >
                >
            >
        >
    {};
    struct lambda_actor_eval
    {
        template <typename Sig>
        struct result;
        template <typename This, typename Vars, typename Map, typename Lambda, typename Context>
        struct result<This(Vars, Map, Lambda, Context)>
        {
            typedef
                typename proto::detail::uncvref<
                    typename result_of::env<Context>::type
                >::type
                env_type;
            typedef
                typename proto::detail::uncvref<
                    typename result_of::actions<Context>::type
                >::type
                actions_type;
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<Vars>::type
                     >::type
                     vars_type;
            
            typedef typename
                detail::result_of::initialize_locals<
                    vars_type
                  , Context
                >::type
            locals_type;
            typedef
                typename expression::lambda<
                    env_type
                  , locals_type
                  , Map
                  , Lambda
                >::type const
                type;
        };
        template <
            typename Vars
          , typename Map
          , typename Lambda
          , typename Context
        >
        typename result<
            lambda_actor_eval(Vars const&, Map const &, Lambda const&, Context const &)
        >::type const
        operator()(Vars const& vars, Map const& map, Lambda const& lambda, Context const & ctx) const
        {
            typedef
                typename proto::detail::uncvref<
                    typename result_of::env<Context>::type
                >::type
                env_type;
            
            typedef
                typename proto::detail::uncvref<
                    typename proto::result_of::value<Vars>::type
                     >::type
                     vars_type;
            
            typedef typename
                detail::result_of::initialize_locals<
                    vars_type
                  , Context
                >::type
            locals_type;
            locals_type locals = initialize_locals(proto::value(vars), ctx);
            return
                expression::
                    lambda<env_type, locals_type, Map, Lambda>::
                        make(phoenix::env(ctx), locals, map, lambda);
        }
    };
    template <typename Dummy>
    struct default_actions::when<rule::lambda_actor, Dummy>
        : call<lambda_actor_eval, Dummy>
    {};
    
    template <typename Locals = void, typename Map = void, typename Dummy = void>
    struct lambda_actor_gen;
    template <>
    struct lambda_actor_gen<void, void, void>
    {
        template <typename Expr>
        typename expression::lambda_actor<vector0<>, detail::map_local_index_to_tuple<>, Expr>::type const
        operator[](Expr const & expr) const
        {
            typedef vector0<> locals_type;
            typedef detail::map_local_index_to_tuple<> map_type;
            return expression::lambda_actor<locals_type, map_type, Expr>::make(locals_type(), map_type(), expr);
        }
    };
    template <typename Locals, typename Map>
    struct lambda_actor_gen<Locals, Map>
    {
        lambda_actor_gen(Locals const & locals_)
            : locals(locals_)
        {}
        lambda_actor_gen(lambda_actor_gen const & o)
            : locals(o.locals)
        {};
        template <typename Expr>
        typename expression::lambda_actor<
            Locals
          , Map
          , Expr
        >::type const
        operator[](Expr const & expr) const
        {
            return expression::lambda_actor<Locals, Map, Expr>::make(locals, Map(), expr);
        }
        Locals locals;
    };
    struct lambda_local_gen
        : lambda_actor_gen<>
    {
        lambda_actor_gen<> const
        operator()() const
        {
            return lambda_actor_gen<>();
        }
    
    
    
    
    
    
    
        template <typename A0>
        lambda_actor_gen<
            vector1<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0) const
        {
            typedef
                vector1<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1>
        lambda_actor_gen<
            vector2<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1) const
        {
            typedef
                vector2<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2>
        lambda_actor_gen<
            vector3<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2) const
        {
            typedef
                vector3<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3>
        lambda_actor_gen<
            vector4<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3) const
        {
            typedef
                vector4<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4>
        lambda_actor_gen<
            vector5<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4) const
        {
            typedef
                vector5<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5>
        lambda_actor_gen<
            vector6<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5) const
        {
            typedef
                vector6<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6>
        lambda_actor_gen<
            vector7<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6) const
        {
            typedef
                vector7<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7>
        lambda_actor_gen<
            vector8<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7) const
        {
            typedef
                vector8<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8>
        lambda_actor_gen<
            vector9<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8) const
        {
            typedef
                vector9<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9>
        lambda_actor_gen<
            vector10<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9) const
        {
            typedef
                vector10<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10>
        lambda_actor_gen<
            vector11<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10) const
        {
            typedef
                vector11<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11>
        lambda_actor_gen<
            vector12<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11) const
        {
            typedef
                vector12<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12>
        lambda_actor_gen<
            vector13<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12) const
        {
            typedef
                vector13<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13>
        lambda_actor_gen<
            vector14<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13) const
        {
            typedef
                vector14<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14>
        lambda_actor_gen<
            vector15<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14) const
        {
            typedef
                vector15<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15>
        lambda_actor_gen<
            vector16<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15) const
        {
            typedef
                vector16<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16>
        lambda_actor_gen<
            vector17<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16) const
        {
            typedef
                vector17<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17>
        lambda_actor_gen<
            vector18<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A17 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16 , A17 const& a17) const
        {
            typedef
                vector18<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A17 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16) , proto::child_c<1>(a17)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18>
        lambda_actor_gen<
            vector19<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A17 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A18 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A18 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16 , A17 const& a17 , A18 const& a18) const
        {
            typedef
                vector19<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A17 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A18 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16) , proto::child_c<1>(a17) , proto::child_c<1>(a18)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A18 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    
    
    
    
    
    
    
        template <typename A0 , typename A1 , typename A2 , typename A3 , typename A4 , typename A5 , typename A6 , typename A7 , typename A8 , typename A9 , typename A10 , typename A11 , typename A12 , typename A13 , typename A14 , typename A15 , typename A16 , typename A17 , typename A18 , typename A19>
        lambda_actor_gen<
            vector20<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A17 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A18 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A19 , 1 >::type >::type>
          , detail::map_local_index_to_tuple<typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A18 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A19 , 0 >::type >::type >::type>
        >
        operator()(A0 const& a0 , A1 const& a1 , A2 const& a2 , A3 const& a3 , A4 const& a4 , A5 const& a5 , A6 const& a6 , A7 const& a7 , A8 const& a8 , A9 const& a9 , A10 const& a10 , A11 const& a11 , A12 const& a12 , A13 const& a13 , A14 const& a14 , A15 const& a15 , A16 const& a16 , A17 const& a17 , A18 const& a18 , A19 const& a19) const
        {
            typedef
                vector20<typename proto::detail::uncvref< typename proto::result_of::child_c< A0 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A1 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A2 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A3 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A4 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A5 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A6 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A7 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A8 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A9 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A10 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A11 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A12 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A13 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A14 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A15 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A16 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A17 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A18 , 1 >::type >::type , typename proto::detail::uncvref< typename proto::result_of::child_c< A19 , 1 >::type >::type>
                locals_type;
            locals_type locals = {proto::child_c<1>(a0) , proto::child_c<1>(a1) , proto::child_c<1>(a2) , proto::child_c<1>(a3) , proto::child_c<1>(a4) , proto::child_c<1>(a5) , proto::child_c<1>(a6) , proto::child_c<1>(a7) , proto::child_c<1>(a8) , proto::child_c<1>(a9) , proto::child_c<1>(a10) , proto::child_c<1>(a11) , proto::child_c<1>(a12) , proto::child_c<1>(a13) , proto::child_c<1>(a14) , proto::child_c<1>(a15) , proto::child_c<1>(a16) , proto::child_c<1>(a17) , proto::child_c<1>(a18) , proto::child_c<1>(a19)};
            return
                lambda_actor_gen<
                    locals_type
                  , detail::map_local_index_to_tuple<
                        typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A0 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A1 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A2 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A3 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A4 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A5 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A6 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A7 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A8 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A9 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A10 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A11 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A12 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A13 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A14 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A15 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A16 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A17 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A18 , 0 >::type >::type >::type , typename proto::detail::uncvref< typename proto::result_of::value< typename proto::result_of::child_c< A19 , 0 >::type >::type >::type
                    >
                >(locals);
        }
    };
    typedef lambda_local_gen lambda_type;
    lambda_local_gen const lambda = lambda_local_gen();
}}
