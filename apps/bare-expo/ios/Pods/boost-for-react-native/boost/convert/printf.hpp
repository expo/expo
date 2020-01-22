// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_PRINTF_HPP
#define BOOST_CONVERT_PRINTF_HPP

#include <boost/convert/base.hpp>
#include <boost/make_default.hpp>
#include <boost/mpl/vector.hpp>
#include <boost/mpl/find.hpp>
#include <boost/range/as_literal.hpp>
#include <string>
#include <cstdio>

namespace boost { namespace cnv
{
    struct printf;
}}

struct boost::cnv::printf : public boost::cnv::cnvbase<boost::cnv::printf>
{
    typedef boost::cnv::printf             this_type;
    typedef boost::cnv::cnvbase<this_type> base_type;

    using base_type::operator();

    template<typename in_type>
    cnv::range<char*>
    to_str(in_type value_in, char* buf) const
    {
        char const*     fmt = pformat(pos<in_type>());
        int const num_chars = snprintf(buf, bufsize_, fmt, precision_, value_in);
        bool const  success = num_chars < bufsize_;

        return cnv::range<char*>(buf, success ? (buf + num_chars) : buf);
    }
    template<typename string_type, typename out_type>
    void
    str_to(cnv::range<string_type> range, optional<out_type>& result_out) const
    {
        out_type    result = boost::make_default<out_type>();
        int const num_read = sscanf(&*range.begin(), format(pos<out_type>()), &result);

        if (num_read == 1)
            result_out = result;
    }

    private:

    template<typename Type> int pos() const
    {
        typedef boost::mpl::vector<double, float,
                                   int, unsigned int,
                                   short int, unsigned short int,
                                   long int, unsigned long int
                                   > managed_types;

        typedef typename boost::mpl::find<managed_types, Type>::type type_iterator;
        typedef typename type_iterator::pos                               type_pos;

        return type_pos::value;
    }

    char const* pformat(int pos) const
    {
        static char const* d_format[] = { "%.*f", "%.*f", "%.*d", "%.*u", "%.*hd", "%.*hu", "%.*ld", "%.*lu" }; // Must match managed_types
        static char const* x_format[] = { "%.*f", "%.*f", "%.*x", "%.*x", "%.*hx", "%.*hx", "%.*lx", "%.*lx" }; // Must match managed_types
        static char const* o_format[] = { "%.*f", "%.*f", "%.*o", "%.*o", "%.*ho", "%.*ho", "%.*lo", "%.*lo" }; // Must match managed_types
        char const*            format = base_ == 10 ? d_format[pos]
                                      : base_ == 16 ? x_format[pos]
                                      : base_ ==  8 ? o_format[pos]
                                      : (BOOST_ASSERT(0), (char const*) 0);
        return format;
    }
    char const* format(int pos) const
    {
        static char const* d_format[] = { "%f", "%f", "%d", "%u", "%hd", "%hu", "%ld", "%lu" }; // Must match managed_types
        static char const* x_format[] = { "%f", "%f", "%x", "%x", "%hx", "%hx", "%lx", "%lx" }; // Must match managed_types
        static char const* o_format[] = { "%f", "%f", "%o", "%o", "%ho", "%ho", "%lo", "%lo" }; // Must match managed_types
        char const*            format = base_ == 10 ? d_format[pos]
                                      : base_ == 16 ? x_format[pos]
                                      : base_ ==  8 ? o_format[pos]
                                      : (BOOST_ASSERT(0), (char const*) 0);
        return format;
    }
};

#endif // BOOST_CONVERT_PRINTF_HPP
