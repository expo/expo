/*=============================================================================
    Copyright (c) 2002-2003 Hartmut Kaiser
    http://spirit.sourceforge.net/

    Use, modification and distribution is subject to the Boost Software
    License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(BOOST_SPIRIT_FUNDAMENTAL_IPP)
#define BOOST_SPIRIT_FUNDAMENTAL_IPP

#include <boost/mpl/int.hpp>

namespace boost { namespace spirit {

BOOST_SPIRIT_CLASSIC_NAMESPACE_BEGIN

namespace impl
{
    ///////////////////////////////////////////////////////////////////////////
    //
    //  Helper template for counting the number of nodes contained in a
    //  given parser type.
    //  All parser_category type parsers are counted as nodes.
    //
    ///////////////////////////////////////////////////////////////////////////
    template <typename CategoryT>
    struct nodes;

    template <>
    struct nodes<plain_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum { value = (LeafCountT::value + 1) };
        };
    };

    template <>
    struct nodes<unary_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            typedef typename ParserT::subject_t             subject_t;
            typedef typename subject_t::parser_category_t   subject_category_t;

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum { value = (nodes<subject_category_t>
                ::template count<subject_t, LeafCountT>::value + 1) };
        };
    };

    template <>
    struct nodes<action_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            typedef typename ParserT::subject_t             subject_t;
            typedef typename subject_t::parser_category_t   subject_category_t;

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum { value = (nodes<subject_category_t>
                ::template count<subject_t, LeafCountT>::value + 1) };
        };
    };

    template <>
    struct nodes<binary_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            typedef typename ParserT::left_t                left_t;
            typedef typename ParserT::right_t               right_t;
            typedef typename left_t::parser_category_t      left_category_t;
            typedef typename right_t::parser_category_t     right_category_t;

            typedef count self_t;

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum {
                leftcount = (nodes<left_category_t>
                    ::template count<left_t, LeafCountT>::value),
                rightcount = (nodes<right_category_t>
                    ::template count<right_t, LeafCountT>::value),
                value = ((self_t::leftcount) + (self_t::rightcount) + 1)
            };
        };
    };

    ///////////////////////////////////////////////////////////////////////////
    //
    //  Helper template for counting the number of leaf nodes contained in a
    //  given parser type.
    //  Only plain_parser_category type parsers are counted as leaf nodes.
    //
    ///////////////////////////////////////////////////////////////////////////
    template <typename CategoryT>
    struct leafs;

    template <>
    struct leafs<plain_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum { value = (LeafCountT::value + 1) };
        };
    };

    template <>
    struct leafs<unary_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            typedef typename ParserT::subject_t             subject_t;
            typedef typename subject_t::parser_category_t   subject_category_t;

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum { value = (leafs<subject_category_t>
                ::template count<subject_t, LeafCountT>::value) };
        };
    };

    template <>
    struct leafs<action_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            typedef typename ParserT::subject_t             subject_t;
            typedef typename subject_t::parser_category_t   subject_category_t;

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum { value = (leafs<subject_category_t>
                ::template count<subject_t, LeafCountT>::value) };
        };
    };

    template <>
    struct leafs<binary_parser_category> {

        template <typename ParserT, typename LeafCountT>
        struct count {

            typedef typename ParserT::left_t                left_t;
            typedef typename ParserT::right_t               right_t;
            typedef typename left_t::parser_category_t      left_category_t;
            typedef typename right_t::parser_category_t     right_category_t;

            typedef count self_t;

            // __BORLANDC__ == 0x0561 isn't happy with BOOST_STATIC_CONSTANT
            enum {
                leftcount = (leafs<left_category_t>
                    ::template count<left_t, LeafCountT>::value),
                rightcount = (leafs<right_category_t>
                    ::template count<right_t, LeafCountT>::value),
                value = (self_t::leftcount + self_t::rightcount)
            };
        };
    };

}   // namespace impl

///////////////////////////////////////////////////////////////////////////////
BOOST_SPIRIT_CLASSIC_NAMESPACE_END

}} // namespace boost::spirit

#endif // !defined(BOOST_SPIRIT_FUNDAMENTAL_IPP)
