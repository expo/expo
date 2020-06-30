//  Boost rational.hpp header file  ------------------------------------------//

//  (C) Copyright Paul Moore 1999. Permission to copy, use, modify, sell and
//  distribute this software is granted provided this copyright notice appears
//  in all copies. This software is provided "as is" without express or
//  implied warranty, and with no claim as to its suitability for any purpose.

// boostinspect:nolicense (don't complain about the lack of a Boost license)
// (Paul Moore hasn't been in contact for years, so there's no way to change the
// license.)

//  See http://www.boost.org/libs/rational for documentation.

//  Credits:
//  Thanks to the boost mailing list in general for useful comments.
//  Particular contributions included:
//    Andrew D Jewell, for reminding me to take care to avoid overflow
//    Ed Brey, for many comments, including picking up on some dreadful typos
//    Stephen Silver contributed the test suite and comments on user-defined
//    IntType
//    Nickolay Mladenov, for the implementation of operator+=

//  Revision History
//  02 Sep 13  Remove unneeded forward declarations; tweak private helper
//             function (Daryle Walker)
//  30 Aug 13  Improve exception safety of "assign"; start modernizing I/O code
//             (Daryle Walker)
//  27 Aug 13  Add cross-version constructor template, plus some private helper
//             functions; add constructor to exception class to take custom
//             messages (Daryle Walker)
//  25 Aug 13  Add constexpr qualification wherever possible (Daryle Walker)
//  05 May 12  Reduced use of implicit gcd (Mario Lang)
//  05 Nov 06  Change rational_cast to not depend on division between different
//             types (Daryle Walker)
//  04 Nov 06  Off-load GCD and LCM to Boost.Math; add some invariant checks;
//             add std::numeric_limits<> requirement to help GCD (Daryle Walker)
//  31 Oct 06  Recoded both operator< to use round-to-negative-infinity
//             divisions; the rational-value version now uses continued fraction
//             expansion to avoid overflows, for bug #798357 (Daryle Walker)
//  20 Oct 06  Fix operator bool_type for CW 8.3 (Joaquín M López Muñoz)
//  18 Oct 06  Use EXPLICIT_TEMPLATE_TYPE helper macros from Boost.Config
//             (Joaquín M López Muñoz)
//  27 Dec 05  Add Boolean conversion operator (Daryle Walker)
//  28 Sep 02  Use _left versions of operators from operators.hpp
//  05 Jul 01  Recode gcd(), avoiding std::swap (Helmut Zeisel)
//  03 Mar 01  Workarounds for Intel C++ 5.0 (David Abrahams)
//  05 Feb 01  Update operator>> to tighten up input syntax
//  05 Feb 01  Final tidy up of gcd code prior to the new release
//  27 Jan 01  Recode abs() without relying on abs(IntType)
//  21 Jan 01  Include Nickolay Mladenov's operator+= algorithm,
//             tidy up a number of areas, use newer features of operators.hpp
//             (reduces space overhead to zero), add operator!,
//             introduce explicit mixed-mode arithmetic operations
//  12 Jan 01  Include fixes to handle a user-defined IntType better
//  19 Nov 00  Throw on divide by zero in operator /= (John (EBo) David)
//  23 Jun 00  Incorporate changes from Mark Rodgers for Borland C++
//  22 Jun 00  Change _MSC_VER to BOOST_MSVC so other compilers are not
//             affected (Beman Dawes)
//   6 Mar 00  Fix operator-= normalization, #include <string> (Jens Maurer)
//  14 Dec 99  Modifications based on comments from the boost list
//  09 Dec 99  Initial Version (Paul Moore)

#ifndef BOOST_RATIONAL_HPP
#define BOOST_RATIONAL_HPP

#include <boost/config.hpp>      // for BOOST_NO_STDC_NAMESPACE, BOOST_MSVC, etc
#ifndef BOOST_NO_IOSTREAM
#include <iomanip>               // for std::setw
#include <ios>                   // for std::noskipws, streamsize
#include <istream>               // for std::istream
#include <ostream>               // for std::ostream
#include <sstream>               // for std::ostringstream
#endif
#include <cstddef>               // for NULL
#include <stdexcept>             // for std::domain_error
#include <string>                // for std::string implicit constructor
#include <boost/operators.hpp>   // for boost::addable etc
#include <cstdlib>               // for std::abs
#include <boost/call_traits.hpp> // for boost::call_traits
#include <boost/detail/workaround.hpp> // for BOOST_WORKAROUND
#include <boost/assert.hpp>      // for BOOST_ASSERT
#include <boost/integer/common_factor_rt.hpp> // for boost::integer::gcd, lcm
#include <limits>                // for std::numeric_limits
#include <boost/static_assert.hpp>  // for BOOST_STATIC_ASSERT
#include <boost/throw_exception.hpp>

// Control whether depreciated GCD and LCM functions are included (default: yes)
#ifndef BOOST_CONTROL_RATIONAL_HAS_GCD
#define BOOST_CONTROL_RATIONAL_HAS_GCD  1
#endif

namespace boost {

#if BOOST_CONTROL_RATIONAL_HAS_GCD
template <typename IntType>
IntType gcd(IntType n, IntType m)
{
    // Defer to the version in Boost.Math
    return integer::gcd( n, m );
}

template <typename IntType>
IntType lcm(IntType n, IntType m)
{
    // Defer to the version in Boost.Math
    return integer::lcm( n, m );
}
#endif  // BOOST_CONTROL_RATIONAL_HAS_GCD

class bad_rational : public std::domain_error
{
public:
    explicit bad_rational() : std::domain_error("bad rational: zero denominator") {}
    explicit bad_rational( char const *what ) : std::domain_error( what ) {}
};

template <typename IntType>
class rational :
    less_than_comparable < rational<IntType>,
    equality_comparable < rational<IntType>,
    less_than_comparable2 < rational<IntType>, IntType,
    equality_comparable2 < rational<IntType>, IntType,
    addable < rational<IntType>,
    subtractable < rational<IntType>,
    multipliable < rational<IntType>,
    dividable < rational<IntType>,
    addable2 < rational<IntType>, IntType,
    subtractable2 < rational<IntType>, IntType,
    subtractable2_left < rational<IntType>, IntType,
    multipliable2 < rational<IntType>, IntType,
    dividable2 < rational<IntType>, IntType,
    dividable2_left < rational<IntType>, IntType,
    incrementable < rational<IntType>,
    decrementable < rational<IntType>
    > > > > > > > > > > > > > > > >
{
    // Class-wide pre-conditions
    BOOST_STATIC_ASSERT( ::std::numeric_limits<IntType>::is_specialized );

    // Helper types
    typedef typename boost::call_traits<IntType>::param_type param_type;

    struct helper { IntType parts[2]; };
    typedef IntType (helper::* bool_type)[2];

public:
    // Component type
    typedef IntType int_type;

    BOOST_CONSTEXPR
    rational() : num(0), den(1) {}
    BOOST_CONSTEXPR
    rational(param_type n) : num(n), den(1) {}
    rational(param_type n, param_type d) : num(n), den(d) { normalize(); }

#ifndef BOOST_NO_MEMBER_TEMPLATES
    template < typename NewType >
    BOOST_CONSTEXPR explicit
       rational(rational<NewType> const &r)
       : num(r.numerator()), den(is_normalized(int_type(r.numerator()),
       int_type(r.denominator())) ? r.denominator() :
       (BOOST_THROW_EXCEPTION(bad_rational("bad rational: denormalized conversion")), 0)){}
#endif

    // Default copy constructor and assignment are fine

    // Add assignment from IntType
    rational& operator=(param_type i) { num = i; den = 1; return *this; }

    // Assign in place
    rational& assign(param_type n, param_type d);

    // Access to representation
    BOOST_CONSTEXPR
    const IntType& numerator() const { return num; }
    BOOST_CONSTEXPR
    const IntType& denominator() const { return den; }

    // Arithmetic assignment operators
    rational& operator+= (const rational& r);
    rational& operator-= (const rational& r);
    rational& operator*= (const rational& r);
    rational& operator/= (const rational& r);

    rational& operator+= (param_type i) { num += i * den; return *this; }
    rational& operator-= (param_type i) { num -= i * den; return *this; }
    rational& operator*= (param_type i);
    rational& operator/= (param_type i);

    // Increment and decrement
    const rational& operator++() { num += den; return *this; }
    const rational& operator--() { num -= den; return *this; }

    // Operator not
    BOOST_CONSTEXPR
    bool operator!() const { return !num; }

    // Boolean conversion
    
#if BOOST_WORKAROUND(__MWERKS__,<=0x3003)
    // The "ISO C++ Template Parser" option in CW 8.3 chokes on the
    // following, hence we selectively disable that option for the
    // offending memfun.
#pragma parse_mfunc_templ off
#endif

    BOOST_CONSTEXPR
    operator bool_type() const { return operator !() ? 0 : &helper::parts; }

#if BOOST_WORKAROUND(__MWERKS__,<=0x3003)
#pragma parse_mfunc_templ reset
#endif

    // Comparison operators
    bool operator< (const rational& r) const;
    BOOST_CONSTEXPR
    bool operator== (const rational& r) const;

    bool operator< (param_type i) const;
    bool operator> (param_type i) const;
    BOOST_CONSTEXPR
    bool operator== (param_type i) const;

private:
    // Implementation - numerator and denominator (normalized).
    // Other possibilities - separate whole-part, or sign, fields?
    IntType num;
    IntType den;

    // Helper functions
    static BOOST_CONSTEXPR
    int_type inner_gcd( param_type a, param_type b, int_type const &zero =
     int_type(0) )
    { return b == zero ? a : inner_gcd(b, a % b, zero); }

    static BOOST_CONSTEXPR
    int_type inner_abs( param_type x, int_type const &zero = int_type(0) )
    { return x < zero ? -x : +x; }

    // Representation note: Fractions are kept in normalized form at all
    // times. normalized form is defined as gcd(num,den) == 1 and den > 0.
    // In particular, note that the implementation of abs() below relies
    // on den always being positive.
    bool test_invariant() const;
    void normalize();

    static BOOST_CONSTEXPR
    bool is_normalized( param_type n, param_type d, int_type const &zero =
     int_type(0), int_type const &one = int_type(1) )
    {
        return d > zero && ( n != zero || d == one ) && inner_abs( inner_gcd(n,
         d, zero), zero ) == one;
    }
};

// Assign in place
template <typename IntType>
inline rational<IntType>& rational<IntType>::assign(param_type n, param_type d)
{
    return *this = rational( n, d );
}

// Unary plus and minus
template <typename IntType>
BOOST_CONSTEXPR
inline rational<IntType> operator+ (const rational<IntType>& r)
{
    return r;
}

template <typename IntType>
inline rational<IntType> operator- (const rational<IntType>& r)
{
    return rational<IntType>(-r.numerator(), r.denominator());
}

// Arithmetic assignment operators
template <typename IntType>
rational<IntType>& rational<IntType>::operator+= (const rational<IntType>& r)
{
    // This calculation avoids overflow, and minimises the number of expensive
    // calculations. Thanks to Nickolay Mladenov for this algorithm.
    //
    // Proof:
    // We have to compute a/b + c/d, where gcd(a,b)=1 and gcd(b,c)=1.
    // Let g = gcd(b,d), and b = b1*g, d=d1*g. Then gcd(b1,d1)=1
    //
    // The result is (a*d1 + c*b1) / (b1*d1*g).
    // Now we have to normalize this ratio.
    // Let's assume h | gcd((a*d1 + c*b1), (b1*d1*g)), and h > 1
    // If h | b1 then gcd(h,d1)=1 and hence h|(a*d1+c*b1) => h|a.
    // But since gcd(a,b1)=1 we have h=1.
    // Similarly h|d1 leads to h=1.
    // So we have that h | gcd((a*d1 + c*b1) , (b1*d1*g)) => h|g
    // Finally we have gcd((a*d1 + c*b1), (b1*d1*g)) = gcd((a*d1 + c*b1), g)
    // Which proves that instead of normalizing the result, it is better to
    // divide num and den by gcd((a*d1 + c*b1), g)

    // Protect against self-modification
    IntType r_num = r.num;
    IntType r_den = r.den;

    IntType g = integer::gcd(den, r_den);
    den /= g;  // = b1 from the calculations above
    num = num * (r_den / g) + r_num * den;
    g = integer::gcd(num, g);
    num /= g;
    den *= r_den/g;

    return *this;
}

template <typename IntType>
rational<IntType>& rational<IntType>::operator-= (const rational<IntType>& r)
{
    // Protect against self-modification
    IntType r_num = r.num;
    IntType r_den = r.den;

    // This calculation avoids overflow, and minimises the number of expensive
    // calculations. It corresponds exactly to the += case above
    IntType g = integer::gcd(den, r_den);
    den /= g;
    num = num * (r_den / g) - r_num * den;
    g = integer::gcd(num, g);
    num /= g;
    den *= r_den/g;

    return *this;
}

template <typename IntType>
rational<IntType>& rational<IntType>::operator*= (const rational<IntType>& r)
{
    // Protect against self-modification
    IntType r_num = r.num;
    IntType r_den = r.den;

    // Avoid overflow and preserve normalization
    IntType gcd1 = integer::gcd(num, r_den);
    IntType gcd2 = integer::gcd(r_num, den);
    num = (num/gcd1) * (r_num/gcd2);
    den = (den/gcd2) * (r_den/gcd1);
    return *this;
}

template <typename IntType>
rational<IntType>& rational<IntType>::operator/= (const rational<IntType>& r)
{
    // Protect against self-modification
    IntType r_num = r.num;
    IntType r_den = r.den;

    // Avoid repeated construction
    IntType zero(0);

    // Trap division by zero
    if (r_num == zero)
        BOOST_THROW_EXCEPTION(bad_rational());
    if (num == zero)
        return *this;

    // Avoid overflow and preserve normalization
    IntType gcd1 = integer::gcd(num, r_num);
    IntType gcd2 = integer::gcd(r_den, den);
    num = (num/gcd1) * (r_den/gcd2);
    den = (den/gcd2) * (r_num/gcd1);

    if (den < zero) {
        num = -num;
        den = -den;
    }
    return *this;
}

// Mixed-mode operators
template <typename IntType>
inline rational<IntType>&
rational<IntType>::operator*= (param_type i)
{
    // Avoid overflow and preserve normalization
    IntType gcd = integer::gcd(i, den);
    num *= i / gcd;
    den /= gcd;

    return *this;
}

template <typename IntType>
rational<IntType>&
rational<IntType>::operator/= (param_type i)
{
    // Avoid repeated construction
    IntType const zero(0);

    if(i == zero) BOOST_THROW_EXCEPTION(bad_rational());
    if (num == zero) return *this;

    // Avoid overflow and preserve normalization
    IntType const gcd = integer::gcd(num, i);
    num /= gcd;
    den *= i / gcd;

    if (den < zero) {
        num = -num;
        den = -den;
    }

    return *this;
}

// Comparison operators
template <typename IntType>
bool rational<IntType>::operator< (const rational<IntType>& r) const
{
    // Avoid repeated construction
    int_type const  zero( 0 );

    // This should really be a class-wide invariant.  The reason for these
    // checks is that for 2's complement systems, INT_MIN has no corresponding
    // positive, so negating it during normalization keeps it INT_MIN, which
    // is bad for later calculations that assume a positive denominator.
    BOOST_ASSERT( this->den > zero );
    BOOST_ASSERT( r.den > zero );

    // Determine relative order by expanding each value to its simple continued
    // fraction representation using the Euclidian GCD algorithm.
    struct { int_type  n, d, q, r; }
     ts = { this->num, this->den, static_cast<int_type>(this->num / this->den),
     static_cast<int_type>(this->num % this->den) },
     rs = { r.num, r.den, static_cast<int_type>(r.num / r.den),
     static_cast<int_type>(r.num % r.den) };
    unsigned  reverse = 0u;

    // Normalize negative moduli by repeatedly adding the (positive) denominator
    // and decrementing the quotient.  Later cycles should have all positive
    // values, so this only has to be done for the first cycle.  (The rules of
    // C++ require a nonnegative quotient & remainder for a nonnegative dividend
    // & positive divisor.)
    while ( ts.r < zero )  { ts.r += ts.d; --ts.q; }
    while ( rs.r < zero )  { rs.r += rs.d; --rs.q; }

    // Loop through and compare each variable's continued-fraction components
    for ( ;; )
    {
        // The quotients of the current cycle are the continued-fraction
        // components.  Comparing two c.f. is comparing their sequences,
        // stopping at the first difference.
        if ( ts.q != rs.q )
        {
            // Since reciprocation changes the relative order of two variables,
            // and c.f. use reciprocals, the less/greater-than test reverses
            // after each index.  (Start w/ non-reversed @ whole-number place.)
            return reverse ? ts.q > rs.q : ts.q < rs.q;
        }

        // Prepare the next cycle
        reverse ^= 1u;

        if ( (ts.r == zero) || (rs.r == zero) )
        {
            // At least one variable's c.f. expansion has ended
            break;
        }

        ts.n = ts.d;         ts.d = ts.r;
        ts.q = ts.n / ts.d;  ts.r = ts.n % ts.d;
        rs.n = rs.d;         rs.d = rs.r;
        rs.q = rs.n / rs.d;  rs.r = rs.n % rs.d;
    }

    // Compare infinity-valued components for otherwise equal sequences
    if ( ts.r == rs.r )
    {
        // Both remainders are zero, so the next (and subsequent) c.f.
        // components for both sequences are infinity.  Therefore, the sequences
        // and their corresponding values are equal.
        return false;
    }
    else
    {
#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4800)
#endif
        // Exactly one of the remainders is zero, so all following c.f.
        // components of that variable are infinity, while the other variable
        // has a finite next c.f. component.  So that other variable has the
        // lesser value (modulo the reversal flag!).
        return ( ts.r != zero ) != static_cast<bool>( reverse );
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif
    }
}

template <typename IntType>
bool rational<IntType>::operator< (param_type i) const
{
    // Avoid repeated construction
    int_type const  zero( 0 );

    // Break value into mixed-fraction form, w/ always-nonnegative remainder
    BOOST_ASSERT( this->den > zero );
    int_type  q = this->num / this->den, r = this->num % this->den;
    while ( r < zero )  { r += this->den; --q; }

    // Compare with just the quotient, since the remainder always bumps the
    // value up.  [Since q = floor(n/d), and if n/d < i then q < i, if n/d == i
    // then q == i, if n/d == i + r/d then q == i, and if n/d >= i + 1 then
    // q >= i + 1 > i; therefore n/d < i iff q < i.]
    return q < i;
}

template <typename IntType>
bool rational<IntType>::operator> (param_type i) const
{
    return operator==(i)? false: !operator<(i);
}

template <typename IntType>
BOOST_CONSTEXPR
inline bool rational<IntType>::operator== (const rational<IntType>& r) const
{
    return ((num == r.num) && (den == r.den));
}

template <typename IntType>
BOOST_CONSTEXPR
inline bool rational<IntType>::operator== (param_type i) const
{
    return ((den == IntType(1)) && (num == i));
}

// Invariant check
template <typename IntType>
inline bool rational<IntType>::test_invariant() const
{
    return ( this->den > int_type(0) ) && ( integer::gcd(this->num, this->den) ==
     int_type(1) );
}

// Normalisation
template <typename IntType>
void rational<IntType>::normalize()
{
    // Avoid repeated construction
    IntType zero(0);

    if (den == zero)
       BOOST_THROW_EXCEPTION(bad_rational());

    // Handle the case of zero separately, to avoid division by zero
    if (num == zero) {
        den = IntType(1);
        return;
    }

    IntType g = integer::gcd(num, den);

    num /= g;
    den /= g;

    // Ensure that the denominator is positive
    if (den < zero) {
        num = -num;
        den = -den;
    }

    // ...But acknowledge that the previous step doesn't always work.
    // (Nominally, this should be done before the mutating steps, but this
    // member function is only called during the constructor, so we never have
    // to worry about zombie objects.)
    if (den < zero)
       BOOST_THROW_EXCEPTION(bad_rational("bad rational: non-zero singular denominator"));

    BOOST_ASSERT( this->test_invariant() );
}

#ifndef BOOST_NO_IOSTREAM
namespace detail {

    // A utility class to reset the format flags for an istream at end
    // of scope, even in case of exceptions
    struct resetter {
        resetter(std::istream& is) : is_(is), f_(is.flags()) {}
        ~resetter() { is_.flags(f_); }
        std::istream& is_;
        std::istream::fmtflags f_;      // old GNU c++ lib has no ios_base
    };

}

// Input and output
template <typename IntType>
std::istream& operator>> (std::istream& is, rational<IntType>& r)
{
    using std::ios;

    IntType n = IntType(0), d = IntType(1);
    char c = 0;
    detail::resetter sentry(is);

    if ( is >> n )
    {
        if ( is.get(c) )
        {
            if ( c == '/' )
            {
                if ( is >> std::noskipws >> d )
                    try {
                        r.assign( n, d );
                    } catch ( bad_rational & ) {        // normalization fail
                        try { is.setstate(ios::failbit); }
                        catch ( ... ) {}  // don't throw ios_base::failure...
                        if ( is.exceptions() & ios::failbit )
                            throw;   // ...but the original exception instead
                        // ELSE: suppress the exception, use just error flags
                    }
            }
            else
                is.setstate( ios::failbit );
        }
    }

    return is;
}

// Add manipulators for output format?
template <typename IntType>
std::ostream& operator<< (std::ostream& os, const rational<IntType>& r)
{
    // The slash directly precedes the denominator, which has no prefixes.
    std::ostringstream  ss;

    ss.copyfmt( os );
    ss.tie( NULL );
    ss.exceptions( std::ios::goodbit );
    ss.width( 0 );
    ss << std::noshowpos << std::noshowbase << '/' << r.denominator();

    // The numerator holds the showpos, internal, and showbase flags.
    std::string const   tail = ss.str();
    std::streamsize const  w =
        os.width() - static_cast<std::streamsize>( tail.size() );

    ss.clear();
    ss.str( "" );
    ss.flags( os.flags() );
    ss << std::setw( w < 0 || (os.flags() & std::ios::adjustfield) !=
                     std::ios::internal ? 0 : w ) << r.numerator();
    return os << ss.str() + tail;
}
#endif  // BOOST_NO_IOSTREAM

// Type conversion
template <typename T, typename IntType>
BOOST_CONSTEXPR
inline T rational_cast(const rational<IntType>& src)
{
    return static_cast<T>(src.numerator())/static_cast<T>(src.denominator());
}

// Do not use any abs() defined on IntType - it isn't worth it, given the
// difficulties involved (Koenig lookup required, there may not *be* an abs()
// defined, etc etc).
template <typename IntType>
inline rational<IntType> abs(const rational<IntType>& r)
{
    return r.numerator() >= IntType(0)? r: -r;
}

namespace integer {

template <typename IntType>
struct gcd_evaluator< rational<IntType> >
{
    typedef rational<IntType> result_type,
                              first_argument_type, second_argument_type;
    result_type operator() (  first_argument_type const &a
                           , second_argument_type const &b
                           ) const
    {
        return result_type(integer::gcd(a.numerator(), b.numerator()),
                           integer::lcm(a.denominator(), b.denominator()));
    }
};

template <typename IntType>
struct lcm_evaluator< rational<IntType> >
{
    typedef rational<IntType> result_type,
                              first_argument_type, second_argument_type;
    result_type operator() (  first_argument_type const &a
                           , second_argument_type const &b
                           ) const
    {
        return result_type(integer::lcm(a.numerator(), b.numerator()),
                           integer::gcd(a.denominator(), b.denominator()));
    }
};

} // namespace integer

} // namespace boost

#endif  // BOOST_RATIONAL_HPP
