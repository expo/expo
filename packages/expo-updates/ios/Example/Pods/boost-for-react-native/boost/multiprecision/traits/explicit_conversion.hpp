///////////////////////////////////////////////////////////////////////////////
//  Copyright Vicente J. Botet Escriba 2009-2011
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MP_EXPLICIT_CONVERTIBLE_HPP
#define BOOST_MP_EXPLICIT_CONVERTIBLE_HPP

#include <boost/type_traits/is_convertible.hpp>
#include <boost/utility/declval.hpp>


namespace boost {
   namespace multiprecision {
      namespace detail {

         template <int N>
         struct dummy_size {};

         template<typename S, typename T>
         struct has_generic_interconversion
         {
            typedef typename mpl::if_c <
               is_number<S>::value && is_number<T>::value,
               typename mpl::if_c <
               number_category<S>::value == number_kind_integer,
               typename mpl::if_c<
               number_category<T>::value == number_kind_integer
               || number_category<T>::value == number_kind_floating_point
               || number_category<T>::value == number_kind_rational
               || number_category<T>::value == number_kind_fixed_point,
               mpl::true_,
               mpl::false_
               >::type,
               typename mpl::if_c<
               number_category<S>::value == number_kind_rational,
               typename mpl::if_c<
               number_category<T>::value == number_kind_rational
               || number_category<T>::value == number_kind_rational,
               mpl::true_,
               mpl::false_
               >::type,
               typename mpl::if_c<
               number_category<T>::value == number_kind_floating_point,
               mpl::true_,
               mpl::false_
               >::type
               >::type
               > ::type,
               mpl::false_
            > ::type type;
         };

         template<typename S, typename T>
         struct is_explicitly_convertible_imp
         {
#ifndef BOOST_NO_SFINAE_EXPR
            template<typename S1, typename T1>
            static type_traits::yes_type selector(dummy_size<sizeof(static_cast<T1>(declval<S1>()))>*);

            template<typename S1, typename T1>
            static type_traits::no_type selector(...);

            static const bool value = sizeof(selector<S, T>(0)) == sizeof(type_traits::yes_type);

            typedef boost::integral_constant<bool, value> type;
#else
            typedef typename has_generic_interconversion<S, T>::type gen_type;
            typedef mpl::bool_<boost::is_convertible<S, T>::value || gen_type::value> type;
#endif
         };

template<typename From, typename To>
struct is_explicitly_convertible : public is_explicitly_convertible_imp<From, To>::type
{
};

#ifdef BOOST_NO_SFINAE_EXPR
template<class Backend1, expression_template_option ExpressionTemplates1, class Backend2, expression_template_option ExpressionTemplates2>
struct is_explicitly_convertible<number<Backend1, ExpressionTemplates1>, number<Backend2, ExpressionTemplates2> >
   : public is_explicitly_convertible<Backend1, Backend2>
{
};
#endif

}}} // namespaces

#endif

