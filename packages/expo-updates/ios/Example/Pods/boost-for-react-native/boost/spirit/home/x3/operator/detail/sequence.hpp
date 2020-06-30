/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_SEQUENCE_DETAIL_JAN_06_2013_1015AM)
#define SPIRIT_SEQUENCE_DETAIL_JAN_06_2013_1015AM

#include <boost/spirit/home/x3/support/traits/attribute_of.hpp>
#include <boost/spirit/home/x3/support/traits/attribute_category.hpp>
#include <boost/spirit/home/x3/support/traits/make_attribute.hpp>
#include <boost/spirit/home/x3/support/traits/has_attribute.hpp>
#include <boost/spirit/home/x3/support/traits/is_substitute.hpp>
#include <boost/spirit/home/x3/support/traits/container_traits.hpp>
#include <boost/spirit/home/x3/core/detail/parse_into_container.hpp>

#include <boost/fusion/include/begin.hpp>
#include <boost/fusion/include/end.hpp>
#include <boost/fusion/include/advance.hpp>
#include <boost/fusion/include/empty.hpp>
#include <boost/fusion/include/front.hpp>
#include <boost/fusion/include/iterator_range.hpp>
#include <boost/fusion/include/as_deque.hpp>
#include <boost/fusion/include/mpl.hpp>

#include <boost/mpl/copy_if.hpp>
#include <boost/mpl/not.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/insert_range.hpp>
#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/vector.hpp>
#include <boost/mpl/identity.hpp>

#include <boost/type_traits/add_reference.hpp>
#include <boost/type_traits/is_same.hpp>

namespace boost { namespace spirit { namespace x3
{
    template <typename Left, typename Right>
    struct sequence;
}}}

namespace boost { namespace spirit { namespace x3 { namespace detail
{
    template <typename Parser, typename Context, typename Enable = void>
    struct sequence_size
    {
        static int const value = traits::has_attribute<Parser, Context>::value;
    };

    template <typename Parser, typename Context>
    struct sequence_size_subject
      : sequence_size<typename Parser::subject_type, Context> {};

    template <typename Parser, typename Context>
    struct sequence_size<Parser, Context
      , typename enable_if_c<(Parser::is_pass_through_unary)>::type>
      : sequence_size_subject<Parser, Context> {};

    template <typename L, typename R, typename Context>
    struct sequence_size<sequence<L, R>, Context>
    {
        static int const value =
            sequence_size<L, Context>::value +
            sequence_size<R, Context>::value;
    };

    struct pass_sequence_attribute_unused
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
    struct pass_sequence_attribute_front
    {
        typedef typename fusion::result_of::front<Attribute>::type type;

        static typename add_reference<type>::type
        call(Attribute& attr)
        {
            return fusion::front(attr);
        }
    };

    template <typename Attribute>
    struct pass_through_sequence_attribute
    {
        typedef Attribute& type;

        template <typename Attribute_>
        static Attribute_&
        call(Attribute_& attr)
        {
            return attr;
        }
    };

    template <typename Parser, typename Attribute, bool pass_through>
    struct pass_sequence_attribute_used :
        mpl::if_c<
            (!pass_through && traits::is_size_one_sequence<Attribute>::value)
          , pass_sequence_attribute_front<Attribute>
          , pass_through_sequence_attribute<Attribute>>::type {};

    template <typename Parser, typename Attribute, bool pass_through = false, typename Enable = void>
    struct pass_sequence_attribute :
        mpl::if_<
            fusion::result_of::empty<Attribute>
          , pass_sequence_attribute_unused
          , pass_sequence_attribute_used<Parser, Attribute, pass_through>>::type {};

    template <typename L, typename R, typename Attribute, bool pass_through>
    struct pass_sequence_attribute<sequence<L, R>, Attribute, pass_through>
      : pass_through_sequence_attribute<Attribute> {};

    template <typename Parser, typename Attribute>
    struct pass_sequence_attribute_subject :
        pass_sequence_attribute<typename Parser::subject_type, Attribute> {};

    template <typename Parser, typename Attribute, bool pass_through>
    struct pass_sequence_attribute<Parser, Attribute, pass_through
      , typename enable_if_c<(Parser::is_pass_through_unary)>::type>
      : pass_sequence_attribute_subject<Parser, Attribute> {};

    template <typename L, typename R, typename Attribute, typename Context
      , typename Enable = void>
    struct partition_attribute
    {
        static int const l_size = sequence_size<L, Context>::value;
        static int const r_size = sequence_size<R, Context>::value;

        // If you got an error here, then you are trying to pass
        // a fusion sequence with the wrong number of elements
        // as that expected by the (sequence) parser.
        static_assert(
            fusion::result_of::size<Attribute>::value == (l_size + r_size)
          , "Attribute does not have the expected size."
        );

        typedef typename fusion::result_of::begin<Attribute>::type l_begin;
        typedef typename fusion::result_of::advance_c<l_begin, l_size>::type l_end;
        typedef typename fusion::result_of::end<Attribute>::type r_end;
        typedef fusion::iterator_range<l_begin, l_end> l_part;
        typedef fusion::iterator_range<l_end, r_end> r_part;
        typedef pass_sequence_attribute<L, l_part, false> l_pass;
        typedef pass_sequence_attribute<R, r_part, false> r_pass;

        static l_part left(Attribute& s)
        {
            auto i = fusion::begin(s);
            return l_part(i, fusion::advance_c<l_size>(i));
        }

        static r_part right(Attribute& s)
        {
            return r_part(
                fusion::advance_c<l_size>(fusion::begin(s))
              , fusion::end(s));
        }
    };

    template <typename L, typename R, typename Attribute, typename Context>
    struct partition_attribute<L, R, Attribute, Context,
        typename enable_if_c<(!traits::has_attribute<L, Context>::value &&
            traits::has_attribute<R, Context>::value)>::type>
    {
        typedef unused_type l_part;
        typedef Attribute& r_part;
        typedef pass_sequence_attribute_unused l_pass;
        typedef pass_sequence_attribute<R, Attribute, true> r_pass;

        static unused_type left(Attribute&)
        {
            return unused;
        }

        static Attribute& right(Attribute& s)
        {
            return s;
        }
    };

    template <typename L, typename R, typename Attribute, typename Context>
    struct partition_attribute<L, R, Attribute, Context,
        typename enable_if_c<(traits::has_attribute<L, Context>::value &&
            !traits::has_attribute<R, Context>::value)>::type>
    {
        typedef Attribute& l_part;
        typedef unused_type r_part;
        typedef pass_sequence_attribute<L, Attribute, true> l_pass;
        typedef pass_sequence_attribute_unused r_pass;

        static Attribute& left(Attribute& s)
        {
            return s;
        }

        static unused_type right(Attribute&)
        {
            return unused;
        }
    };

    template <typename L, typename R, typename Attribute, typename Context>
    struct partition_attribute<L, R, Attribute, Context,
        typename enable_if_c<(!traits::has_attribute<L, Context>::value &&
            !traits::has_attribute<R, Context>::value)>::type>
    {
        typedef unused_type l_part;
        typedef unused_type r_part;
        typedef pass_sequence_attribute_unused l_pass;
        typedef pass_sequence_attribute_unused r_pass;

        static unused_type left(Attribute&)
        {
            return unused;
        }

        static unused_type right(Attribute&)
        {
            return unused;
        }
    };

    template <typename L, typename R, typename C>
    struct get_sequence_types
    {
        typedef
            mpl::vector<
                typename traits::attribute_of<L, C>::type
              , typename traits::attribute_of<R, C>::type
            >
        type;
    };

    template <typename LL, typename LR, typename R, typename C>
    struct get_sequence_types<sequence<LL, LR>, R, C>
        : mpl::push_back< typename get_sequence_types<LL, LR, C>::type
                        , typename traits::attribute_of<R, C>::type> {};

    template <typename L, typename RL, typename RR, typename C>
    struct get_sequence_types<L, sequence<RL, RR>, C>
        : mpl::push_front< typename get_sequence_types<RL, RR, C>::type
                         , typename traits::attribute_of<L, C>::type> {};

    template <typename LL, typename LR, typename RL, typename RR, typename C>
    struct get_sequence_types<sequence<LL, LR>, sequence<RL, RR>, C>
    {
        typedef typename get_sequence_types<LL, LR, C>::type left;
        typedef typename get_sequence_types<RL, RR, C>::type right;
        typedef typename
            mpl::insert_range<left, typename mpl::end<left>::type, right>::type
        type;
    };

    template <typename L, typename R, typename C>
    struct attribute_of_sequence
    {
        // Get all sequence attribute types
        typedef typename get_sequence_types<L, R, C>::type all_types;

        // Filter all unused_types
        typedef typename
            mpl::copy_if<
                all_types
              , mpl::not_<is_same<mpl::_1, unused_type>>
              , mpl::back_inserter<mpl::vector<>>
            >::type
        filtered_types;

        // Build a fusion::deque if filtered_types is not empty,
        // else just return unused_type
        typedef typename
            mpl::eval_if<
                mpl::empty<filtered_types>
	    , mpl::identity<unused_type>
	    , mpl::if_<mpl::equal_to<mpl::size<filtered_types>, mpl::int_<1> >,
	    typename mpl::front<filtered_types>::type
		      , typename fusion::result_of::as_deque<filtered_types>::type >
            >::type
        type;
    };

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence(
        Parser const& parser, Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr
      , traits::tuple_attribute)
    {
        typedef typename Parser::left_type Left;
        typedef typename Parser::right_type Right;
        typedef partition_attribute<Left, Right, Attribute, Context> partition;
        typedef typename partition::l_pass l_pass;
        typedef typename partition::r_pass r_pass;

        typename partition::l_part l_part = partition::left(attr);
        typename partition::r_part r_part = partition::right(attr);
        typename l_pass::type l_attr = l_pass::call(l_part);
        typename r_pass::type r_attr = r_pass::call(r_part);

        Iterator save = first;
        if (parser.left.parse(first, last, context, rcontext, l_attr)
            && parser.right.parse(first, last, context, rcontext, r_attr))
            return true;
        first = save;
        return false;
    }

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence_plain(
        Parser const& parser, Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr)
    {
        typedef typename Parser::left_type Left;
        typedef typename Parser::right_type Right;
        typedef typename traits::attribute_of<Left, Context>::type l_attr_type;
        typedef typename traits::attribute_of<Right, Context>::type r_attr_type;
        typedef traits::make_attribute<l_attr_type, Attribute> l_make_attribute;
        typedef traits::make_attribute<r_attr_type, Attribute> r_make_attribute;

        typename l_make_attribute::type l_attr = l_make_attribute::call(attr);
        typename r_make_attribute::type r_attr = r_make_attribute::call(attr);

        Iterator save = first;
        if (parser.left.parse(first, last, context, rcontext, l_attr)
            && parser.right.parse(first, last, context, rcontext, r_attr))
            return true;
        first = save;
        return false;
    }

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence(
        Parser const& parser, Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr
      , traits::plain_attribute)
    {
        return parse_sequence_plain(parser, first, last, context, rcontext, attr);
    }

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence(
        Parser const& parser, Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr
      , traits::variant_attribute)
    {
        return parse_sequence_plain(parser, first, last, context, rcontext, attr);
    }

    template <typename Left, typename Right, typename Iterator
      , typename Context, typename RContext, typename Attribute>
    bool parse_sequence(
        Left const& left, Right const& right
      , Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr
      , traits::container_attribute);

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence(
        Parser const& parser , Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr
      , traits::container_attribute)
    {
        Iterator save = first;
        if (parse_into_container(parser.left, first, last, context, rcontext, attr)
            && parse_into_container(parser.right, first, last, context, rcontext, attr))
            return true;
        first = save;
        return false;
    }

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence_assoc(
        Parser const& parser , Iterator& first, Iterator const& last
	  , Context const& context, RContext& rcontext, Attribute& attr, mpl::false_ /*should_split*/)
    {
	    return parse_into_container(parser, first, last, context, rcontext, attr);
    }

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence_assoc(
        Parser const& parser , Iterator& first, Iterator const& last
	  , Context const& context, RContext& rcontext, Attribute& attr, mpl::true_ /*should_split*/)
    {
        Iterator save = first;
        if (parser.left.parse( first, last, context, rcontext, attr)
            && parser.right.parse(first, last, context, rcontext, attr))
            return true;
        first = save;
        return false;
    }

    template <typename Parser, typename Iterator, typename Context
      , typename RContext, typename Attribute>
    bool parse_sequence(
        Parser const& parser, Iterator& first, Iterator const& last
      , Context const& context, RContext& rcontext, Attribute& attr
      , traits::associative_attribute)
    {
        // we can come here in 2 cases:
        // - when sequence is key >> value and therefore must
        // be parsed with tuple synthesized attribute and then
        // that tuple is used to save into associative attribute provided here.
        // Example:  key >> value;
        //
        // - when either this->left or this->right provides full key-value
        // pair (like in case 1) and another one provides nothing.
        // Example:  eps >> rule<class x; fusion::map<...> >
        //
        // first case must be parsed as whole, and second one should
        // be parsed separately for left and right.

        typedef typename traits::attribute_of<
            decltype(parser.left), Context>::type l_attr_type;
        typedef typename traits::attribute_of<
            decltype(parser.right), Context>::type r_attr_type;

        typedef typename
            mpl::or_<
                is_same<l_attr_type, unused_type>
              , is_same<r_attr_type, unused_type> >
        should_split;

        return parse_sequence_assoc(parser, first, last, context, rcontext, attr
          , should_split());
    }

    template <typename Left, typename Right, typename Context, typename RContext>
    struct parse_into_container_impl<sequence<Left, Right>, Context, RContext>
    {
        typedef sequence<Left, Right> parser_type;

        template <typename Iterator, typename Attribute>
        static bool call(
            parser_type const& parser
          , Iterator& first, Iterator const& last
          , Context const& context, RContext& rcontext, Attribute& attr, mpl::false_)
        {
            // inform user what went wrong if we jumped here in attempt to
            // parse incompatible sequence into fusion::map
            static_assert(!is_same< typename traits::attribute_category<Attribute>::type,
                  traits::associative_attribute>::value,
                  "To parse directly into fusion::map sequence must produce tuple attribute "
                  "where type of first element is existing key in fusion::map and second element "
                  "is value to be stored under that key");

            Attribute attr_;
            if (!parse_sequence(parser
			       , first, last, context, rcontext, attr_, traits::container_attribute()))
            {
                return false;
            }
            traits::append(attr, traits::begin(attr_), traits::end(attr_));
            return true;
        }

        template <typename Iterator, typename Attribute>
        static bool call(
            parser_type const& parser
          , Iterator& first, Iterator const& last
          , Context const& context, RContext& rcontext, Attribute& attr, mpl::true_)
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

            typedef typename
                traits::container_value<Attribute>::type
            value_type;

            return call(parser, first, last, context, rcontext, attr
	        , typename traits::is_substitute<attribute_type, value_type>::type());
        }
    };

}}}}

#endif
