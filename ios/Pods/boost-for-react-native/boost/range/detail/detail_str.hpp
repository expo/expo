// Boost.Range library
//
//  Copyright Thorsten Ottosen 2003-2004. Use, modification and
//  distribution is subject to the Boost Software License, Version
//  1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
// For more information, see http://www.boost.org/libs/range/
//

#ifndef BOOST_RANGE_DETAIL_DETAIL_STR_HPP
#define BOOST_RANGE_DETAIL_DETAIL_STR_HPP

#include <boost/config.hpp> // BOOST_MSVC
#include <boost/range/iterator.hpp>

namespace boost 
{
    
    namespace range_detail
    {
        //
        // iterator
        //
        
        template<>
        struct range_iterator_<char_array_>
        { 
            template< typename T >
            struct pts
            {
                 typedef BOOST_RANGE_DEDUCED_TYPENAME 
                    remove_extent<T>::type* type;
            };
        };

        template<>
        struct range_iterator_<char_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef char* type; 
            };         
        };

        template<>
        struct range_iterator_<const_char_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef const char* type;
            };         
        };

        template<>
        struct range_iterator_<wchar_t_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef wchar_t* type; 
            };         
        };

        template<>
        struct range_iterator_<const_wchar_t_ptr_>
        {
             template< typename S >
             struct pts
             {
                 typedef const wchar_t* type; 
             };         
        };


        //
        // const iterator
        //

        template<>
        struct range_const_iterator_<char_array_>
        { 
            template< typename T >
            struct pts
            {
                typedef const BOOST_RANGE_DEDUCED_TYPENAME 
                    remove_extent<T>::type* type;
            };
        };

        template<>
        struct range_const_iterator_<char_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef const char* type; 
            };         
        };

        template<>
        struct range_const_iterator_<const_char_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef const char* type; 
            };         
        };

        template<>
        struct range_const_iterator_<wchar_t_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef const wchar_t* type; 
            };         
        };

        template<>
        struct range_const_iterator_<const_wchar_t_ptr_>
        {
             template< typename S >
             struct pts
             {
                 typedef const wchar_t* type; 
             };         
        };
    }
}

#include <boost/range/detail/begin.hpp>
#include <boost/range/detail/end.hpp>
#include <boost/range/detail/size_type.hpp>
#include <boost/range/detail/value_type.hpp>
#include <boost/range/detail/common.hpp>

namespace boost 
{
    
    namespace range_detail
    {
        //
        // str_begin()
        //
        template<>
        struct range_begin<char_ptr_>
        {
            static char* fun( char* s )
            {
                return s;
            }
        };

        template<>
        struct range_begin<const_char_ptr_>
        {
            static const char* fun( const char* s )
            {
                return s;
            }
        };
        
        template<>
        struct range_begin<wchar_t_ptr_>
        {
            
            static wchar_t* fun( wchar_t* s )
            {
                return s;
            }
        };

        template<>
        struct range_begin<const_wchar_t_ptr_>
        {
            static const wchar_t* fun( const wchar_t* s )
            {
                return s;
            }
        };
        
        template< typename C >
        inline BOOST_RANGE_DEDUCED_TYPENAME range_iterator<C>::type 
        str_begin( C& c )
        {
            return range_detail::range_begin< BOOST_RANGE_DEDUCED_TYPENAME 
                range_detail::range<C>::type >::fun( c );
        }

        //
        // str_end()
        //

        template<>
        struct range_end<char_array_>
        {
            template< typename T, std::size_t sz >
            static T* fun( T BOOST_RANGE_ARRAY_REF()[sz] )
            {
                return boost::range_detail::array_end( boost_range_array );
            }
        };
        
        template<>
        struct range_end<wchar_t_array_>
        {
            template< typename T, std::size_t sz >
            static T* fun( T BOOST_RANGE_ARRAY_REF()[sz] )
            {
                return boost::range_detail::array_end( boost_range_array );
            }
        };
        
        template<>
        struct range_end<char_ptr_>
        {
            static char* fun( char* s )
            {
                return boost::range_detail::str_end( s );
            }
        };

        template<>
        struct range_end<const_char_ptr_>
        {
            static const char* fun( const char* s )
            {
                return boost::range_detail::str_end( s );
            }
        };

        template<>
        struct range_end<wchar_t_ptr_>
        {
            static wchar_t* fun( wchar_t* s )
            {
                return boost::range_detail::str_end( s );
            }
        };


        template<>
        struct range_end<const_wchar_t_ptr_>
        {
            static const wchar_t* fun( const wchar_t* s )
            {
                return boost::range_detail::str_end( s );
            }
        };

        template< typename C >
        inline BOOST_RANGE_DEDUCED_TYPENAME range_iterator<C>::type 
        str_end( C& c )
        {
            return range_detail::range_end< BOOST_RANGE_DEDUCED_TYPENAME 
                range_detail::range<C>::type >::fun( c );
        }

        //
        // size_type
        //

        template<>
        struct range_size_type_<char_array_>
        { 
            template< typename A >
            struct pts
            {
                typedef std::size_t type;
            };
        };

        template<>
        struct range_size_type_<char_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef std::size_t type;
            };         
        };
        
        template<>
        struct range_size_type_<const_char_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef std::size_t type;
            };         
        };
        
        template<>
        struct range_size_type_<wchar_t_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef std::size_t type;
            };         
        };
        
        template<>
        struct range_size_type_<const_wchar_t_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef std::size_t type;
            };         
        };  

        //
        // value_type
        //
        
        template<>
        struct range_value_type_<char_array_>
        { 
            template< typename T >
            struct pts
            {
                typedef char type;
            };
        };

        template<>
        struct range_value_type_<char_ptr_>
        {
             template< typename S >
             struct pts
             {
                 typedef char type; 
             };         
        };
        
        template<>
        struct range_value_type_<const_char_ptr_>
        {
             template< typename S >
             struct pts
             {
                 typedef const char type;
             };         
        };
        
        template<>
        struct range_value_type_<wchar_t_ptr_>
        {
             template< typename S >
             struct pts
             {
                 typedef wchar_t type;
             };         
        };
        
        template<>
        struct range_value_type_<const_wchar_t_ptr_>
        {
            template< typename S >
            struct pts
            {
                typedef const wchar_t type;
            };         
        };

    } // namespace 'range_detail'

} // namespace 'boost'


#endif
