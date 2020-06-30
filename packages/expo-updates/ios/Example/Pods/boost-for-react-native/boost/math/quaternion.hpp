//  boost quaternion.hpp header file

//  (C) Copyright Hubert Holin 2001.
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

// See http://www.boost.org for updates, documentation, and revision history.

#ifndef BOOST_QUATERNION_HPP
#define BOOST_QUATERNION_HPP


#include <complex>
#include <iosfwd>                                    // for the "<<" and ">>" operators
#include <sstream>                                    // for the "<<" operator

#include <boost/config.hpp> // for BOOST_NO_STD_LOCALE
#include <boost/detail/workaround.hpp>
#ifndef    BOOST_NO_STD_LOCALE
    #include <locale>                                    // for the "<<" operator
#endif /* BOOST_NO_STD_LOCALE */

#include <valarray>



#include <boost/math/special_functions/sinc.hpp>    // for the Sinus cardinal
#include <boost/math/special_functions/sinhc.hpp>    // for the Hyperbolic Sinus cardinal


namespace boost
{
    namespace math
    {

#define    BOOST_QUATERNION_ACCESSOR_GENERATOR(type)                    \
            type                    real() const                        \
            {                                                           \
                return(a);                                              \
            }                                                           \
                                                                        \
            quaternion<type>        unreal() const                      \
            {                                                           \
                return(quaternion<type>(static_cast<type>(0),b,c,d));   \
            }                                                           \
                                                                        \
            type                    R_component_1() const               \
            {                                                           \
                return(a);                                              \
            }                                                           \
                                                                        \
            type                    R_component_2() const               \
            {                                                           \
                return(b);                                              \
            }                                                           \
                                                                        \
            type                    R_component_3() const               \
            {                                                           \
                return(c);                                              \
            }                                                           \
                                                                        \
            type                    R_component_4() const               \
            {                                                           \
                return(d);                                              \
            }                                                           \
                                                                        \
            ::std::complex<type>    C_component_1() const               \
            {                                                           \
                return(::std::complex<type>(a,b));                      \
            }                                                           \
                                                                        \
            ::std::complex<type>    C_component_2() const               \
            {                                                           \
                return(::std::complex<type>(c,d));                      \
            }
        
        
#define    BOOST_QUATERNION_MEMBER_ASSIGNMENT_GENERATOR(type)                               \
            template<typename X>                                                            \
            quaternion<type> &        operator = (quaternion<X> const  & a_affecter)        \
            {                                                                               \
                a = static_cast<type>(a_affecter.R_component_1());                          \
                b = static_cast<type>(a_affecter.R_component_2());                          \
                c = static_cast<type>(a_affecter.R_component_3());                          \
                d = static_cast<type>(a_affecter.R_component_4());                          \
                                                                                            \
                return(*this);                                                              \
            }                                                                               \
                                                                                            \
            quaternion<type> &        operator = (quaternion<type> const & a_affecter)      \
            {                                                                               \
                a = a_affecter.a;                                                           \
                b = a_affecter.b;                                                           \
                c = a_affecter.c;                                                           \
                d = a_affecter.d;                                                           \
                                                                                            \
                return(*this);                                                              \
            }                                                                               \
                                                                                            \
            quaternion<type> &        operator = (type const & a_affecter)                  \
            {                                                                               \
                a = a_affecter;                                                             \
                                                                                            \
                b = c = d = static_cast<type>(0);                                           \
                                                                                            \
                return(*this);                                                              \
            }                                                                               \
                                                                                            \
            quaternion<type> &        operator = (::std::complex<type> const & a_affecter)  \
            {                                                                               \
                a = a_affecter.real();                                                      \
                b = a_affecter.imag();                                                      \
                                                                                            \
                c = d = static_cast<type>(0);                                               \
                                                                                            \
                return(*this);                                                              \
            }
        
        
#define    BOOST_QUATERNION_MEMBER_DATA_GENERATOR(type)       \
            type    a;                                        \
            type    b;                                        \
            type    c;                                        \
            type    d;
        
        
        template<typename T>
        class quaternion
        {
        public:
            
            typedef T value_type;
            
            
            // constructor for H seen as R^4
            // (also default constructor)
            
            explicit            quaternion( T const & requested_a = T(),
                                            T const & requested_b = T(),
                                            T const & requested_c = T(),
                                            T const & requested_d = T())
            :   a(requested_a),
                b(requested_b),
                c(requested_c),
                d(requested_d)
            {
                // nothing to do!
            }
            
            
            // constructor for H seen as C^2
                
            explicit            quaternion( ::std::complex<T> const & z0,
                                            ::std::complex<T> const & z1 = ::std::complex<T>())
            :   a(z0.real()),
                b(z0.imag()),
                c(z1.real()),
                d(z1.imag())
            {
                // nothing to do!
            }
            
            
            // UNtemplated copy constructor
            // (this is taken care of by the compiler itself)
            
            
            // templated copy constructor
            
            template<typename X>
            explicit            quaternion(quaternion<X> const & a_recopier)
            :   a(static_cast<T>(a_recopier.R_component_1())),
                b(static_cast<T>(a_recopier.R_component_2())),
                c(static_cast<T>(a_recopier.R_component_3())),
                d(static_cast<T>(a_recopier.R_component_4()))
            {
                // nothing to do!
            }
            
            
            // destructor
            // (this is taken care of by the compiler itself)
            
            
            // accessors
            //
            // Note:    Like complex number, quaternions do have a meaningful notion of "real part",
            //            but unlike them there is no meaningful notion of "imaginary part".
            //            Instead there is an "unreal part" which itself is a quaternion, and usually
            //            nothing simpler (as opposed to the complex number case).
            //            However, for practicallity, there are accessors for the other components
            //            (these are necessary for the templated copy constructor, for instance).
            
            BOOST_QUATERNION_ACCESSOR_GENERATOR(T)
            
            // assignment operators
            
            BOOST_QUATERNION_MEMBER_ASSIGNMENT_GENERATOR(T)
            
            // other assignment-related operators
            //
            // NOTE:    Quaternion multiplication is *NOT* commutative;
            //            symbolically, "q *= rhs;" means "q = q * rhs;"
            //            and "q /= rhs;" means "q = q * inverse_of(rhs);"
            
            quaternion<T> &        operator += (T const & rhs)
            {
                T    at = a + rhs;    // exception guard
                
                a = at;
                
                return(*this);
            }
            
            
            quaternion<T> &        operator += (::std::complex<T> const & rhs)
            {
                T    at = a + rhs.real();    // exception guard
                T    bt = b + rhs.imag();    // exception guard
                
                a = at; 
                b = bt;
                
                return(*this);
            }
            
            
            template<typename X>
            quaternion<T> &        operator += (quaternion<X> const & rhs)
            {
                T    at = a + static_cast<T>(rhs.R_component_1());    // exception guard
                T    bt = b + static_cast<T>(rhs.R_component_2());    // exception guard
                T    ct = c + static_cast<T>(rhs.R_component_3());    // exception guard
                T    dt = d + static_cast<T>(rhs.R_component_4());    // exception guard
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            
            quaternion<T> &        operator -= (T const & rhs)
            {
                T    at = a - rhs;    // exception guard
                
                a = at;
                
                return(*this);
            }
            
            
            quaternion<T> &        operator -= (::std::complex<T> const & rhs)
            {
                T    at = a - rhs.real();    // exception guard
                T    bt = b - rhs.imag();    // exception guard
                
                a = at;
                b = bt;
                
                return(*this);
            }
            
            
            template<typename X>
            quaternion<T> &        operator -= (quaternion<X> const & rhs)
            {
                T    at = a - static_cast<T>(rhs.R_component_1());    // exception guard
                T    bt = b - static_cast<T>(rhs.R_component_2());    // exception guard
                T    ct = c - static_cast<T>(rhs.R_component_3());    // exception guard
                T    dt = d - static_cast<T>(rhs.R_component_4());    // exception guard
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            quaternion<T> &        operator *= (T const & rhs)
            {
                T    at = a * rhs;    // exception guard
                T    bt = b * rhs;    // exception guard
                T    ct = c * rhs;    // exception guard
                T    dt = d * rhs;    // exception guard
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            quaternion<T> &        operator *= (::std::complex<T> const & rhs)
            {
                T    ar = rhs.real();
                T    br = rhs.imag();
                
                T    at = +a*ar-b*br;
                T    bt = +a*br+b*ar;
                T    ct = +c*ar+d*br;
                T    dt = -c*br+d*ar;
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            template<typename X>
            quaternion<T> &        operator *= (quaternion<X> const & rhs)
            {
                T    ar = static_cast<T>(rhs.R_component_1());
                T    br = static_cast<T>(rhs.R_component_2());
                T    cr = static_cast<T>(rhs.R_component_3());
                T    dr = static_cast<T>(rhs.R_component_4());
                
                T    at = +a*ar-b*br-c*cr-d*dr;
                T    bt = +a*br+b*ar+c*dr-d*cr;    //(a*br+ar*b)+(c*dr-cr*d);
                T    ct = +a*cr-b*dr+c*ar+d*br;    //(a*cr+ar*c)+(d*br-dr*b);
                T    dt = +a*dr+b*cr-c*br+d*ar;    //(a*dr+ar*d)+(b*cr-br*c);
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            
            quaternion<T> &        operator /= (T const & rhs)
            {
                T    at = a / rhs;    // exception guard
                T    bt = b / rhs;    // exception guard
                T    ct = c / rhs;    // exception guard
                T    dt = d / rhs;    // exception guard
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            quaternion<T> &        operator /= (::std::complex<T> const & rhs)
            {
                T    ar = rhs.real();
                T    br = rhs.imag();
                
                T    denominator = ar*ar+br*br;
                
                T    at = (+a*ar+b*br)/denominator;    //(a*ar+b*br)/denominator;
                T    bt = (-a*br+b*ar)/denominator;    //(ar*b-a*br)/denominator;
                T    ct = (+c*ar-d*br)/denominator;    //(ar*c-d*br)/denominator;
                T    dt = (+c*br+d*ar)/denominator;    //(ar*d+br*c)/denominator;
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
            template<typename X>
            quaternion<T> &        operator /= (quaternion<X> const & rhs)
            {
                T    ar = static_cast<T>(rhs.R_component_1());
                T    br = static_cast<T>(rhs.R_component_2());
                T    cr = static_cast<T>(rhs.R_component_3());
                T    dr = static_cast<T>(rhs.R_component_4());
                
                T    denominator = ar*ar+br*br+cr*cr+dr*dr;
                
                T    at = (+a*ar+b*br+c*cr+d*dr)/denominator;    //(a*ar+b*br+c*cr+d*dr)/denominator;
                T    bt = (-a*br+b*ar-c*dr+d*cr)/denominator;    //((ar*b-a*br)+(cr*d-c*dr))/denominator;
                T    ct = (-a*cr+b*dr+c*ar-d*br)/denominator;    //((ar*c-a*cr)+(dr*b-d*br))/denominator;
                T    dt = (-a*dr-b*cr+c*br+d*ar)/denominator;    //((ar*d-a*dr)+(br*c-b*cr))/denominator;
                
                a = at;
                b = bt;
                c = ct;
                d = dt;
                
                return(*this);
            }
            
            
        protected:
            
            BOOST_QUATERNION_MEMBER_DATA_GENERATOR(T)
            
            
        private:
            
        };
        
        
        // declaration of quaternion specialization
        
        template<>    class quaternion<float>;
        template<>    class quaternion<double>;
        template<>    class quaternion<long double>;
        
        
        // helper templates for converting copy constructors (declaration)
        
        namespace detail
        {
            
            template<   typename T,
                        typename U
                    >
            quaternion<T>    quaternion_type_converter(quaternion<U> const & rhs);
        }
        
        
        // implementation of quaternion specialization
        
        
#define    BOOST_QUATERNION_CONSTRUCTOR_GENERATOR(type)                                                 \
            explicit            quaternion( type const & requested_a = static_cast<type>(0),            \
                                            type const & requested_b = static_cast<type>(0),            \
                                            type const & requested_c = static_cast<type>(0),            \
                                            type const & requested_d = static_cast<type>(0))            \
            :   a(requested_a),                                                                         \
                b(requested_b),                                                                         \
                c(requested_c),                                                                         \
                d(requested_d)                                                                          \
            {                                                                                           \
            }                                                                                           \
                                                                                                        \
            explicit            quaternion( ::std::complex<type> const & z0,                            \
                                            ::std::complex<type> const & z1 = ::std::complex<type>())   \
            :   a(z0.real()),                                                                           \
                b(z0.imag()),                                                                           \
                c(z1.real()),                                                                           \
                d(z1.imag())                                                                            \
            {                                                                                           \
            }
        
        
#define    BOOST_QUATERNION_MEMBER_ADD_GENERATOR_1(type)             \
            quaternion<type> &        operator += (type const & rhs) \
            {                                                        \
                a += rhs;                                            \
                                                                     \
                return(*this);                                       \
            }
    
#define    BOOST_QUATERNION_MEMBER_ADD_GENERATOR_2(type)                             \
            quaternion<type> &        operator += (::std::complex<type> const & rhs) \
            {                                                                        \
                a += rhs.real();                                                     \
                b += rhs.imag();                                                     \
                                                                                     \
                return(*this);                                                       \
            }
    
#define    BOOST_QUATERNION_MEMBER_ADD_GENERATOR_3(type)                      \
            template<typename X>                                              \
            quaternion<type> &        operator += (quaternion<X> const & rhs) \
            {                                                                 \
                a += static_cast<type>(rhs.R_component_1());                  \
                b += static_cast<type>(rhs.R_component_2());                  \
                c += static_cast<type>(rhs.R_component_3());                  \
                d += static_cast<type>(rhs.R_component_4());                  \
                                                                              \
                return(*this);                                                \
            }
    
#define    BOOST_QUATERNION_MEMBER_SUB_GENERATOR_1(type)             \
            quaternion<type> &        operator -= (type const & rhs) \
            {                                                        \
                a -= rhs;                                            \
                                                                     \
                return(*this);                                       \
            }
    
#define    BOOST_QUATERNION_MEMBER_SUB_GENERATOR_2(type)                             \
            quaternion<type> &        operator -= (::std::complex<type> const & rhs) \
            {                                                                        \
                a -= rhs.real();                                                     \
                b -= rhs.imag();                                                     \
                                                                                     \
                return(*this);                                                       \
            }
    
#define    BOOST_QUATERNION_MEMBER_SUB_GENERATOR_3(type)                      \
            template<typename X>                                              \
            quaternion<type> &        operator -= (quaternion<X> const & rhs) \
            {                                                                 \
                a -= static_cast<type>(rhs.R_component_1());                  \
                b -= static_cast<type>(rhs.R_component_2());                  \
                c -= static_cast<type>(rhs.R_component_3());                  \
                d -= static_cast<type>(rhs.R_component_4());                  \
                                                                              \
                return(*this);                                                \
            }
    
#define    BOOST_QUATERNION_MEMBER_MUL_GENERATOR_1(type)             \
            quaternion<type> &        operator *= (type const & rhs) \
            {                                                        \
                a *= rhs;                                            \
                b *= rhs;                                            \
                c *= rhs;                                            \
                d *= rhs;                                            \
                                                                     \
                return(*this);                                       \
            }
    
#define    BOOST_QUATERNION_MEMBER_MUL_GENERATOR_2(type)                             \
            quaternion<type> &        operator *= (::std::complex<type> const & rhs) \
            {                                                                        \
                type    ar = rhs.real();                                             \
                type    br = rhs.imag();                                             \
                                                                                     \
                type    at = +a*ar-b*br;                                             \
                type    bt = +a*br+b*ar;                                             \
                type    ct = +c*ar+d*br;                                             \
                type    dt = -c*br+d*ar;                                             \
                                                                                     \
                a = at;                                                              \
                b = bt;                                                              \
                c = ct;                                                              \
                d = dt;                                                              \
                                                                                     \
                return(*this);                                                       \
            }
    
#define    BOOST_QUATERNION_MEMBER_MUL_GENERATOR_3(type)                      \
            template<typename X>                                              \
            quaternion<type> &        operator *= (quaternion<X> const & rhs) \
            {                                                                 \
                type    ar = static_cast<type>(rhs.R_component_1());          \
                type    br = static_cast<type>(rhs.R_component_2());          \
                type    cr = static_cast<type>(rhs.R_component_3());          \
                type    dr = static_cast<type>(rhs.R_component_4());          \
                                                                              \
                type    at = +a*ar-b*br-c*cr-d*dr;                            \
                type    bt = +a*br+b*ar+c*dr-d*cr;                            \
                type    ct = +a*cr-b*dr+c*ar+d*br;                            \
                type    dt = +a*dr+b*cr-c*br+d*ar;                            \
                                                                              \
                a = at;                                                       \
                b = bt;                                                       \
                c = ct;                                                       \
                d = dt;                                                       \
                                                                              \
                return(*this);                                                \
            }
    
// There is quite a lot of repetition in the code below. This is intentional.
// The last conditional block is the normal form, and the others merely
// consist of workarounds for various compiler deficiencies. Hopefuly, when
// more compilers are conformant and we can retire support for those that are
// not, we will be able to remove the clutter. This is makes the situation
// (painfully) explicit.
    
#define    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_1(type)             \
            quaternion<type> &        operator /= (type const & rhs) \
            {                                                        \
                a /= rhs;                                            \
                b /= rhs;                                            \
                c /= rhs;                                            \
                d /= rhs;                                            \
                                                                     \
                return(*this);                                       \
            }

#if defined(BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP)
    #define    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_2(type)                         \
            quaternion<type> &        operator /= (::std::complex<type> const & rhs) \
            {                                                                        \
                using    ::std::valarray;                                            \
                using    ::std::abs;                                                 \
                                                                                     \
                valarray<type>    tr(2);                                             \
                                                                                     \
                tr[0] = rhs.real();                                                  \
                tr[1] = rhs.imag();                                                  \
                                                                                     \
                type            mixam = static_cast<type>(1)/(abs(tr).max)();        \
                                                                                     \
                tr *= mixam;                                                         \
                                                                                     \
                valarray<type>    tt(4);                                             \
                                                                                     \
                tt[0] = +a*tr[0]+b*tr[1];                                            \
                tt[1] = -a*tr[1]+b*tr[0];                                            \
                tt[2] = +c*tr[0]-d*tr[1];                                            \
                tt[3] = +c*tr[1]+d*tr[0];                                            \
                                                                                     \
                tr *= tr;                                                            \
                                                                                     \
                tt *= (mixam/tr.sum());                                              \
                                                                                     \
                a = tt[0];                                                           \
                b = tt[1];                                                           \
                c = tt[2];                                                           \
                d = tt[3];                                                           \
                                                                                     \
                return(*this);                                                       \
            }
#else
    #define    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_2(type)                         \
            quaternion<type> &        operator /= (::std::complex<type> const & rhs) \
            {                                                                        \
                using    ::std::valarray;                                            \
                                                                                     \
                valarray<type>    tr(2);                                             \
                                                                                     \
                tr[0] = rhs.real();                                                  \
                tr[1] = rhs.imag();                                                  \
                                                                                     \
                type            mixam = static_cast<type>(1)/(abs(tr).max)();        \
                                                                                     \
                tr *= mixam;                                                         \
                                                                                     \
                valarray<type>    tt(4);                                             \
                                                                                     \
                tt[0] = +a*tr[0]+b*tr[1];                                            \
                tt[1] = -a*tr[1]+b*tr[0];                                            \
                tt[2] = +c*tr[0]-d*tr[1];                                            \
                tt[3] = +c*tr[1]+d*tr[0];                                            \
                                                                                     \
                tr *= tr;                                                            \
                                                                                     \
                tt *= (mixam/tr.sum());                                              \
                                                                                     \
                a = tt[0];                                                           \
                b = tt[1];                                                           \
                c = tt[2];                                                           \
                d = tt[3];                                                           \
                                                                                     \
                return(*this);                                                       \
            }
#endif /* BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP */
    
#if defined(BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP)
    #define    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_3(type)                  \
            template<typename X>                                              \
            quaternion<type> &        operator /= (quaternion<X> const & rhs) \
            {                                                                 \
                using    ::std::valarray;                                     \
                using    ::std::abs;                                          \
                                                                              \
                valarray<type>    tr(4);                                      \
                                                                              \
                tr[0] = static_cast<type>(rhs.R_component_1());               \
                tr[1] = static_cast<type>(rhs.R_component_2());               \
                tr[2] = static_cast<type>(rhs.R_component_3());               \
                tr[3] = static_cast<type>(rhs.R_component_4());               \
                                                                              \
                type            mixam = static_cast<type>(1)/(abs(tr).max)(); \
                                                                              \
                tr *= mixam;                                                  \
                                                                              \
                valarray<type>    tt(4);                                      \
                                                                              \
                tt[0] = +a*tr[0]+b*tr[1]+c*tr[2]+d*tr[3];                     \
                tt[1] = -a*tr[1]+b*tr[0]-c*tr[3]+d*tr[2];                     \
                tt[2] = -a*tr[2]+b*tr[3]+c*tr[0]-d*tr[1];                     \
                tt[3] = -a*tr[3]-b*tr[2]+c*tr[1]+d*tr[0];                     \
                                                                              \
                tr *= tr;                                                     \
                                                                              \
                tt *= (mixam/tr.sum());                                       \
                                                                              \
                a = tt[0];                                                    \
                b = tt[1];                                                    \
                c = tt[2];                                                    \
                d = tt[3];                                                    \
                                                                              \
                return(*this);                                                \
            }
#else
    #define    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_3(type)                  \
            template<typename X>                                              \
            quaternion<type> &        operator /= (quaternion<X> const & rhs) \
            {                                                                 \
                using    ::std::valarray;                                     \
                                                                              \
                valarray<type>    tr(4);                                      \
                                                                              \
                tr[0] = static_cast<type>(rhs.R_component_1());               \
                tr[1] = static_cast<type>(rhs.R_component_2());               \
                tr[2] = static_cast<type>(rhs.R_component_3());               \
                tr[3] = static_cast<type>(rhs.R_component_4());               \
                                                                              \
                type            mixam = static_cast<type>(1)/(abs(tr).max)(); \
                                                                              \
                tr *= mixam;                                                  \
                                                                              \
                valarray<type>    tt(4);                                      \
                                                                              \
                tt[0] = +a*tr[0]+b*tr[1]+c*tr[2]+d*tr[3];                     \
                tt[1] = -a*tr[1]+b*tr[0]-c*tr[3]+d*tr[2];                     \
                tt[2] = -a*tr[2]+b*tr[3]+c*tr[0]-d*tr[1];                     \
                tt[3] = -a*tr[3]-b*tr[2]+c*tr[1]+d*tr[0];                     \
                                                                              \
                tr *= tr;                                                     \
                                                                              \
                tt *= (mixam/tr.sum());                                       \
                                                                              \
                a = tt[0];                                                    \
                b = tt[1];                                                    \
                c = tt[2];                                                    \
                d = tt[3];                                                    \
                                                                              \
                return(*this);                                                \
            }
#endif /* BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP */
    
#define    BOOST_QUATERNION_MEMBER_ADD_GENERATOR(type)   \
        BOOST_QUATERNION_MEMBER_ADD_GENERATOR_1(type)    \
        BOOST_QUATERNION_MEMBER_ADD_GENERATOR_2(type)    \
        BOOST_QUATERNION_MEMBER_ADD_GENERATOR_3(type)
        
#define    BOOST_QUATERNION_MEMBER_SUB_GENERATOR(type)   \
        BOOST_QUATERNION_MEMBER_SUB_GENERATOR_1(type)    \
        BOOST_QUATERNION_MEMBER_SUB_GENERATOR_2(type)    \
        BOOST_QUATERNION_MEMBER_SUB_GENERATOR_3(type)
        
#define    BOOST_QUATERNION_MEMBER_MUL_GENERATOR(type)   \
        BOOST_QUATERNION_MEMBER_MUL_GENERATOR_1(type)    \
        BOOST_QUATERNION_MEMBER_MUL_GENERATOR_2(type)    \
        BOOST_QUATERNION_MEMBER_MUL_GENERATOR_3(type)
        
#define    BOOST_QUATERNION_MEMBER_DIV_GENERATOR(type)   \
        BOOST_QUATERNION_MEMBER_DIV_GENERATOR_1(type)    \
        BOOST_QUATERNION_MEMBER_DIV_GENERATOR_2(type)    \
        BOOST_QUATERNION_MEMBER_DIV_GENERATOR_3(type)
        
#define    BOOST_QUATERNION_MEMBER_ALGEBRAIC_GENERATOR(type)   \
        BOOST_QUATERNION_MEMBER_ADD_GENERATOR(type)            \
        BOOST_QUATERNION_MEMBER_SUB_GENERATOR(type)            \
        BOOST_QUATERNION_MEMBER_MUL_GENERATOR(type)            \
        BOOST_QUATERNION_MEMBER_DIV_GENERATOR(type)
        
        
        template<>
        class quaternion<float>
        {
        public:
            
            typedef float value_type;
            
            BOOST_QUATERNION_CONSTRUCTOR_GENERATOR(float)
            
            // UNtemplated copy constructor
            // (this is taken care of by the compiler itself)
            
            // explicit copy constructors (precision-loosing converters)
            
            explicit            quaternion(quaternion<double> const & a_recopier)
            {
                *this = detail::quaternion_type_converter<float, double>(a_recopier);
            }
            
            explicit            quaternion(quaternion<long double> const & a_recopier)
            {
                *this = detail::quaternion_type_converter<float, long double>(a_recopier);
            }
            
            // destructor
            // (this is taken care of by the compiler itself)
            
            // accessors
            //
            // Note:    Like complex number, quaternions do have a meaningful notion of "real part",
            //            but unlike them there is no meaningful notion of "imaginary part".
            //            Instead there is an "unreal part" which itself is a quaternion, and usually
            //            nothing simpler (as opposed to the complex number case).
            //            However, for practicallity, there are accessors for the other components
            //            (these are necessary for the templated copy constructor, for instance).
            
            BOOST_QUATERNION_ACCESSOR_GENERATOR(float)
            
            // assignment operators
            
            BOOST_QUATERNION_MEMBER_ASSIGNMENT_GENERATOR(float)
            
            // other assignment-related operators
            //
            // NOTE:    Quaternion multiplication is *NOT* commutative;
            //            symbolically, "q *= rhs;" means "q = q * rhs;"
            //            and "q /= rhs;" means "q = q * inverse_of(rhs);"
            
            BOOST_QUATERNION_MEMBER_ALGEBRAIC_GENERATOR(float)
            
            
        protected:
            
            BOOST_QUATERNION_MEMBER_DATA_GENERATOR(float)
            
            
        private:
            
        };
        
        
        template<>
        class quaternion<double>
        {
        public:
            
            typedef double value_type;
            
            BOOST_QUATERNION_CONSTRUCTOR_GENERATOR(double)
            
            // UNtemplated copy constructor
            // (this is taken care of by the compiler itself)
            
            // converting copy constructor
            
            explicit                quaternion(quaternion<float> const & a_recopier)
            {
                *this = detail::quaternion_type_converter<double, float>(a_recopier);
            }
            
            // explicit copy constructors (precision-loosing converters)
            
            explicit                quaternion(quaternion<long double> const & a_recopier)
            {
                *this = detail::quaternion_type_converter<double, long double>(a_recopier);
            }
            
            // destructor
            // (this is taken care of by the compiler itself)
            
            // accessors
            //
            // Note:    Like complex number, quaternions do have a meaningful notion of "real part",
            //            but unlike them there is no meaningful notion of "imaginary part".
            //            Instead there is an "unreal part" which itself is a quaternion, and usually
            //            nothing simpler (as opposed to the complex number case).
            //            However, for practicallity, there are accessors for the other components
            //            (these are necessary for the templated copy constructor, for instance).
            
            BOOST_QUATERNION_ACCESSOR_GENERATOR(double)
            
            // assignment operators
            
            BOOST_QUATERNION_MEMBER_ASSIGNMENT_GENERATOR(double)
            
            // other assignment-related operators
            //
            // NOTE:    Quaternion multiplication is *NOT* commutative;
            //            symbolically, "q *= rhs;" means "q = q * rhs;"
            //            and "q /= rhs;" means "q = q * inverse_of(rhs);"
            
            BOOST_QUATERNION_MEMBER_ALGEBRAIC_GENERATOR(double)
            
            
        protected:
            
            BOOST_QUATERNION_MEMBER_DATA_GENERATOR(double)
            
            
        private:
            
        };
        
        
        template<>
        class quaternion<long double>
        {
        public:
            
            typedef long double value_type;
            
            BOOST_QUATERNION_CONSTRUCTOR_GENERATOR(long double)
            
            // UNtemplated copy constructor
            // (this is taken care of by the compiler itself)
            
            // converting copy constructors
            
            explicit                    quaternion(quaternion<float> const & a_recopier)
            {
                *this = detail::quaternion_type_converter<long double, float>(a_recopier);
            }
            
            explicit                    quaternion(quaternion<double> const & a_recopier)
            {
                *this = detail::quaternion_type_converter<long double, double>(a_recopier);
            }
            
            // destructor
            // (this is taken care of by the compiler itself)
            
            // accessors
            //
            // Note:    Like complex number, quaternions do have a meaningful notion of "real part",
            //            but unlike them there is no meaningful notion of "imaginary part".
            //            Instead there is an "unreal part" which itself is a quaternion, and usually
            //            nothing simpler (as opposed to the complex number case).
            //            However, for practicallity, there are accessors for the other components
            //            (these are necessary for the templated copy constructor, for instance).
            
            BOOST_QUATERNION_ACCESSOR_GENERATOR(long double)
            
            // assignment operators
            
            BOOST_QUATERNION_MEMBER_ASSIGNMENT_GENERATOR(long double)
            
            // other assignment-related operators
            //
            // NOTE:    Quaternion multiplication is *NOT* commutative;
            //            symbolically, "q *= rhs;" means "q = q * rhs;"
            //            and "q /= rhs;" means "q = q * inverse_of(rhs);"
            
            BOOST_QUATERNION_MEMBER_ALGEBRAIC_GENERATOR(long double)
            
            
        protected:
            
            BOOST_QUATERNION_MEMBER_DATA_GENERATOR(long double)
            
            
        private:
            
        };
        
        
#undef    BOOST_QUATERNION_MEMBER_ALGEBRAIC_GENERATOR
#undef    BOOST_QUATERNION_MEMBER_ADD_GENERATOR
#undef    BOOST_QUATERNION_MEMBER_SUB_GENERATOR
#undef    BOOST_QUATERNION_MEMBER_MUL_GENERATOR
#undef    BOOST_QUATERNION_MEMBER_DIV_GENERATOR
#undef    BOOST_QUATERNION_MEMBER_ADD_GENERATOR_1
#undef    BOOST_QUATERNION_MEMBER_ADD_GENERATOR_2
#undef    BOOST_QUATERNION_MEMBER_ADD_GENERATOR_3
#undef    BOOST_QUATERNION_MEMBER_SUB_GENERATOR_1
#undef    BOOST_QUATERNION_MEMBER_SUB_GENERATOR_2
#undef    BOOST_QUATERNION_MEMBER_SUB_GENERATOR_3
#undef    BOOST_QUATERNION_MEMBER_MUL_GENERATOR_1
#undef    BOOST_QUATERNION_MEMBER_MUL_GENERATOR_2
#undef    BOOST_QUATERNION_MEMBER_MUL_GENERATOR_3
#undef    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_1
#undef    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_2
#undef    BOOST_QUATERNION_MEMBER_DIV_GENERATOR_3
        
#undef    BOOST_QUATERNION_CONSTRUCTOR_GENERATOR
        
        
#undef    BOOST_QUATERNION_MEMBER_ASSIGNMENT_GENERATOR
        
#undef    BOOST_QUATERNION_MEMBER_DATA_GENERATOR
        
#undef    BOOST_QUATERNION_ACCESSOR_GENERATOR
        
        
        // operators
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR_BODY(op)      \
        {                                                    \
            quaternion<T>    res(lhs);                       \
            res op##= rhs;                                   \
            return(res);                                     \
        }
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR_1_L(op)                                                  \
        template<typename T>                                                                            \
        inline quaternion<T>    operator op (T const & lhs, quaternion<T> const & rhs)                  \
        BOOST_QUATERNION_OPERATOR_GENERATOR_BODY(op)
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR_1_R(op)                                                  \
        template<typename T>                                                                            \
        inline quaternion<T>    operator op (quaternion<T> const & lhs, T const & rhs)                  \
        BOOST_QUATERNION_OPERATOR_GENERATOR_BODY(op)
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR_2_L(op)                                                  \
        template<typename T>                                                                            \
        inline quaternion<T>    operator op (::std::complex<T> const & lhs, quaternion<T> const & rhs)  \
        BOOST_QUATERNION_OPERATOR_GENERATOR_BODY(op)
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR_2_R(op)                                                  \
        template<typename T>                                                                            \
        inline quaternion<T>    operator op (quaternion<T> const & lhs, ::std::complex<T> const & rhs)  \
        BOOST_QUATERNION_OPERATOR_GENERATOR_BODY(op)
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR_3(op)                                                    \
        template<typename T>                                                                            \
        inline quaternion<T>    operator op (quaternion<T> const & lhs, quaternion<T> const & rhs)      \
        BOOST_QUATERNION_OPERATOR_GENERATOR_BODY(op)
        
#define    BOOST_QUATERNION_OPERATOR_GENERATOR(op)     \
        BOOST_QUATERNION_OPERATOR_GENERATOR_1_L(op)    \
        BOOST_QUATERNION_OPERATOR_GENERATOR_1_R(op)    \
        BOOST_QUATERNION_OPERATOR_GENERATOR_2_L(op)    \
        BOOST_QUATERNION_OPERATOR_GENERATOR_2_R(op)    \
        BOOST_QUATERNION_OPERATOR_GENERATOR_3(op)
        
        
        BOOST_QUATERNION_OPERATOR_GENERATOR(+)
        BOOST_QUATERNION_OPERATOR_GENERATOR(-)
        BOOST_QUATERNION_OPERATOR_GENERATOR(*)
        BOOST_QUATERNION_OPERATOR_GENERATOR(/)


#undef    BOOST_QUATERNION_OPERATOR_GENERATOR
        
#undef    BOOST_QUATERNION_OPERATOR_GENERATOR_1_L
#undef    BOOST_QUATERNION_OPERATOR_GENERATOR_1_R
#undef    BOOST_QUATERNION_OPERATOR_GENERATOR_2_L
#undef    BOOST_QUATERNION_OPERATOR_GENERATOR_2_R
#undef    BOOST_QUATERNION_OPERATOR_GENERATOR_3

#undef    BOOST_QUATERNION_OPERATOR_GENERATOR_BODY
        
        
        template<typename T>
        inline quaternion<T>                    operator + (quaternion<T> const & q)
        {
            return(q);
        }
        
        
        template<typename T>
        inline quaternion<T>                    operator - (quaternion<T> const & q)
        {
            return(quaternion<T>(-q.R_component_1(),-q.R_component_2(),-q.R_component_3(),-q.R_component_4()));
        }
        
        
        template<typename T>
        inline bool                                operator == (T const & lhs, quaternion<T> const & rhs)
        {
            return    (
                        (rhs.R_component_1() == lhs)&&
                        (rhs.R_component_2() == static_cast<T>(0))&&
                        (rhs.R_component_3() == static_cast<T>(0))&&
                        (rhs.R_component_4() == static_cast<T>(0))
                    );
        }
        
        
        template<typename T>
        inline bool                                operator == (quaternion<T> const & lhs, T const & rhs)
        {
            return    (
                        (lhs.R_component_1() == rhs)&&
                        (lhs.R_component_2() == static_cast<T>(0))&&
                        (lhs.R_component_3() == static_cast<T>(0))&&
                        (lhs.R_component_4() == static_cast<T>(0))
                    );
        }
        
        
        template<typename T>
        inline bool                                operator == (::std::complex<T> const & lhs, quaternion<T> const & rhs)
        {
            return    (
                        (rhs.R_component_1() == lhs.real())&&
                        (rhs.R_component_2() == lhs.imag())&&
                        (rhs.R_component_3() == static_cast<T>(0))&&
                        (rhs.R_component_4() == static_cast<T>(0))
                    );
        }
        
        
        template<typename T>
        inline bool                                operator == (quaternion<T> const & lhs, ::std::complex<T> const & rhs)
        {
            return    (
                        (lhs.R_component_1() == rhs.real())&&
                        (lhs.R_component_2() == rhs.imag())&&
                        (lhs.R_component_3() == static_cast<T>(0))&&
                        (lhs.R_component_4() == static_cast<T>(0))
                    );
        }
        
        
        template<typename T>
        inline bool                                operator == (quaternion<T> const & lhs, quaternion<T> const & rhs)
        {
            return    (
                        (rhs.R_component_1() == lhs.R_component_1())&&
                        (rhs.R_component_2() == lhs.R_component_2())&&
                        (rhs.R_component_3() == lhs.R_component_3())&&
                        (rhs.R_component_4() == lhs.R_component_4())
                    );
        }
        
        
#define    BOOST_QUATERNION_NOT_EQUAL_GENERATOR  \
        {                                        \
            return(!(lhs == rhs));               \
        }
        
        template<typename T>
        inline bool                                operator != (T const & lhs, quaternion<T> const & rhs)
        BOOST_QUATERNION_NOT_EQUAL_GENERATOR
        
        template<typename T>
        inline bool                                operator != (quaternion<T> const & lhs, T const & rhs)
        BOOST_QUATERNION_NOT_EQUAL_GENERATOR
        
        template<typename T>
        inline bool                                operator != (::std::complex<T> const & lhs, quaternion<T> const & rhs)
        BOOST_QUATERNION_NOT_EQUAL_GENERATOR
        
        template<typename T>
        inline bool                                operator != (quaternion<T> const & lhs, ::std::complex<T> const & rhs)
        BOOST_QUATERNION_NOT_EQUAL_GENERATOR
        
        template<typename T>
        inline bool                                operator != (quaternion<T> const & lhs, quaternion<T> const & rhs)
        BOOST_QUATERNION_NOT_EQUAL_GENERATOR
        
#undef    BOOST_QUATERNION_NOT_EQUAL_GENERATOR
        
        
        // Note:    we allow the following formats, whith a, b, c, and d reals
        //            a
        //            (a), (a,b), (a,b,c), (a,b,c,d)
        //            (a,(c)), (a,(c,d)), ((a)), ((a),c), ((a),(c)), ((a),(c,d)), ((a,b)), ((a,b),c), ((a,b),(c)), ((a,b),(c,d))
        template<typename T, typename charT, class traits>
        ::std::basic_istream<charT,traits> &    operator >> (    ::std::basic_istream<charT,traits> & is,
                                                                quaternion<T> & q)
        {
            
#ifdef    BOOST_NO_STD_LOCALE
#else
            const ::std::ctype<charT> & ct = ::std::use_facet< ::std::ctype<charT> >(is.getloc());
#endif /* BOOST_NO_STD_LOCALE */
            
            T    a = T();
            T    b = T();
            T    c = T();
            T    d = T();
            
            ::std::complex<T>    u = ::std::complex<T>();
            ::std::complex<T>    v = ::std::complex<T>();
            
            charT    ch = charT();
            char    cc;
            
            is >> ch;                                        // get the first lexeme
            
            if    (!is.good())    goto finish;
            
#ifdef    BOOST_NO_STD_LOCALE
            cc = ch;
#else
            cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
            
            if    (cc == '(')                            // read "(", possible: (a), (a,b), (a,b,c), (a,b,c,d), (a,(c)), (a,(c,d)), ((a)), ((a),c), ((a),(c)), ((a),(c,d)), ((a,b)), ((a,b),c), ((a,b),(c)), ((a,b,),(c,d,))
            {
                is >> ch;                                    // get the second lexeme
                
                if    (!is.good())    goto finish;
                
#ifdef    BOOST_NO_STD_LOCALE
                cc = ch;
#else
                cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                
                if    (cc == '(')                        // read "((", possible: ((a)), ((a),c), ((a),(c)), ((a),(c,d)), ((a,b)), ((a,b),c), ((a,b),(c)), ((a,b,),(c,d,))
                {
                    is.putback(ch);
                    
                    is >> u;                                // we extract the first and second components
                    a = u.real();
                    b = u.imag();
                    
                    if    (!is.good())    goto finish;
                    
                    is >> ch;                                // get the next lexeme
                    
                    if    (!is.good())    goto finish;
                    
#ifdef    BOOST_NO_STD_LOCALE
                    cc = ch;
#else
                    cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                    
                    if        (cc == ')')                    // format: ((a)) or ((a,b))
                    {
                        q = quaternion<T>(a,b);
                    }
                    else if    (cc == ',')                // read "((a)," or "((a,b),", possible: ((a),c), ((a),(c)), ((a),(c,d)), ((a,b),c), ((a,b),(c)), ((a,b,),(c,d,))
                    {
                        is >> v;                            // we extract the third and fourth components
                        c = v.real();
                        d = v.imag();
                        
                        if    (!is.good())    goto finish;
                        
                        is >> ch;                                // get the last lexeme
                        
                        if    (!is.good())    goto finish;
                        
#ifdef    BOOST_NO_STD_LOCALE
                        cc = ch;
#else
                        cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                        
                        if    (cc == ')')                    // format: ((a),c), ((a),(c)), ((a),(c,d)), ((a,b),c), ((a,b),(c)) or ((a,b,),(c,d,))
                        {
                            q = quaternion<T>(a,b,c,d);
                        }
                        else                            // error
                        {
                            is.setstate(::std::ios_base::failbit);
                        }
                    }
                    else                                // error
                    {
                        is.setstate(::std::ios_base::failbit);
                    }
                }
                else                                // read "(a", possible: (a), (a,b), (a,b,c), (a,b,c,d), (a,(c)), (a,(c,d))
                {
                    is.putback(ch);
                    
                    is >> a;                                // we extract the first component
                    
                    if    (!is.good())    goto finish;
                    
                    is >> ch;                                // get the third lexeme
                    
                    if    (!is.good())    goto finish;
                    
#ifdef    BOOST_NO_STD_LOCALE
                    cc = ch;
#else
                    cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                    
                    if        (cc == ')')                    // format: (a)
                    {
                        q = quaternion<T>(a);
                    }
                    else if    (cc == ',')                // read "(a,", possible: (a,b), (a,b,c), (a,b,c,d), (a,(c)), (a,(c,d))
                    {
                        is >> ch;                            // get the fourth lexeme
                        
                        if    (!is.good())    goto finish;
                        
#ifdef    BOOST_NO_STD_LOCALE
                        cc = ch;
#else
                        cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                        
                        if    (cc == '(')                // read "(a,(", possible: (a,(c)), (a,(c,d))
                        {
                            is.putback(ch);
                            
                            is >> v;                        // we extract the third and fourth component
                            
                            c = v.real();
                            d = v.imag();
                            
                            if    (!is.good())    goto finish;
                            
                            is >> ch;                        // get the ninth lexeme
                            
                            if    (!is.good())    goto finish;
                            
#ifdef    BOOST_NO_STD_LOCALE
                            cc = ch;
#else
                            cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                            
                            if    (cc == ')')                // format: (a,(c)) or (a,(c,d))
                            {
                                q = quaternion<T>(a,b,c,d);
                            }
                            else                        // error
                            {
                                is.setstate(::std::ios_base::failbit);
                            }
                        }
                        else                        // read "(a,b", possible: (a,b), (a,b,c), (a,b,c,d)
                        {
                            is.putback(ch);
                            
                            is >> b;                        // we extract the second component
                            
                            if    (!is.good())    goto finish;
                            
                            is >> ch;                        // get the fifth lexeme
                            
                            if    (!is.good())    goto finish;
                            
#ifdef    BOOST_NO_STD_LOCALE
                            cc = ch;
#else
                            cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                            
                            if    (cc == ')')                // format: (a,b)
                            {
                                q = quaternion<T>(a,b);
                            }
                            else if    (cc == ',')        // read "(a,b,", possible: (a,b,c), (a,b,c,d)
                            {
                                is >> c;                    // we extract the third component
                                
                                if    (!is.good())    goto finish;
                                
                                is >> ch;                    // get the seventh lexeme
                                
                                if    (!is.good())    goto finish;
                                
#ifdef    BOOST_NO_STD_LOCALE
                                cc = ch;
#else
                                cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                                
                                if        (cc == ')')        // format: (a,b,c)
                                {
                                    q = quaternion<T>(a,b,c);
                                }
                                else if    (cc == ',')    // read "(a,b,c,", possible: (a,b,c,d)
                                {
                                    is >> d;                // we extract the fourth component
                                    
                                    if    (!is.good())    goto finish;
                                    
                                    is >> ch;                // get the ninth lexeme
                                    
                                    if    (!is.good())    goto finish;
                                    
#ifdef    BOOST_NO_STD_LOCALE
                                    cc = ch;
#else
                                    cc = ct.narrow(ch, char());
#endif /* BOOST_NO_STD_LOCALE */
                                    
                                    if    (cc == ')')        // format: (a,b,c,d)
                                    {
                                        q = quaternion<T>(a,b,c,d);
                                    }
                                    else                // error
                                    {
                                        is.setstate(::std::ios_base::failbit);
                                    }
                                }
                                else                    // error
                                {
                                    is.setstate(::std::ios_base::failbit);
                                }
                            }
                            else                        // error
                            {
                                is.setstate(::std::ios_base::failbit);
                            }
                        }
                    }
                    else                                // error
                    {
                        is.setstate(::std::ios_base::failbit);
                    }
                }
            }
            else                                        // format:    a
            {
                is.putback(ch);
                
                is >> a;                                    // we extract the first component
                
                if    (!is.good())    goto finish;
                
                q = quaternion<T>(a);
            }
            
            finish:
            return(is);
        }
        
        
        template<typename T, typename charT, class traits>
        ::std::basic_ostream<charT,traits> &    operator << (    ::std::basic_ostream<charT,traits> & os,
                                                                quaternion<T> const & q)
        {
            ::std::basic_ostringstream<charT,traits>    s;

            s.flags(os.flags());
#ifdef    BOOST_NO_STD_LOCALE
#else
            s.imbue(os.getloc());
#endif /* BOOST_NO_STD_LOCALE */
            s.precision(os.precision());
            
            s << '('    << q.R_component_1() << ','
                        << q.R_component_2() << ','
                        << q.R_component_3() << ','
                        << q.R_component_4() << ')';
            
            return os << s.str();
        }
        
        
        // values
        
        template<typename T>
        inline T                                real(quaternion<T> const & q)
        {
            return(q.real());
        }
        
        
        template<typename T>
        inline quaternion<T>                    unreal(quaternion<T> const & q)
        {
            return(q.unreal());
        }
        
        
#define    BOOST_QUATERNION_VALARRAY_LOADER  \
            using    ::std::valarray;        \
                                             \
            valarray<T>    temp(4);          \
                                             \
            temp[0] = q.R_component_1();     \
            temp[1] = q.R_component_2();     \
            temp[2] = q.R_component_3();     \
            temp[3] = q.R_component_4();
        
        
        template<typename T>
        inline T                                sup(quaternion<T> const & q)
        {
#ifdef    BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP
            using    ::std::abs;
#endif    /* BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP */
            
            BOOST_QUATERNION_VALARRAY_LOADER
            
            return((abs(temp).max)());
        }
        
        
        template<typename T>
        inline T                                l1(quaternion<T> const & q)
        {
#ifdef    BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP
            using    ::std::abs;
#endif    /* BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP */
            
            BOOST_QUATERNION_VALARRAY_LOADER
            
            return(abs(temp).sum());
        }
        
        
        template<typename T>
        inline T                                abs(quaternion<T> const & q)
        {
#ifdef    BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP
            using    ::std::abs;
#endif    /* BOOST_NO_ARGUMENT_DEPENDENT_LOOKUP */
            
            using    ::std::sqrt;
            
            BOOST_QUATERNION_VALARRAY_LOADER
            
            T            maxim = (abs(temp).max)();    // overflow protection
            
            if    (maxim == static_cast<T>(0))
            {
                return(maxim);
            }
            else
            {
                T    mixam = static_cast<T>(1)/maxim;    // prefer multiplications over divisions
                
                temp *= mixam;
                
                temp *= temp;
                
                return(maxim*sqrt(temp.sum()));
            }
            
            //return(sqrt(norm(q)));
        }
        
        
#undef    BOOST_QUATERNION_VALARRAY_LOADER
        
        
        // Note:    This is the Cayley norm, not the Euclidian norm...
        
        template<typename T>
        inline T                                norm(quaternion<T>const  & q)
        {
            return(real(q*conj(q)));
        }
        
        
        template<typename T>
        inline quaternion<T>                    conj(quaternion<T> const & q)
        {
            return(quaternion<T>(   +q.R_component_1(),
                                    -q.R_component_2(),
                                    -q.R_component_3(),
                                    -q.R_component_4()));
        }
        
        
        template<typename T>
        inline quaternion<T>                    spherical(  T const & rho,
                                                            T const & theta,
                                                            T const & phi1,
                                                            T const & phi2)
        {
            using ::std::cos;
            using ::std::sin;
            
            //T    a = cos(theta)*cos(phi1)*cos(phi2);
            //T    b = sin(theta)*cos(phi1)*cos(phi2);
            //T    c = sin(phi1)*cos(phi2);
            //T    d = sin(phi2);
            
            T    courrant = static_cast<T>(1);
            
            T    d = sin(phi2);
            
            courrant *= cos(phi2);
            
            T    c = sin(phi1)*courrant;
            
            courrant *= cos(phi1);
            
            T    b = sin(theta)*courrant;
            T    a = cos(theta)*courrant;
            
            return(rho*quaternion<T>(a,b,c,d));
        }
        
        
        template<typename T>
        inline quaternion<T>                    semipolar(  T const & rho,
                                                            T const & alpha,
                                                            T const & theta1,
                                                            T const & theta2)
        {
            using ::std::cos;
            using ::std::sin;
            
            T    a = cos(alpha)*cos(theta1);
            T    b = cos(alpha)*sin(theta1);
            T    c = sin(alpha)*cos(theta2);
            T    d = sin(alpha)*sin(theta2);
            
            return(rho*quaternion<T>(a,b,c,d));
        }
        
        
        template<typename T>
        inline quaternion<T>                    multipolar( T const & rho1,
                                                            T const & theta1,
                                                            T const & rho2,
                                                            T const & theta2)
        {
            using ::std::cos;
            using ::std::sin;
            
            T    a = rho1*cos(theta1);
            T    b = rho1*sin(theta1);
            T    c = rho2*cos(theta2);
            T    d = rho2*sin(theta2);
            
            return(quaternion<T>(a,b,c,d));
        }
        
        
        template<typename T>
        inline quaternion<T>                    cylindrospherical(  T const & t,
                                                                    T const & radius,
                                                                    T const & longitude,
                                                                    T const & latitude)
        {
            using ::std::cos;
            using ::std::sin;
            
            
            
            T    b = radius*cos(longitude)*cos(latitude);
            T    c = radius*sin(longitude)*cos(latitude);
            T    d = radius*sin(latitude);
            
            return(quaternion<T>(t,b,c,d));
        }
        
        
        template<typename T>
        inline quaternion<T>                    cylindrical(T const & r,
                                                            T const & angle,
                                                            T const & h1,
                                                            T const & h2)
        {
            using ::std::cos;
            using ::std::sin;
            
            T    a = r*cos(angle);
            T    b = r*sin(angle);
            
            return(quaternion<T>(a,b,h1,h2));
        }
        
        
        // transcendentals
        // (please see the documentation)
        
        
        template<typename T>
        inline quaternion<T>                    exp(quaternion<T> const & q)
        {
            using    ::std::exp;
            using    ::std::cos;
            
            using    ::boost::math::sinc_pi;
            
            T    u = exp(real(q));
            
            T    z = abs(unreal(q));
            
            T    w = sinc_pi(z);
            
            return(u*quaternion<T>(cos(z),
                w*q.R_component_2(), w*q.R_component_3(),
                w*q.R_component_4()));
        }
        
        
        template<typename T>
        inline quaternion<T>                    cos(quaternion<T> const & q)
        {
            using    ::std::sin;
            using    ::std::cos;
            using    ::std::cosh;
            
            using    ::boost::math::sinhc_pi;
            
            T    z = abs(unreal(q));
            
            T    w = -sin(q.real())*sinhc_pi(z);
            
            return(quaternion<T>(cos(q.real())*cosh(z),
                w*q.R_component_2(), w*q.R_component_3(),
                w*q.R_component_4()));
        }
        
        
        template<typename T>
        inline quaternion<T>                    sin(quaternion<T> const & q)
        {
            using    ::std::sin;
            using    ::std::cos;
            using    ::std::cosh;
            
            using    ::boost::math::sinhc_pi;
            
            T    z = abs(unreal(q));
            
            T    w = +cos(q.real())*sinhc_pi(z);
            
            return(quaternion<T>(sin(q.real())*cosh(z),
                w*q.R_component_2(), w*q.R_component_3(),
                w*q.R_component_4()));
        }
        
        
        template<typename T>
        inline quaternion<T>                    tan(quaternion<T> const & q)
        {
            return(sin(q)/cos(q));
        }
        
        
        template<typename T>
        inline quaternion<T>                    cosh(quaternion<T> const & q)
        {
            return((exp(+q)+exp(-q))/static_cast<T>(2));
        }
        
        
        template<typename T>
        inline quaternion<T>                    sinh(quaternion<T> const & q)
        {
            return((exp(+q)-exp(-q))/static_cast<T>(2));
        }
        
        
        template<typename T>
        inline quaternion<T>                    tanh(quaternion<T> const & q)
        {
            return(sinh(q)/cosh(q));
        }
        
        
        template<typename T>
        quaternion<T>                            pow(quaternion<T> const & q,
                                                    int n)
        {
            if        (n > 1)
            {
                int    m = n>>1;
                
                quaternion<T>    result = pow(q, m);
                
                result *= result;
                
                if    (n != (m<<1))
                {
                    result *= q; // n odd
                }
                
                return(result);
            }
            else if    (n == 1)
            {
                return(q);
            }
            else if    (n == 0)
            {
                return(quaternion<T>(static_cast<T>(1)));
            }
            else    /* n < 0 */
            {
                return(pow(quaternion<T>(static_cast<T>(1))/q,-n));
            }
        }
        
        
        // helper templates for converting copy constructors (definition)
        
        namespace detail
        {
            
            template<   typename T,
                        typename U
                    >
            quaternion<T>    quaternion_type_converter(quaternion<U> const & rhs)
            {
                return(quaternion<T>(   static_cast<T>(rhs.R_component_1()),
                                        static_cast<T>(rhs.R_component_2()),
                                        static_cast<T>(rhs.R_component_3()),
                                        static_cast<T>(rhs.R_component_4())));
            }
        }
    }
}

#endif /* BOOST_QUATERNION_HPP */
