//  Boost common_factor_rt.hpp header file  ----------------------------------//

//  (C) Copyright Daryle Walker and Paul Moore 2001-2002.  Permission to copy,
//  use, modify, sell and distribute this software is granted provided this
//  copyright notice appears in all copies.  This software is provided "as is"
//  without express or implied warranty, and with no claim as to its suitability
//  for any purpose. 

// boostinspect:nolicense (don't complain about the lack of a Boost license)
// (Paul Moore hasn't been in contact for years, so there's no way to change the
// license.)

//  See http://www.boost.org for updates, documentation, and revision history. 

#ifndef BOOST_INTEGER_COMMON_FACTOR_RT_HPP
#define BOOST_INTEGER_COMMON_FACTOR_RT_HPP

#include <boost/integer_fwd.hpp>  // self include

#include <boost/config.hpp>  // for BOOST_NESTED_TEMPLATE, etc.
#include <boost/limits.hpp>  // for std::numeric_limits
#include <climits>           // for CHAR_MIN
#include <boost/detail/workaround.hpp>

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4127 4244)  // Conditional expression is constant
#endif

namespace boost
{
namespace integer
{


//  Forward declarations for function templates  -----------------------------//

template < typename IntegerType >
    IntegerType  gcd( IntegerType const &a, IntegerType const &b );

template < typename IntegerType >
    IntegerType  lcm( IntegerType const &a, IntegerType const &b );


//  Greatest common divisor evaluator class declaration  ---------------------//

template < typename IntegerType >
class gcd_evaluator
{
public:
    // Types
    typedef IntegerType  result_type, first_argument_type, second_argument_type;

    // Function object interface
    result_type  operator ()( first_argument_type const &a,
     second_argument_type const &b ) const;

};  // boost::integer::gcd_evaluator


//  Least common multiple evaluator class declaration  -----------------------//

template < typename IntegerType >
class lcm_evaluator
{
public:
    // Types
    typedef IntegerType  result_type, first_argument_type, second_argument_type;

    // Function object interface
    result_type  operator ()( first_argument_type const &a,
     second_argument_type const &b ) const;

};  // boost::integer::lcm_evaluator


//  Implementation details  --------------------------------------------------//

namespace detail
{
    // Greatest common divisor for rings (including unsigned integers)
    template < typename RingType >
    RingType
    gcd_euclidean
    (
        RingType a,
        RingType b
    )
    {
        // Avoid repeated construction
        #ifndef __BORLANDC__
        RingType const  zero = static_cast<RingType>( 0 );
        #else
        RingType  zero = static_cast<RingType>( 0 );
        #endif

        // Reduce by GCD-remainder property [GCD(a,b) == GCD(b,a MOD b)]
        while ( true )
        {
            if ( a == zero )
                return b;
            b %= a;

            if ( b == zero )
                return a;
            a %= b;
        }
    }

    // Greatest common divisor for (signed) integers
    template < typename IntegerType >
    inline
    IntegerType
    gcd_integer
    (
        IntegerType const &  a,
        IntegerType const &  b
    )
    {
        // Avoid repeated construction
        IntegerType const  zero = static_cast<IntegerType>( 0 );
        IntegerType const  result = gcd_euclidean( a, b );

        return ( result < zero ) ? static_cast<IntegerType>(-result) : result;
    }

    // Greatest common divisor for unsigned binary integers
    template < typename BuiltInUnsigned >
    BuiltInUnsigned
    gcd_binary
    (
        BuiltInUnsigned  u,
        BuiltInUnsigned  v
    )
    {
        if ( u && v )
        {
            // Shift out common factors of 2
            unsigned  shifts = 0;

            while ( !(u & 1u) && !(v & 1u) )
            {
                ++shifts;
                u >>= 1;
                v >>= 1;
            }

            // Start with the still-even one, if any
            BuiltInUnsigned  r[] = { u, v };
            unsigned         which = static_cast<bool>( u & 1u );

            // Whittle down the values via their differences
            do
            {
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x582))
                while ( !(r[ which ] & 1u) )
                {
                    r[ which ] = (r[which] >> 1);
                }
#else
                // Remove factors of two from the even one
                while ( !(r[ which ] & 1u) )
                {
                    r[ which ] >>= 1;
                }
#endif

                // Replace the larger of the two with their difference
                if ( r[!which] > r[which] )
                {
                    which ^= 1u;
                }

                r[ which ] -= r[ !which ];
            }
            while ( r[which] );

            // Shift-in the common factor of 2 to the residues' GCD
            return r[ !which ] << shifts;
        }
        else
        {
            // At least one input is zero, return the other
            // (adding since zero is the additive identity)
            // or zero if both are zero.
            return u + v;
        }
    }

    // Least common multiple for rings (including unsigned integers)
    template < typename RingType >
    inline
    RingType
    lcm_euclidean
    (
        RingType const &  a,
        RingType const &  b
    )
    {
        RingType const  zero = static_cast<RingType>( 0 );
        RingType const  temp = gcd_euclidean( a, b );

        return ( temp != zero ) ? ( a / temp * b ) : zero;
    }

    // Least common multiple for (signed) integers
    template < typename IntegerType >
    inline
    IntegerType
    lcm_integer
    (
        IntegerType const &  a,
        IntegerType const &  b
    )
    {
        // Avoid repeated construction
        IntegerType const  zero = static_cast<IntegerType>( 0 );
        IntegerType const  result = lcm_euclidean( a, b );

        return ( result < zero ) ? static_cast<IntegerType>(-result) : result;
    }

    // Function objects to find the best way of computing GCD or LCM
#ifndef BOOST_NO_LIMITS_COMPILE_TIME_CONSTANTS
    template < typename T, bool IsSpecialized, bool IsSigned >
    struct gcd_optimal_evaluator_helper_t
    {
        T  operator ()( T const &a, T const &b )
        {
            return gcd_euclidean( a, b );
        }
    };

    template < typename T >
    struct gcd_optimal_evaluator_helper_t< T, true, true >
    {
        T  operator ()( T const &a, T const &b )
        {
            return gcd_integer( a, b );
        }
    };

    template < typename T >
    struct gcd_optimal_evaluator
    {
        T  operator ()( T const &a, T const &b )
        {
            typedef ::std::numeric_limits<T>  limits_type;

            typedef gcd_optimal_evaluator_helper_t<T,
             limits_type::is_specialized, limits_type::is_signed>  helper_type;

            helper_type  solver;

            return solver( a, b );
        }
    };
#else // BOOST_NO_LIMITS_COMPILE_TIME_CONSTANTS
    template < typename T >
    struct gcd_optimal_evaluator
    {
        T  operator ()( T const &a, T const &b )
        {
            return gcd_integer( a, b );
        }
    };
#endif

    // Specialize for the built-in integers
#define BOOST_PRIVATE_GCD_UF( Ut )                  \
    template < >  struct gcd_optimal_evaluator<Ut>  \
    {  Ut  operator ()( Ut a, Ut b ) const  { return gcd_binary( a, b ); }  }

    BOOST_PRIVATE_GCD_UF( unsigned char );
    BOOST_PRIVATE_GCD_UF( unsigned short );
    BOOST_PRIVATE_GCD_UF( unsigned );
    BOOST_PRIVATE_GCD_UF( unsigned long );

#ifdef BOOST_HAS_LONG_LONG
    BOOST_PRIVATE_GCD_UF( boost::ulong_long_type );
#elif defined(BOOST_HAS_MS_INT64)
    BOOST_PRIVATE_GCD_UF( unsigned __int64 );
#endif

#if CHAR_MIN == 0
    BOOST_PRIVATE_GCD_UF( char ); // char is unsigned
#endif

#undef BOOST_PRIVATE_GCD_UF

#define BOOST_PRIVATE_GCD_SF( St, Ut )                            \
    template < >  struct gcd_optimal_evaluator<St>                \
    {  St  operator ()( St a, St b ) const  { Ut const  a_abs =   \
    static_cast<Ut>( a < 0 ? -a : +a ), b_abs = static_cast<Ut>(  \
    b < 0 ? -b : +b ); return static_cast<St>(                    \
    gcd_optimal_evaluator<Ut>()(a_abs, b_abs) ); }  }

    BOOST_PRIVATE_GCD_SF( signed char, unsigned char );
    BOOST_PRIVATE_GCD_SF( short, unsigned short );
    BOOST_PRIVATE_GCD_SF( int, unsigned );
    BOOST_PRIVATE_GCD_SF( long, unsigned long );

#if CHAR_MIN < 0
    BOOST_PRIVATE_GCD_SF( char, unsigned char ); // char is signed
#endif

#ifdef BOOST_HAS_LONG_LONG
    BOOST_PRIVATE_GCD_SF( boost::long_long_type, boost::ulong_long_type );
#elif defined(BOOST_HAS_MS_INT64)
    BOOST_PRIVATE_GCD_SF( __int64, unsigned __int64 );
#endif

#undef BOOST_PRIVATE_GCD_SF

#ifndef BOOST_NO_LIMITS_COMPILE_TIME_CONSTANTS
    template < typename T, bool IsSpecialized, bool IsSigned >
    struct lcm_optimal_evaluator_helper_t
    {
        T  operator ()( T const &a, T const &b )
        {
            return lcm_euclidean( a, b );
        }
    };

    template < typename T >
    struct lcm_optimal_evaluator_helper_t< T, true, true >
    {
        T  operator ()( T const &a, T const &b )
        {
            return lcm_integer( a, b );
        }
    };

    template < typename T >
    struct lcm_optimal_evaluator
    {
        T  operator ()( T const &a, T const &b )
        {
            typedef ::std::numeric_limits<T>  limits_type;

            typedef lcm_optimal_evaluator_helper_t<T,
             limits_type::is_specialized, limits_type::is_signed>  helper_type;

            helper_type  solver;

            return solver( a, b );
        }
    };
#else // BOOST_NO_LIMITS_COMPILE_TIME_CONSTANTS
    template < typename T >
    struct lcm_optimal_evaluator
    {
        T  operator ()( T const &a, T const &b )
        {
            return lcm_integer( a, b );
        }
    };
#endif

    // Functions to find the GCD or LCM in the best way
    template < typename T >
    inline
    T
    gcd_optimal
    (
        T const &  a,
        T const &  b
    )
    {
        gcd_optimal_evaluator<T>  solver;

        return solver( a, b );
    }

    template < typename T >
    inline
    T
    lcm_optimal
    (
        T const &  a,
        T const &  b
    )
    {
        lcm_optimal_evaluator<T>  solver;

        return solver( a, b );
    }

}  // namespace detail


//  Greatest common divisor evaluator member function definition  ------------//

template < typename IntegerType >
inline
typename gcd_evaluator<IntegerType>::result_type
gcd_evaluator<IntegerType>::operator ()
(
    first_argument_type const &   a,
    second_argument_type const &  b
) const
{
    return detail::gcd_optimal( a, b );
}


//  Least common multiple evaluator member function definition  --------------//

template < typename IntegerType >
inline
typename lcm_evaluator<IntegerType>::result_type
lcm_evaluator<IntegerType>::operator ()
(
    first_argument_type const &   a,
    second_argument_type const &  b
) const
{
    return detail::lcm_optimal( a, b );
}


//  Greatest common divisor and least common multiple function definitions  --//

template < typename IntegerType >
inline
IntegerType
gcd
(
    IntegerType const &  a,
    IntegerType const &  b
)
{
    gcd_evaluator<IntegerType>  solver;

    return solver( a, b );
}

template < typename IntegerType >
inline
IntegerType
lcm
(
    IntegerType const &  a,
    IntegerType const &  b
)
{
    lcm_evaluator<IntegerType>  solver;

    return solver( a, b );
}


}  // namespace integer
}  // namespace boost

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

#endif  // BOOST_INTEGER_COMMON_FACTOR_RT_HPP
