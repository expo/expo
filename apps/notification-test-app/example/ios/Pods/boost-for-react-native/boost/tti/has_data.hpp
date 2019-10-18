
//  (C) Copyright Edward Diener 2012,2013
//  Use, modification and distribution are subject to the Boost Software License,
//  Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt).

#if !defined(BOOST_TTI_HAS_DATA_HPP)
#define BOOST_TTI_HAS_DATA_HPP

#include <boost/config.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/type_traits/remove_const.hpp>
#include <boost/tti/gen/has_data_gen.hpp>
#include <boost/tti/detail/ddata.hpp>

/*

  The succeeding comments in this file are in doxygen format.

*/

/** \file
*/

/// Expands to a metafunction which tests whether member data or static member with a particular name and type exists.
/**

    trait = the name of the metafunction.
    
    name  = the name of the inner member to introspect.

    generates a metafunction called "trait" where 'trait' is the macro parameter.
    
              template<class BOOST_TTI_TP_T,class BOOST_TTI_TP_TYPE>
              struct trait
                {
                static const value = unspecified;
                typedef mpl::bool_<true-or-false> type;
                };

              The metafunction types and return:
    
                BOOST_TTI_TP_T    = the enclosing type in which to look for our 'name'
                
                BOOST_TTI_TP_TYPE = The type of the member data or static member.
                
                returns  = 'value' is true if the 'name' exists, with the correct data type,
                           otherwise 'value' is false.
                          
*/
#define BOOST_TTI_TRAIT_HAS_DATA(trait,name) \
  BOOST_TTI_DETAIL_TRAIT_HAS_DATA(trait,name) \
  template<class BOOST_TTI_TP_T,class BOOST_TTI_TP_TYPE> \
  struct trait \
    { \
    typedef typename \
    BOOST_PP_CAT(trait,_detail_hd) \
      < \
      typename boost::remove_const<BOOST_TTI_TP_T>::type, \
      BOOST_TTI_TP_TYPE \
      >::type type; \
    BOOST_STATIC_CONSTANT(bool,value=type::value); \
    }; \
/**/

/// Expands to a metafunction which tests whether member data or static member data with a particular name and type exists.
/**

    name  = the name of the inner member.

    generates a metafunction called "has_data_name" where 'name' is the macro parameter.
    
              template<class BOOST_TTI_TP_T,class BOOST_TTI_TP_TYPE>
              struct has_data_name
                {
                static const value = unspecified;
                typedef mpl::bool_<true-or-false> type;
                };

              The metafunction types and return:
    
                BOOST_TTI_TP_T    = the enclosing type in which to look for our 'name'
                
                BOOST_TTI_TP_TYPE = The type of the member data or static member.
                
                returns  = 'value' is true if the 'name' exists, with the correct data type,
                           otherwise 'value' is false.
                          
*/
#define BOOST_TTI_HAS_DATA(name) \
  BOOST_TTI_TRAIT_HAS_DATA \
  ( \
  BOOST_TTI_HAS_DATA_GEN(name), \
  name \
  ) \
/**/

#endif // BOOST_TTI_HAS_DATA_HPP
