// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_STRTOL_CONVERTER_HPP
#define BOOST_CONVERT_STRTOL_CONVERTER_HPP

#include <boost/convert/base.hpp>
#include <boost/type_traits/make_unsigned.hpp>
#include <boost/type_traits/is_same.hpp>
#include <boost/math/special_functions/round.hpp>
#include <limits>
#include <cmath>
#include <cstdlib>
#include <climits>

#if __GNUC__ == 4 && __GNUC_MINOR__ <= 2
namespace std
{
    using ::strtold; // Tests indicated that gcc-4.2.1 does not have 'std::strtold'
}
#endif

namespace boost { namespace cnv
{
    struct strtol;
}}

/// @brief std::strtol-based extended converter
/// @details The converter offers a fairly decent overall performance and moderate formatting facilities.

struct boost::cnv::strtol : public boost::cnv::cnvbase<boost::cnv::strtol>
{
    typedef boost::cnv::strtol             this_type;
    typedef boost::cnv::cnvbase<this_type> base_type;

    using base_type::operator();

    private:

    friend struct boost::cnv::cnvbase<this_type>;

    template<typename string_type> void str_to(cnv::range<string_type> v, optional<   int_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<  sint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<  lint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional< llint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<  uint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional< usint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional< ulint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<ullint_type>& r) const { str_to_i (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<   flt_type>& r) const { str_to_d (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<   dbl_type>& r) const { str_to_d (v, r); }
    template<typename string_type> void str_to(cnv::range<string_type> v, optional<  ldbl_type>& r) const { str_to_d (v, r); }

    template <typename char_type> cnv::range<char_type*> to_str (   int_type v, char_type* buf) const { return i_to_str(v, buf); }
    template <typename char_type> cnv::range<char_type*> to_str (  uint_type v, char_type* buf) const { return i_to_str(v, buf); }
    template <typename char_type> cnv::range<char_type*> to_str (  lint_type v, char_type* buf) const { return i_to_str(v, buf); }
    template <typename char_type> cnv::range<char_type*> to_str ( ulint_type v, char_type* buf) const { return i_to_str(v, buf); }
    template <typename char_type> cnv::range<char_type*> to_str ( llint_type v, char_type* buf) const { return i_to_str(v, buf); }
    template <typename char_type> cnv::range<char_type*> to_str (ullint_type v, char_type* buf) const { return i_to_str(v, buf); }
    template <typename char_type> cnv::range<char_type*> to_str ( dbl_type v, char_type* buf) const;

    template<typename char_type, typename in_type> cnv::range<char_type*> i_to_str (in_type, char_type*) const;
    template<typename string_type, typename out_type> void                str_to_i (cnv::range<string_type>, optional<out_type>&) const;
    template<typename string_type, typename out_type> void                str_to_d (cnv::range<string_type>, optional<out_type>&) const;

    static double adjust_fraction (double, int);
    static int           get_char (int v) { return (v < 10) ? (v += '0') : (v += 'A' - 10); }
};

template<typename char_type, typename Type>
boost::cnv::range<char_type*>
boost::cnv::strtol::i_to_str(Type in_value, char_type* buf) const
{
    // C1. Base=10 optimization improves performance 10%

    typedef typename boost::make_unsigned<Type>::type unsigned_type;

    char_type*         beg = buf + bufsize_ / 2;
    char_type*         end = beg;
    bool const is_negative = in_value < 0;
    unsigned_type    value = static_cast<unsigned_type>(is_negative ? -in_value : in_value);

    if (base_ == 10) for (; value; *(--beg) = int(value % 10) + '0', value /= 10); //C1
    else             for (; value; *(--beg) = get_char(value % base_), value /= base_);

    if (beg == end)  *(--beg) = '0';
    if (is_negative) *(--beg) = '-';

    return cnv::range<char_type*>(beg, end);
}

inline
double
boost::cnv::strtol::adjust_fraction(double fraction, int precision)
{
    // C1. Bring forward the fraction coming right after precision digits.
    //     That is, say, fraction=0.234567, precision=2. Then brought forward=23.4567
    // C3. INT_MAX(4bytes)=2,147,483,647. So, 10^8 seems appropriate. If not, drop it down to 4.
    // C4. ::round() returns the integral value that is nearest to x,
    //     with halfway cases rounded away from zero. Therefore,
    //          round( 0.4) =  0
    //          round( 0.5) =  1
    //          round( 0.6) =  1
    //          round(-0.4) =  0
    //          round(-0.5) = -1
    //          round(-0.6) = -1

    int const tens[] = { 1, 10, 100, 1000, 10000, 100000, 1000000, 10000000 };

    for (int k = precision / 8; k; --k) fraction *= 100000000; //C3.

    fraction *= tens[precision % 8]; //C1

//  return ::rint(fraction); //C4
    return boost::math::round(fraction); //C4
}

template <typename char_type>
inline
boost::cnv::range<char_type*>
boost::cnv::strtol::to_str(double value, char_type* buf) const
{
    char_type*         beg = buf + bufsize_ / 2;
    char_type*         end = beg;
    char_type*        ipos = end - 1;
    bool const is_negative = (value < 0) ? (value = -value, true) : false;
    double           ipart = std::floor(value);
    double           fpart = adjust_fraction(value - ipart, precision_);
    int          precision = precision_;
    int const         base = 10;

    for (; 1 <= ipart; ipart /= base)
        *(--beg) = get_char(int(ipart - std::floor(ipart / base) * base));

    if (beg == end) *(--beg) = '0';
    if (precision)  *(end++) = '.';

    for (char_type* fpos = end += precision; precision; --precision, fpart /= base)
        *(--fpos) = get_char(int(fpart - std::floor(fpart / base) * base));

    if (1 <= fpart)
    {
        for (; beg <= ipos; --ipos)
            if (*ipos == '9') *ipos = '0';
            else { ++*ipos; break; }

        if (ipos < beg)
            *(beg = ipos) = '1';
    }
    if (is_negative) *(--beg) = '-';

    return cnv::range<char_type*>(beg, end);
}

template<typename string_type, typename out_type>
void
boost::cnv::strtol::str_to_i(cnv::range<string_type> range, boost::optional<out_type>& result_out) const
{
    typedef typename boost::make_unsigned<out_type>::type unsigned_type;
    typedef cnv::range<string_type>                          range_type;
    typedef typename range_type::iterator                      iterator;

    iterator             s = range.begin();
    unsigned int        ch = *s;
    bool const is_negative = ch == '-' ? (ch = *++s, true) : ch == '+' ? (ch = *++s, false) : false;
    bool const is_unsigned = boost::is_same<out_type, unsigned_type>::value;
    unsigned int      base = base_;

    /**/ if (is_negative && is_unsigned) return;
    else if ((base == 0 || base == 16) && ch == '0' && (*++s == 'x' || *s == 'X')) ++s, base = 16;
    else if (base == 0) base = ch == '0' ? (++s, 8) : 10;

    unsigned_type const    max = (std::numeric_limits<out_type>::max)() + (is_negative ? 1 : 0);
    unsigned_type const cutoff = max / base;
    unsigned int  const cutlim = max % base;
    unsigned_type       result = 0;

    for (; s != range.sentry(); ++s)
    {
        ch = *s;

        /**/ if (std::isdigit(ch)) ch -= '0';
        else if (std::isalpha(ch)) ch -= (std::isupper(ch) ? 'A' : 'a') - 10;
        else return;

        if (base <= ch || cutoff < result || (result == cutoff && cutlim < ch))
            return;

        result *= base;
        result += ch;
    }
    result_out = is_negative ? -out_type(result) : out_type(result);
}

template<typename string_type, typename out_type>
void
boost::cnv::strtol::str_to_d(cnv::range<string_type> range, optional<out_type>& result_out) const
{
    // C2. Simply check if the end-of-string was reached -- *cnv_end == 0
    //     instead of traversing once with strlen() to find the end iterator
    //     and then comparing to it as in
    //         char const* end = str + strlen(str); // Unnecessary traversal!
    //         bool const good = ... && cnv_end == end;

    typedef cnv::range<string_type>      range_type;
    typedef typename range_type::value_type ch_type;

    ch_type const* str = &*range.begin(); // Currently only works with 'char'
    char*      cnv_end = 0;
    ldbl_type   result = strtold(str, &cnv_end);
    bool          good = result != -HUGE_VALL && result != HUGE_VALL && *cnv_end == 0/*C2*/;
    out_type       max = (std::numeric_limits<out_type>::max)();

    if (good && -max <= result && result <= max)
        result_out = out_type(result);
}

#endif // BOOST_CONVERT_STRTOL_CONVERTER_HPP
