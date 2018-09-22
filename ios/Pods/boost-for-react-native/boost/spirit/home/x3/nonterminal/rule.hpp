/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_X3_RULE_JAN_08_2012_0326PM)
#define BOOST_SPIRIT_X3_RULE_JAN_08_2012_0326PM

#include <boost/spirit/home/x3/nonterminal/detail/rule.hpp>
#include <boost/type_traits/is_same.hpp>
#include <boost/spirit/home/x3/support/context.hpp>
#include <boost/preprocessor/variadic/to_seq.hpp>
#include <boost/preprocessor/variadic/elem.hpp>
#include <boost/preprocessor/seq/for_each.hpp>

#if !defined(BOOST_SPIRIT_X3_NO_RTTI)
#include <typeinfo>
#endif

namespace boost { namespace spirit { namespace x3
{
    template <typename ID>
    struct identity {};

    // default parse_rule implementation
    template <typename ID, typename Attribute, typename Iterator
      , typename Context, typename ActualAttribute>
    inline detail::default_parse_rule_result
    parse_rule(
        rule<ID, Attribute> rule_
      , Iterator& first, Iterator const& last
      , Context const& context, ActualAttribute& attr)
    {
        static_assert(!is_same<decltype(get<ID>(context)), unused_type>::value,
            "BOOST_SPIRIT_DEFINE undefined for this rule.");
        return get<ID>(context).parse(first, last, context, unused, attr);
    }

    template <typename ID, typename RHS, typename Attribute, bool force_attribute_>
    struct rule_definition : parser<rule_definition<ID, RHS, Attribute, force_attribute_>>
    {
        typedef rule_definition<ID, RHS, Attribute, force_attribute_> this_type;
        typedef ID id;
        typedef RHS rhs_type;
        typedef rule<ID, Attribute> lhs_type;
        typedef Attribute attribute_type;

        static bool const has_attribute =
            !is_same<Attribute, unused_type>::value;
        static bool const handles_container =
            traits::is_container<Attribute>::value;
        static bool const force_attribute =
            force_attribute_;

        rule_definition(RHS const& rhs, char const* name)
          : rhs(rhs), name(name) {}

        template <typename Iterator, typename Context, typename Attribute_>
        bool parse(Iterator& first, Iterator const& last
          , Context const& context, unused_type, Attribute_& attr) const
        {
            return detail::rule_parser<attribute_type, ID>
                ::call_rule_definition(
                    rhs, name, first, last
                  , context
                  , attr
                  , mpl::bool_<force_attribute>());
        }

        RHS rhs;
        char const* name;
    };

    template <typename ID, typename Attribute, bool force_attribute_>
    struct rule : parser<rule<ID, Attribute>>
    {
        typedef ID id;
        typedef Attribute attribute_type;
        static bool const has_attribute =
            !is_same<Attribute, unused_type>::value;
        static bool const handles_container =
            traits::is_container<Attribute>::value;
        static bool const force_attribute = force_attribute_;

#if !defined(BOOST_SPIRIT_X3_NO_RTTI)
        rule() : name(typeid(rule).name()) {}
#else
        rule() : name("unnamed") {}
#endif

        rule(char const* name)
          : name(name) {}

        template <typename RHS>
        rule_definition<
            ID, typename extension::as_parser<RHS>::value_type, Attribute, force_attribute_>
        operator=(RHS const& rhs) const
        {
            return { as_parser(rhs), name };
        }

        template <typename RHS>
        rule_definition<
            ID, typename extension::as_parser<RHS>::value_type, Attribute, true>
        operator%=(RHS const& rhs) const
        {
            return { as_parser(rhs), name };
        }


        template <typename Iterator, typename Context, typename Attribute_>
        bool parse(Iterator& first, Iterator const& last
          , Context const& context, unused_type, Attribute_& attr) const
        {
            return parse_rule(*this, first, last, context, attr);
        }

        char const* name;
    };

    namespace traits
    {
        template <typename T, typename Enable = void>
        struct is_rule : mpl::false_ {};

        template <typename ID, typename Attribute>
        struct is_rule<rule<ID, Attribute>> : mpl::true_ {};

        template <typename ID, typename Attribute, typename RHS, bool force_attribute>
        struct is_rule<rule_definition<ID, RHS, Attribute, force_attribute>> : mpl::true_ {};
    }

    template <typename T>
    struct get_info<T, typename enable_if<traits::is_rule<T>>::type>
    {
        typedef std::string result_type;
        std::string operator()(T const& r) const
        {
            return r.name;
        }
    };

#define BOOST_SPIRIT_DECLARE_(r, data, rule_type)                               \
    template <typename Iterator, typename Context, typename Attribute>          \
    bool parse_rule(                                                            \
        rule_type rule_                                                         \
      , Iterator& first, Iterator const& last                                   \
      , Context const& context, Attribute& attr);                               \
    /***/

#define BOOST_SPIRIT_DECLARE(...) BOOST_PP_SEQ_FOR_EACH(                        \
    BOOST_SPIRIT_DECLARE_, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))            \
    /***/

#define BOOST_SPIRIT_DEFINE_(r, data, rule_name)                                \
    template <typename Iterator, typename Context, typename Attribute>          \
    inline bool parse_rule(                                                     \
        decltype(rule_name) rule_                                               \
      , Iterator& first, Iterator const& last                                   \
      , Context const& context, Attribute& attr)                                \
    {                                                                           \
        using boost::spirit::x3::unused;                                        \
        static auto const def_ = (rule_name = BOOST_PP_CAT(rule_name, _def));   \
        return def_.parse(first, last, context, unused, attr);                  \
    }                                                                           \
    /***/

#define BOOST_SPIRIT_DEFINE(...) BOOST_PP_SEQ_FOR_EACH(                         \
    BOOST_SPIRIT_DEFINE_, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))             \
    /***/

#define BOOST_SPIRIT_INSTANTIATE(rule_type, Iterator, Context)                  \
    template bool parse_rule<Iterator, Context, rule_type::attribute_type>(     \
        rule_type rule_                                                         \
      , Iterator& first, Iterator const& last                                   \
      , Context const& context, rule_type::attribute_type& attr);               \
    /***/


}}}

#endif
