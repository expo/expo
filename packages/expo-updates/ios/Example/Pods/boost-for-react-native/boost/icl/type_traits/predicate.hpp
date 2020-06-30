/*-----------------------------------------------------------------------------+
Copyright (c) 2010-2010: Joachim Faulhaber
+------------------------------------------------------------------------------+
   Distributed under the Boost Software License, Version 1.0.
      (See accompanying file LICENCE.txt or copy at
           http://www.boost.org/LICENSE_1_0.txt)
+-----------------------------------------------------------------------------*/
#ifndef BOOST_ICL_TYPE_TRAITS_PREDICATE_HPP_JOFA_101102
#define BOOST_ICL_TYPE_TRAITS_PREDICATE_HPP_JOFA_101102

#include <functional>

namespace boost{namespace icl
{
    // naming convention
    // predicate: n-ary predicate
    // property:  unary predicate
    // relation:  binary predicate

    // Unary predicates

    template <class Type>
    class property : public std::unary_function<Type,bool>{};

    template <class Type>
    class member_property : public property<Type>
    {
    public:
        member_property( bool(Type::* pred)()const ): property<Type>(), m_pred(pred){}
        bool operator()(const Type& x)const { return (x.*m_pred)(); }
    private:
        bool(Type::* m_pred)()const;
    } ;

    // Binary predicates: relations

    template <class LeftT, class RightT>
    class relation : public std::binary_function<LeftT,RightT,bool>{};


}} // namespace icl boost

#endif

