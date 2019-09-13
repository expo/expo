// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_STRINGSTREAM_BASED_CONVERTER_HPP
#define BOOST_CONVERT_STRINGSTREAM_BASED_CONVERTER_HPP

#include <boost/convert/parameters.hpp>
#include <boost/convert/detail/is_string.hpp>
#include <boost/make_default.hpp>
#include <sstream>
#include <iomanip>

#define BOOST_CNV_STRING_ENABLE                                         \
    template<typename string_type, typename type>                       \
    typename boost::enable_if<cnv::is_string<string_type>, void>::type  \
    operator()

#define BOOST_CNV_PARAM(PARAM_NAME, PARAM_TYPE) \
    this_type&                                  \
    operator()(boost::parameter::aux::tag<boost::cnv::parameter::type::PARAM_NAME, PARAM_TYPE>::type const& arg)

namespace boost { namespace cnv
{
    template<class Char> struct basic_stream;

    typedef boost::cnv::basic_stream<char>    cstream;
    typedef boost::cnv::basic_stream<wchar_t> wstream;
}}

template<class Char>
struct boost::cnv::basic_stream : boost::noncopyable
{
    // C01. In string-to-type conversions the "string" must be a CONTIGUOUS ARRAY of
    //      characters because "ibuffer_type" uses/relies on that (it deals with char_type*).
    // C02. Use the provided "string_in" as the input (read-from) buffer and, consequently,
    //      avoid the overhead associated with stream_.str(string_in) --
    //      copying of the content into internal buffer.
    // C03. The "strbuf.gptr() != strbuf.egptr()" check replaces "istream.eof() != true"
    //      which for some reason does not work when we try converting the "true" string
    //      to "bool" with std::boolalpha set. Seems that istream state gets unsynced compared
    //      to the actual underlying buffer.

    typedef Char                                 char_type;
    typedef boost::cnv::basic_stream<char_type>  this_type;
    typedef std::basic_stringstream<char_type> stream_type;
    typedef std::basic_istream<char_type>     istream_type;
    typedef std::basic_streambuf<char_type>    buffer_type;
    typedef std::basic_string<char_type>       stdstr_type;
    typedef std::ios_base& (*manipulator_type)(std::ios_base&);

    struct ibuffer_type : public buffer_type
    {
        using buffer_type::eback;
        using buffer_type::gptr;
        using buffer_type::egptr;

        ibuffer_type(char_type const* beg, std::size_t sz) //C01
        {
            char_type* b = const_cast<char_type*>(beg);

            buffer_type::setg(b, b, b + sz);
        }
    };
    struct obuffer_type : public buffer_type
    {
        using buffer_type::pbase;
        using buffer_type::pptr;
        using buffer_type::epptr;
    };

    basic_stream() : stream_(std::ios_base::in | std::ios_base::out) {}
#if !defined( BOOST_NO_CXX11_RVALUE_REFERENCES )
    basic_stream(this_type&& other) : stream_(std::move(other.stream_)) {}
#endif

    BOOST_CNV_STRING_ENABLE(type const& v, optional<string_type>& s) const { to_str(v, s); }
    BOOST_CNV_STRING_ENABLE(string_type const& s, optional<type>& r) const { str_to(cnv::range<string_type const>(s), r); }
    // Resolve ambiguity of string-to-string
    template<typename type> void operator()(  char_type const* s, optional<type>& r) const { str_to(cnv::range< char_type const*>(s), r); }
    template<typename type> void operator()(stdstr_type const& s, optional<type>& r) const { str_to(cnv::range<stdstr_type const>(s), r); }

    // Formatters
    template<typename manipulator>
    this_type& operator() (manipulator m) { return (stream_ << m, *this); }
    this_type& operator() (manipulator_type m) { return (m(stream_), *this); }
    this_type& operator() (std::locale const& l) { return (stream_.imbue(l), *this); }

    BOOST_CNV_PARAM(locale, std::locale const) { return (stream_.imbue(arg[cnv::parameter::locale]), *this); }
    BOOST_CNV_PARAM(precision,      int const) { return (stream_.precision(arg[cnv::parameter::precision]), *this); }
    BOOST_CNV_PARAM(precision,            int) { return (stream_.precision(arg[cnv::parameter::precision]), *this); }
    BOOST_CNV_PARAM(width,          int const) { return (stream_.width(arg[cnv::parameter::width]), *this); }
    BOOST_CNV_PARAM(fill,          char const) { return (stream_.fill(arg[cnv::parameter::fill]), *this); }
    BOOST_CNV_PARAM(uppercase,     bool const)
    {
        bool uppercase = arg[cnv::parameter::uppercase];
        uppercase ? (void) stream_.setf(std::ios::uppercase) : stream_.unsetf(std::ios::uppercase);
        return *this;
    }
    BOOST_CNV_PARAM(skipws, bool const)
    {
        bool skipws = arg[cnv::parameter::skipws];
        skipws ? (void) stream_.setf(std::ios::skipws) : stream_.unsetf(std::ios::skipws);
        return *this;
    }
    BOOST_CNV_PARAM(adjust, boost::cnv::adjust::type const)
    {
        cnv::adjust::type adjust = arg[cnv::parameter::adjust];

        /**/ if (adjust == cnv::adjust:: left) stream_.setf(std::ios::adjustfield, std::ios:: left);
        else if (adjust == cnv::adjust::right) stream_.setf(std::ios::adjustfield, std::ios::right);
        else BOOST_ASSERT(!"Not implemented");

        return *this;
    }
    BOOST_CNV_PARAM(base, boost::cnv::base::type const)
    {
        cnv::base::type base = arg[cnv::parameter::base];
        
        /**/ if (base == cnv::base::dec) std::dec(stream_);
        else if (base == cnv::base::hex) std::hex(stream_);
        else if (base == cnv::base::oct) std::oct(stream_);
        else BOOST_ASSERT(!"Not implemented");
        
        return *this;
    }
    BOOST_CNV_PARAM(notation, boost::cnv::notation::type const)
    {
        cnv::notation::type notation = arg[cnv::parameter::notation];
        
        /**/ if (notation == cnv::notation::     fixed)      std::fixed(stream_);
        else if (notation == cnv::notation::scientific) std::scientific(stream_);
        else BOOST_ASSERT(!"Not implemented");
        
        return *this;
    }

    private:

    template<typename string_type, typename out_type> void str_to(cnv::range<string_type>, optional<out_type>&) const;
    template<typename string_type, typename  in_type> void to_str(in_type const&, optional<string_type>&) const;

    mutable stream_type stream_;
};

template<typename char_type>
template<typename string_type, typename in_type>
inline
void
boost::cnv::basic_stream<char_type>::to_str(
    in_type const& value_in,
    boost::optional<string_type>& string_out) const
{
    stream_.clear();            // Clear the flags
    stream_.str(stdstr_type()); // Clear/empty the content of the stream

    if (!(stream_ << value_in).fail())
    {
        buffer_type*     buf = stream_.rdbuf();
        obuffer_type*   obuf = static_cast<obuffer_type*>(buf);
        char_type const* beg = obuf->pbase();
        char_type const* end = obuf->pptr();

        string_out = string_type(beg, end); // Instead of stream_.str();
    }
}

template<typename char_type>
template<typename string_type, typename out_type>
inline
void
boost::cnv::basic_stream<char_type>::str_to(
    boost::cnv::range<string_type> string_in,
    boost::optional<out_type>& result_out) const
{
    if (string_in.empty ()) return;

    istream_type& istream = stream_;
    buffer_type*   oldbuf = istream.rdbuf();
    char_type const*  beg = &*string_in.begin();
    std::size_t        sz = string_in.end() - string_in.begin();
    ibuffer_type   newbuf (beg, sz); //C02

    istream.rdbuf(&newbuf);
    istream.clear(); // Clear the flags

    istream >> *(result_out = boost::make_default<out_type>());

    if (istream.fail() || newbuf.gptr() != newbuf.egptr()/*C03*/)
        result_out = boost::none;

    istream.rdbuf(oldbuf);
}

#undef BOOST_CNV_STRING_ENABLE
#undef BOOST_CNV_PARAM

#endif // BOOST_CONVERT_STRINGSTREAM_BASED_CONVERTER_HPP
