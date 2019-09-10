/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_DYNAMIC_AT_C_HPP
#define GIL_DYNAMIC_AT_C_HPP

#include "../../gil_config.hpp"
#include <cassert>
#include <stdexcept>
#include <boost/mpl/at.hpp>
#include <boost/mpl/size.hpp>


////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Constructs for static-to-dynamic integer convesion
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on May 4, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

namespace boost { namespace gil {

#define GIL_AT_C_VALUE(z, N, text)    mpl::at_c<IntTypes,S+N>::type::value,
#define GIL_DYNAMIC_AT_C_LIMIT        226    // size of the maximum vector to handle

#define GIL_AT_C_LOOKUP(z, NUM, text)                                   \
    template<std::size_t S>                                             \
    struct at_c_fn<S,NUM> {                                             \
    template <typename IntTypes, typename ValueType> inline           \
        static ValueType apply(std::size_t index) {                    \
            static ValueType table[] = {                               \
                BOOST_PP_REPEAT(NUM, GIL_AT_C_VALUE, BOOST_PP_EMPTY)    \
            };                                                          \
            return table[index];                                        \
        }                                                               \
    };

namespace detail {
    namespace at_c {
        template <std::size_t START, std::size_t NUM> struct at_c_fn;
        BOOST_PP_REPEAT(GIL_DYNAMIC_AT_C_LIMIT, GIL_AT_C_LOOKUP, BOOST_PP_EMPTY)

        template <std::size_t QUOT> struct at_c_impl;

        template <>
        struct at_c_impl<0> {
            template <typename IntTypes, typename ValueType> inline
            static ValueType apply(std::size_t index) {
                return at_c_fn<0,mpl::size<IntTypes>::value>::template apply<IntTypes,ValueType>(index);
            }
        };

        template <>
        struct at_c_impl<1> {
            template <typename IntTypes, typename ValueType> inline
            static ValueType apply(std::size_t index) {
                const std::size_t SIZE=mpl::size<IntTypes>::value;
                const std::size_t REM = SIZE % GIL_DYNAMIC_AT_C_LIMIT;
                switch (index / GIL_DYNAMIC_AT_C_LIMIT) {
                    case 0: return at_c_fn<0                   ,GIL_DYNAMIC_AT_C_LIMIT-1>::template apply<IntTypes,ValueType>(index);
                    case 1: return at_c_fn<GIL_DYNAMIC_AT_C_LIMIT  ,REM                 >::template apply<IntTypes,ValueType>(index - GIL_DYNAMIC_AT_C_LIMIT);                
                };
                throw;
            }
        };

        template <>
        struct at_c_impl<2> {
            template <typename IntTypes, typename ValueType> inline
            static ValueType apply(std::size_t index) {
                const std::size_t SIZE=mpl::size<IntTypes>::value;
                const std::size_t REM = SIZE % GIL_DYNAMIC_AT_C_LIMIT;
                switch (index / GIL_DYNAMIC_AT_C_LIMIT) {
                    case 0: return at_c_fn<0                   ,GIL_DYNAMIC_AT_C_LIMIT-1>::template apply<IntTypes,ValueType>(index);
                    case 1: return at_c_fn<GIL_DYNAMIC_AT_C_LIMIT  ,GIL_DYNAMIC_AT_C_LIMIT-1>::template apply<IntTypes,ValueType>(index - GIL_DYNAMIC_AT_C_LIMIT);
                    case 2: return at_c_fn<GIL_DYNAMIC_AT_C_LIMIT*2,REM                 >::template apply<IntTypes,ValueType>(index - GIL_DYNAMIC_AT_C_LIMIT*2);                
                };
                throw;
            }
        };

        template <>
        struct at_c_impl<3> {
            template <typename IntTypes, typename ValueType> inline
            static ValueType apply(std::size_t index) {
                const std::size_t SIZE=mpl::size<IntTypes>::value;
                const std::size_t REM = SIZE % GIL_DYNAMIC_AT_C_LIMIT;
                switch (index / GIL_DYNAMIC_AT_C_LIMIT) {
                    case 0: return at_c_fn<0                   ,GIL_DYNAMIC_AT_C_LIMIT-1>::template apply<IntTypes,ValueType>(index);
                    case 1: return at_c_fn<GIL_DYNAMIC_AT_C_LIMIT  ,GIL_DYNAMIC_AT_C_LIMIT-1>::template apply<IntTypes,ValueType>(index - GIL_DYNAMIC_AT_C_LIMIT);
                    case 2: return at_c_fn<GIL_DYNAMIC_AT_C_LIMIT*2,GIL_DYNAMIC_AT_C_LIMIT-1>::template apply<IntTypes,ValueType>(index - GIL_DYNAMIC_AT_C_LIMIT*2);                
                    case 3: return at_c_fn<GIL_DYNAMIC_AT_C_LIMIT*3,REM                 >::template apply<IntTypes,ValueType>(index - GIL_DYNAMIC_AT_C_LIMIT*3);                
                };
                throw;
            }
        };
    }
}

////////////////////////////////////////////////////////////////////////////////////
///
///    \brief Given an MPL Random Access Sequence and a dynamic index n, returns the value of the n-th element
///  It constructs a lookup table at compile time
///
////////////////////////////////////////////////////////////////////////////////////

template <typename IntTypes, typename ValueType> inline 
ValueType at_c(std::size_t index) { 
    const std::size_t Size=mpl::size<IntTypes>::value;
    return detail::at_c::at_c_impl<Size/GIL_DYNAMIC_AT_C_LIMIT>::template apply<IntTypes,ValueType>(index);
}    

#undef GIL_AT_C_VALUE
#undef GIL_DYNAMIC_AT_C_LIMIT
#undef GIL_AT_C_LOOKUP

} }  // namespace boost::gil

#endif
