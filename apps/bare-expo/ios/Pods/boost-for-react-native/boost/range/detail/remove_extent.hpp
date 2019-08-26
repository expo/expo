// Boost.Range library
//
//  Copyright Jonathan Turkanis 2005. Use, modification and
//  distribution is subject to the Boost Software License, Version
//  1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
// For more information, see http://www.boost.org/libs/range/
//


#ifndef BOOST_RANGE_DETAIL_REMOVE_BOUNDS_HPP
#define BOOST_RANGE_DETAIL_REMOVE_BOUNDS_HPP

#include <boost/config.hpp>  // MSVC, NO_INTRINSIC_WCHAR_T, put size_t in std.
#include <cstddef>
#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/identity.hpp>
#include <boost/type_traits/is_same.hpp>

namespace boost 
{
    namespace range_detail
    {
        
        template< typename Case1 = mpl::true_,
                  typename Type1 = mpl::void_,
                  typename Case2 = mpl::true_,
                  typename Type2 = mpl::void_,
                  typename Case3 = mpl::true_,
                  typename Type3 = mpl::void_,
                  typename Case4 = mpl::true_,
                  typename Type4 = mpl::void_,
                  typename Case5 = mpl::true_,
                  typename Type5 = mpl::void_,
                  typename Case6 = mpl::true_,
                  typename Type6 = mpl::void_,
                  typename Case7 = mpl::true_,
                  typename Type7 = mpl::void_,
                  typename Case8 = mpl::true_,
                  typename Type8 = mpl::void_,
                  typename Case9 = mpl::true_,
                  typename Type9 = mpl::void_,
                  typename Case10 = mpl::true_,
                  typename Type10 = mpl::void_,
                  typename Case11 = mpl::true_,
                  typename Type11 = mpl::void_,
                  typename Case12 = mpl::true_,
                  typename Type12 = mpl::void_,
                  typename Case13 = mpl::true_,
                  typename Type13 = mpl::void_,
                  typename Case14 = mpl::true_,
                  typename Type14 = mpl::void_,
                  typename Case15 = mpl::true_,
                  typename Type15 = mpl::void_,
                  typename Case16 = mpl::true_,
                  typename Type16 = mpl::void_,
                  typename Case17 = mpl::true_,
                  typename Type17 = mpl::void_,
                  typename Case18 = mpl::true_,
                  typename Type18 = mpl::void_,
                  typename Case19 = mpl::true_,
                  typename Type19 = mpl::void_,
                  typename Case20 = mpl::true_,
                  typename Type20 = mpl::void_>
        struct select {
            typedef typename
                    mpl::eval_if<
                        Case1, mpl::identity<Type1>, mpl::eval_if<
                        Case2, mpl::identity<Type2>, mpl::eval_if<
                        Case3, mpl::identity<Type3>, mpl::eval_if<
                        Case4, mpl::identity<Type4>, mpl::eval_if<
                        Case5, mpl::identity<Type5>, mpl::eval_if<
                        Case6, mpl::identity<Type6>, mpl::eval_if<
                        Case7, mpl::identity<Type7>, mpl::eval_if<
                        Case8, mpl::identity<Type8>, mpl::eval_if<
                        Case9, mpl::identity<Type9>, mpl::if_<
                        Case10, Type10, mpl::void_ > > > > > > > > >
                    >::type result1;
            typedef typename
                    mpl::eval_if<
                        Case11, mpl::identity<Type11>, mpl::eval_if<
                        Case12, mpl::identity<Type12>, mpl::eval_if<
                        Case13, mpl::identity<Type13>, mpl::eval_if<
                        Case14, mpl::identity<Type14>, mpl::eval_if<
                        Case15, mpl::identity<Type15>, mpl::eval_if<
                        Case16, mpl::identity<Type16>, mpl::eval_if<
                        Case17, mpl::identity<Type17>, mpl::eval_if<
                        Case18, mpl::identity<Type18>, mpl::eval_if<
                        Case19, mpl::identity<Type19>, mpl::if_<
                        Case20, Type20, mpl::void_ > > > > > > > > >
                    > result2;
            typedef typename    
                    mpl::eval_if<
                        is_same<result1, mpl::void_>,
                        result2,
                        mpl::identity<result1>
                    >::type type;
        };

        template<typename T>
        struct remove_extent {
            static T* ar;
            BOOST_STATIC_CONSTANT(std::size_t, size = sizeof(*ar) / sizeof((*ar)[0]));

            typedef typename
                    select<
                        is_same<T, bool[size]>,                  bool,
                        is_same<T, char[size]>,                  char,
                        is_same<T, signed char[size]>,           signed char,
                        is_same<T, unsigned char[size]>,         unsigned char,
                    #ifndef BOOST_NO_INTRINSIC_WCHAR_T
                        is_same<T, wchar_t[size]>,               wchar_t,
                    #endif
                        is_same<T, short[size]>,                 short,
                        is_same<T, unsigned short[size]>,        unsigned short,
                        is_same<T, int[size]>,                   int,
                        is_same<T, unsigned int[size]>,          unsigned int,
                        is_same<T, long[size]>,                  long,
                        is_same<T, unsigned long[size]>,         unsigned long,
                        is_same<T, float[size]>,                 float,
                        is_same<T, double[size]>,                double,
                        is_same<T, long double[size]>,           long double
                    >::type result1;
            typedef typename
                    select<
                        is_same<T, const bool[size]>,            const bool,
                        is_same<T, const char[size]>,            const char,
                        is_same<T, const signed char[size]>,     const signed char,
                        is_same<T, const unsigned char[size]>,   const unsigned char,
                    #ifndef BOOST_NO_INTRINSIC_WCHAR_T
                        is_same<T, const wchar_t[size]>,         const wchar_t,
                    #endif
                        is_same<T, const short[size]>,           const short,
                        is_same<T, const unsigned short[size]>,  const unsigned short,
                        is_same<T, const int[size]>,             const int,
                        is_same<T, const unsigned int[size]>,    const unsigned int,
                        is_same<T, const long[size]>,            const long,
                        is_same<T, const unsigned long[size]>,   const unsigned long,
                        is_same<T, const float[size]>,           const float,
                        is_same<T, const double[size]>,          const double,
                        is_same<T, const long double[size]>,     const long double
                    > result2;
            typedef typename
                    mpl::eval_if<
                        is_same<result1, mpl::void_>,
                        result2,
                        mpl::identity<result1>
                    >::type type;
        };

    } // namespace 'range_detail'

} // namespace 'boost'


#endif
