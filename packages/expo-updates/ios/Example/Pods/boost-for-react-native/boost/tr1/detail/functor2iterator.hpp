//  (C) Copyright John Maddock 2005.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_FUNCTOR_IT_HPP_INCLUDED
#  define BOOST_TR1_FUNCTOR_IT_HPP_INCLUDED

# include <boost/iterator/iterator_facade.hpp>

namespace boost{ namespace tr1_details{

template <class Func, class R>
struct functor2iterator : boost::iterator_facade<functor2iterator<Func,R>, const R, std::input_iterator_tag>
{
   functor2iterator() : m_func(0){}
   functor2iterator(Func& f)
      : m_func(&f)
   {
      m_val = (*m_func)();
   }
   const R& dereference()const
   { return m_val; }
   void increment(){ m_val = (*m_func)(); }
   bool equal(const functor2iterator&)const
   { return false; }
private:
   Func* m_func;
   R m_val;
};

} }

#endif
