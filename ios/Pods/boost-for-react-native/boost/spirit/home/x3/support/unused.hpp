/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman
    Copyright (c) 2001-2011 Hartmut Kaiser

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_X3_UNUSED_APRIL_16_2006_0616PM)
#define BOOST_SPIRIT_X3_UNUSED_APRIL_16_2006_0616PM

#include <ostream>
#include <istream>
#include <boost/mpl/identity.hpp>

#if defined(BOOST_MSVC)
# pragma warning(push)
# pragma warning(disable: 4522) // multiple assignment operators specified warning
#endif

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace x3
{
    struct unused_type
    {
        unused_type()
        {
        }

        template <typename T>
        unused_type(T const&)
        {
        }

        template <typename T>
        unused_type const&
        operator=(T const&) const
        {
            return *this;
        }

        template <typename T>
        unused_type&
        operator=(T const&)
        {
            return *this;
        }

        unused_type const&
        operator=(unused_type const&) const
        {
            return *this;
        }

        unused_type&
        operator=(unused_type const&)
        {
            return *this;
        }

        // unused_type can also masquerade as an empty context (see context.hpp)

        template <typename ID>
        unused_type get(ID) const
        {
            return {};
        }
    };

    auto const unused = unused_type{};

    inline std::ostream& operator<<(std::ostream& out, unused_type const&)
    {
        return out;
    }

    inline std::istream& operator>>(std::istream& in, unused_type&)
    {
        return in;
    }
}}}

#if defined(BOOST_MSVC)
# pragma warning(pop)
#endif

#endif
