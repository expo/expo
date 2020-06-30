/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_ALTERNATIVE_DETAIL_JAN_07_2013_1245PM)
#define SPIRIT_ALTERNATIVE_DETAIL_JAN_07_2013_1245PM

#include <boost/spirit/home/x3/support/traits/attribute_of.hpp>
#include <boost/spirit/home/x3/support/traits/is_variant.hpp>
#include <boost/spirit/home/x3/support/traits/tuple_traits.hpp>
#include <boost/spirit/home/x3/support/traits/move_to.hpp>
#include <boost/spirit/home/x3/support/traits/variant_has_substitute.hpp>
#include <boost/spirit/home/x3/support/traits/variant_find_substitute.hpp>
#include <boost/spirit/home/x3/core/detail/parse_into_container.hpp>
#include <boost/variant/variant.hpp>

#include <boost/mpl/copy_if.hpp>
#include <boost/mpl/not.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/insert_range.hpp>
#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/vector.hpp>

#include <boost/fusion/include/front.hpp>

#include <boost/type_traits/is_same.hpp>

namespace boost { namespace spirit { namespace x3
{
    template <typename Left, typename Right>
    struct alternative;
}}}

namespace boost { namespace spirit { namespace x3 { namespace detail
{
    struct pass_variant_unused
    {
        typedef unused_type type;

        template <typename T>
        static unused_type
        call(T&)
        {
            return unused_type();
        }
    };

    template <typename Attribute>
    struct pass_variant_used
    {
        typedef Attribute& type;

        static Attribute&
        call(Attribute& v)
        {
            return v;
        }
    };

    template <>
    struct pass_variant_used<unused_type> : pass_variant_unused {};

    template <typename Parser, typename Attribute, typename Context
      , typename Enable = void>
    struct pass_parser_attribute
    {
        typedef typename
            traits::attribute_of<Parser, Context>::type
        attribute_type;
        typedef typename
            traits::variant_find_substitute<Attribute, attribute_type>::type
        substitute_type;

        typedef typename
            mpl::if_<
                is_same<Attribute, substitute_type>
              , Attribute&
              , substitute_type
            >::type
        type;

        template <typename Attribute_>
        static Attribute_&
        call(Attribute_& attr, mpl::true_)
        {
            return attr;
        }

        template <typename Attribute_>
        static type
        call(Attribute_&, mpl::false_)
        {
            return type();
        }

        template <typename Attribute_>
        static type
        call(Attribute_& attr)
        {
            return call(attr, is_same<Attribute_, typename remove_reference<type>::type>());
        }
    };

    // Pass non-variant attributes as-is
    template <typename Parser, typename Attribute, typename Context
      , typename Enable = void>
    struct pass_non_variant_attribute
    {
        typedef Attribute& type;

        static Attribute&
        call(Attribute& attr)
        {
            return attr;
        }
    };

    // Unwrap single element sequences
    template <typename Parser, typename Attribute, typename Context>
    struct pass_non_variant_attribute<Parser, Attribute, Context,
        typename enable_if<traits::is_size_one_sequence<Attribute>>::type>
    {
        typedef typename remove_reference<
            typename fusion::result_of::front<Attribute>::type>::type
        attr_type;

        typedef pass_parser_attribute<Parser, attr_type, Context> pass;
        typedef typename pass::type type;

        template <typename Attribute_>
        static type
        call(Attribute_& attr)
        {
            return pass::call(fusion::front(attr));
        }
    };

    template <typename Parser, typename Attribute, typename Context>
    struct pass_parser_attribute<Parser, Attribute, Context,
        typename enable_if_c<(!traits::is_variant<Attribute>::value)>::type>
        : pass_non_variant_attribute<Parser, Attribute, Context>
    {};

    template <typename Parser, typename Context>
    struct pass_parser_attribute<Parser, unused_type, Context>
        : pass_variant_unused {};

    template <typename Parser, typename Attribute, typename Context>
    struct pass_variant_attribute :
        mpl::if_c<traits::has_attribute<Parser, Context>::value
          , pass_parser_attribute<Parser, Attribute, Context>
          , pass_variant_unused>::type
    {
        typedef typename mpl::false_ is_alternative;
    };

    template <typename L, typename R, typename Attribute, typename Context>
    struct pass_variant_attribute<alternative<L, R>, Attribute, Context> :
        mpl::if_c<traits::has_attribute<alternative<L, R>, Context>::value
          , pass_variant_used<Attribute>
          , pass_variant_unused>::type
    {
        typedef typename mpl::true_ is_alternative;
    };

    template <typename L, typename R, typename C>
    struct get_alternative_types
    {
        typedef
            mpl::vector<
                typename traits::attribute_of<L, C>::type
              , typename traits::attribute_of<R, C>::type
            >
        type;
    };

    template <typename LL, typename LR, typename R, typename C>
    struct get_alternative_types<alternative<LL, LR>, R, C>
        : mpl::push_back< typename get_alternative_types<LL, LR, C>::type
                        , typename traits::attribute_of<R, C>::type> {};

    template <typename L, typename RL, typename RR, typename C>
    struct get_alternative_types<L, alternative<RL, RR>, C>
        : mpl::push_front< typename get_alternative_types<RL, RR, C>::type
                         , typename traits::attribute_of<L, C>::type> {};

    template <typename LL, typename LR, typename RL, typename RR, typename C>
    struct get_alternative_types<alternative<LL, LR>, alternative<RL, RR>, C>
    {
        typedef typename get_alternative_types<LL, LR, C>::type left;
        typedef typename get_alternative_types<RL, RR, C>::type right;
        typedef typename
            mpl::insert_range<left, typename mpl::end<left>::type, right>::type
        type;
    };

    template <typename L, typename R, typename C>
    struct attribute_of_alternative
    {
        // Get all alternative attribute types
        typedef typename get_alternative_types<L, R, C>::type all_types;

        // Filter all unused_types
        typedef typename
            mpl::copy_if<
                all_types
              , mpl::not_<is_same<mpl::_1, unused_type>>
              , mpl::back_inserter<mpl::vector<>>
            >::type
        filtered_types;

        // Build a variant if filtered_types is not empty,
        // else just return unused_type
        typedef typename
            mpl::eval_if<
                mpl::empty<filtered_types>
              , mpl::identity<unused_type>
              , make_variant_over<filtered_types>
            >::type
        type;
    };

    template <typename IsAlternative>
    struct move_if_not_alternative
    {
        template<typename T1, typename T2>
        static void call(T1& attr_, T2& attr) {}
    };

    template <>
    struct move_if_not_alternative<mpl::false_ /*is alternative*/>
    {
        template<typename T1, typename T2>
        static void call(T1& attr_, T2& attr)
        {
            traits::move_to(attr_, attr);
        }
    };

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_alternative(Parser const& p, Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr)
    {
        typedef detail::pass_variant_attribute<Parser, Attribute, Context> pass;

        typename pass::type attr_ = pass::call(attr);
        if (p.parse(first, last, context, rcontext, attr_))
        {
            move_if_not_alternative<typename pass::is_alternative>::call(attr_, attr);
            return true;
        }
        return false;
    }


    template <typename Left, typename Right, typename Context, typename RContext>
    struct parse_into_container_impl<alternative<Left, Right>, Context, RContext>
    {
        typedef alternative<Left, Right> parser_type;

        template <typename Iterator, typename Attribute>
        static bool call(
            parser_type const& parser
          , Iterator& first, Iterator const& last
          , Context const& context, RContext& rcontext, Attribute& attr, mpl::true_)
        {
            return parse_alternative(parser, first, last, context, rcontext, attr);
        }

        template <typename Iterator, typename Attribute>
        static bool call(
            parser_type const& parser
          , Iterator& first, Iterator const& last
          , Context const& context, RContext& rcontext, Attribute& attr, mpl::false_)
        {
            return parse_into_container_base_impl<parser_type>::call(
                parser, first, last, context, rcontext, attr);
        }

        template <typename Iterator, typename Attribute>
        static bool call(
            parser_type const& parser
          , Iterator& first, Iterator const& last
          , Context const& context, RContext& rcontext, Attribute& attr)
        {
            typedef typename
                traits::attribute_of<parser_type, Context>::type
            attribute_type;

            return call(parser, first, last, context, rcontext, attr
                , traits::variant_has_substitute<attribute_type, Attribute>());
        }
    };

}}}}

#endif
