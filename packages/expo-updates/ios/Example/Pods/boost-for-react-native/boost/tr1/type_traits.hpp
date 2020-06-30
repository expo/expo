//  (C) Copyright John Maddock 2005.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_TYPE_TRAITS_HPP_INCLUDED
#  define BOOST_TR1_TYPE_TRAITS_HPP_INCLUDED
#  include <boost/tr1/detail/config.hpp>

#ifdef BOOST_HAS_TR1_TYPE_TRAITS

#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next BOOST_TR1_HEADER(type_traits)
#  else
#     include <boost/tr1/detail/config_all.hpp>
#     include BOOST_TR1_STD_HEADER(BOOST_TR1_PATH(type_traits))
#  endif

#else
// Boost Type Traits:
#include <boost/type_traits.hpp>
#include <boost/type_traits/is_base_of_tr1.hpp>

namespace std { namespace tr1{

   using ::boost::integral_constant;
   using ::boost::true_type;
   using ::boost::false_type;
   using ::boost::is_void;
   using ::boost::is_integral;
   using ::boost::is_floating_point;
   using ::boost::is_array;
   using ::boost::is_pointer;
   using ::boost::is_reference;
   using ::boost::is_member_object_pointer;
   using ::boost::is_member_function_pointer;
   using ::boost::is_enum;
   using ::boost::is_union;
   using ::boost::is_class;
   using ::boost::is_function;
   using ::boost::is_arithmetic;
   using ::boost::is_fundamental;
   using ::boost::is_object;
   using ::boost::is_scalar;
   using ::boost::is_compound;
   using ::boost::is_member_pointer;
   using ::boost::is_const;
   using ::boost::is_volatile;
   using ::boost::is_pod;
   using ::boost::is_empty;
   using ::boost::is_polymorphic;
   using ::boost::is_abstract;
   using ::boost::has_trivial_constructor;
   using ::boost::has_trivial_copy;
   using ::boost::has_trivial_assign;
   using ::boost::has_trivial_destructor;
   using ::boost::has_nothrow_constructor;
   using ::boost::has_nothrow_copy;
   using ::boost::has_nothrow_assign;
   using ::boost::has_virtual_destructor;
   using ::boost::is_signed;
   using ::boost::is_unsigned;
   using ::boost::alignment_of;
   using ::boost::rank;
   using ::boost::extent;
   using ::boost::is_same;
   using ::boost::tr1::is_base_of;
   using ::boost::is_convertible;
   using ::boost::remove_const;
   using ::boost::remove_volatile;
   using ::boost::remove_cv;
   using ::boost::add_const;
   using ::boost::add_volatile;
   using ::boost::add_cv;
   using ::boost::remove_reference;
   using ::boost::add_reference;
   using ::boost::remove_extent;
   using ::boost::remove_all_extents;
   using ::boost::remove_pointer;
   using ::boost::add_pointer;
   using ::boost::aligned_storage;

} }

#endif

#endif
