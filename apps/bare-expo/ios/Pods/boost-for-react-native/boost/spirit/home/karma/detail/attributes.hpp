//  Copyright (c) 2001-2011 Hartmut Kaiser
//  Copyright (c) 2001-2011 Joel de Guzman
//
//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#if !defined(SPIRIT_KARMA_DETAIL_ATTRIBUTES_APR_18_2010_0453PM)
#define SPIRIT_KARMA_DETAIL_ATTRIBUTES_APR_18_2010_0453PM

#include <boost/spirit/home/karma/domain.hpp>
#include <boost/spirit/home/support/attributes_fwd.hpp>
#include <boost/spirit/home/support/attributes.hpp>

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace karma
{
    template <typename Exposed, typename Transformed, typename Enable = void>
    struct transform_attribute
    {
        typedef Transformed type;
        static Transformed pre(Exposed& val) 
        { 
            return Transformed(traits::extract_from<Transformed>(val, unused));
        }
        // Karma only, no post() and no fail() required
    };

    template <typename Exposed, typename Transformed>
    struct transform_attribute<boost::optional<Exposed> const, Transformed
      , typename disable_if<is_same<boost::optional<Exposed>, Transformed> >::type>
    {
        typedef Transformed const& type;
        static Transformed const& pre(boost::optional<Exposed> const& val)
        {
            return boost::get<Transformed>(val);
        }
    };

    template <typename Attribute>
    struct transform_attribute<Attribute const, Attribute>
    {
        typedef Attribute const& type;
        static Attribute const& pre(Attribute const& val) { return val; }
        // Karma only, no post() and no fail() required
    };

    // reference types need special handling
    template <typename Exposed, typename Transformed>
    struct transform_attribute<Exposed&, Transformed>
      : transform_attribute<Exposed, Transformed>
    {};

    template <typename Exposed, typename Transformed>
    struct transform_attribute<Exposed const&, Transformed>
      : transform_attribute<Exposed const, Transformed>
    {};

    template <typename Attribute>
    struct transform_attribute<Attribute const&, Attribute>
      : transform_attribute<Attribute const, Attribute>
    {};

    // unused_type needs some special handling as well
    template <>
    struct transform_attribute<unused_type, unused_type>
    {
        typedef unused_type type;
        static unused_type pre(unused_type) { return unused; }
    };

    template <>
    struct transform_attribute<unused_type const, unused_type>
      : transform_attribute<unused_type, unused_type>
    {};

    template <typename Attribute>
    struct transform_attribute<unused_type, Attribute>
      : transform_attribute<unused_type, unused_type>
    {};

    template <typename Attribute>
    struct transform_attribute<unused_type const, Attribute>
      : transform_attribute<unused_type, unused_type>
    {};

    template <typename Attribute>
    struct transform_attribute<Attribute, unused_type>
      : transform_attribute<unused_type, unused_type>
    {};

    template <typename Attribute>
    struct transform_attribute<Attribute const, unused_type>
      : transform_attribute<unused_type, unused_type>
    {};
}}}

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace traits
{
    template <typename Exposed, typename Transformed>
    struct transform_attribute<Exposed, Transformed, karma::domain>
      : karma::transform_attribute<Exposed, Transformed>
    {};
}}}

#endif


