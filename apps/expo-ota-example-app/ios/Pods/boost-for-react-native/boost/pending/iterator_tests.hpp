// Copyright David Abrahams and Jeremy Siek 2003.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
#ifndef BOOST_ITERATOR_TESTS_HPP
# define BOOST_ITERATOR_TESTS_HPP

// This is meant to be the beginnings of a comprehensive, generic
// test suite for STL concepts such as iterators and containers.
//
// Revision History:
// 28 Apr 2002  Fixed input iterator requirements.
//              For a == b a++ == b++ is no longer required.
//              See 24.1.1/3 for details.
//              (Thomas Witt)
// 08 Feb 2001  Fixed bidirectional iterator test so that
//              --i is no longer a precondition.
//              (Jeremy Siek)
// 04 Feb 2001  Added lvalue test, corrected preconditions
//              (David Abrahams)

# include <iterator>
# include <assert.h>
# include <boost/type_traits.hpp>
# include <boost/static_assert.hpp>
# include <boost/concept_archetype.hpp> // for detail::dummy_constructor
# include <boost/implicit_cast.hpp>

namespace boost {

  // use this for the value type
struct dummyT {
  dummyT() { }
  dummyT(detail::dummy_constructor) { }
  dummyT(int x) : m_x(x) { }
  int foo() const { return m_x; }
  bool operator==(const dummyT& d) const { return m_x == d.m_x; }
  int m_x;
};

}

namespace boost {
namespace iterators {

// Tests whether type Iterator satisfies the requirements for a
// TrivialIterator.
// Preconditions: i != j, *i == val
template <class Iterator, class T>
void trivial_iterator_test(const Iterator i, const Iterator j, T val)
{
  Iterator k;
  assert(i == i);
  assert(j == j);
  assert(i != j);
#ifdef BOOST_NO_STD_ITERATOR_TRAITS
  T v = *i;
#else
  typename std::iterator_traits<Iterator>::value_type v = *i;
#endif
  assert(v == val);
#if 0
  // hmm, this will give a warning for transform_iterator...  perhaps
  // this should be separated out into a stand-alone test since there
  // are several situations where it can't be used, like for
  // integer_range::iterator.
  assert(v == i->foo());
#endif
  k = i;
  assert(k == k);
  assert(k == i);
  assert(k != j);
  assert(*k == val);
}


// Preconditions: i != j
template <class Iterator, class T>
void mutable_trivial_iterator_test(const Iterator i, const Iterator j, T val)
{
  *i = val;
  trivial_iterator_test(i, j, val);
}


// Preconditions: *i == v1, *++i == v2
template <class Iterator, class T>
void input_iterator_test(Iterator i, T v1, T v2)
{
  Iterator i1(i);

  assert(i == i1);
  assert(!(i != i1));

  // I can see no generic way to create an input iterator
  // that is in the domain of== of i and != i.
  // The following works for istream_iterator but is not
  // guaranteed to work for arbitrary input iterators.
  //
  //   Iterator i2;
  //
  //   assert(i != i2);
  //   assert(!(i == i2));

  assert(*i1 == v1);
  assert(*i  == v1);

  // we cannot test for equivalence of (void)++i & (void)i++
  // as i is only guaranteed to be single pass.
  assert(*i++ == v1);

  i1 = i;

  assert(i == i1);
  assert(!(i != i1));

  assert(*i1 == v2);
  assert(*i  == v2);

  // i is dereferencable, so it must be incrementable.
  ++i;

  // how to test for operator-> ?
}

// how to test output iterator?


template <bool is_pointer> struct lvalue_test
{
    template <class Iterator> static void check(Iterator)
    {
# ifndef BOOST_NO_STD_ITERATOR_TRAITS
        typedef typename std::iterator_traits<Iterator>::reference reference;
        typedef typename std::iterator_traits<Iterator>::value_type value_type;
# else
        typedef typename Iterator::reference reference;
        typedef typename Iterator::value_type value_type;
# endif
        BOOST_STATIC_ASSERT(boost::is_reference<reference>::value);
        BOOST_STATIC_ASSERT((boost::is_same<reference,value_type&>::value
                             || boost::is_same<reference,const value_type&>::value
            ));
    }
};

# ifdef BOOST_NO_STD_ITERATOR_TRAITS
template <> struct lvalue_test<true> {
    template <class T> static void check(T) {}
};
#endif

template <class Iterator, class T>
void forward_iterator_test(Iterator i, T v1, T v2)
{
  input_iterator_test(i, v1, v2);

  Iterator i1 = i, i2 = i;

  assert(i == i1++);
  assert(i != ++i2);

  trivial_iterator_test(i, i1, v1);
  trivial_iterator_test(i, i2, v1);

  ++i;
  assert(i == i1);
  assert(i == i2);
  ++i1;
  ++i2;

  trivial_iterator_test(i, i1, v2);
  trivial_iterator_test(i, i2, v2);

 // borland doesn't allow non-type template parameters
# if !defined(__BORLANDC__) || (__BORLANDC__ > 0x551)
  lvalue_test<(boost::is_pointer<Iterator>::value)>::check(i);
#endif
}

// Preconditions: *i == v1, *++i == v2
template <class Iterator, class T>
void bidirectional_iterator_test(Iterator i, T v1, T v2)
{
  forward_iterator_test(i, v1, v2);
  ++i;

  Iterator i1 = i, i2 = i;

  assert(i == i1--);
  assert(i != --i2);

  trivial_iterator_test(i, i1, v2);
  trivial_iterator_test(i, i2, v2);

  --i;
  assert(i == i1);
  assert(i == i2);
  ++i1;
  ++i2;

  trivial_iterator_test(i, i1, v1);
  trivial_iterator_test(i, i2, v1);
}

// mutable_bidirectional_iterator_test

template <class U> struct undefined;

// Preconditions: [i,i+N) is a valid range
template <class Iterator, class TrueVals>
void random_access_iterator_test(Iterator i, int N, TrueVals vals)
{
  bidirectional_iterator_test(i, vals[0], vals[1]);
  const Iterator j = i;
  int c;

  typedef typename boost::detail::iterator_traits<Iterator>::value_type value_type;

  for (c = 0; c < N-1; ++c) {
    assert(i == j + c);
    assert(*i == vals[c]);
    assert(*i == boost::implicit_cast<value_type>(j[c]));
    assert(*i == *(j + c));
    assert(*i == *(c + j));
    ++i;
    assert(i > j);
    assert(i >= j);
    assert(j <= i);
    assert(j < i);
  }

  Iterator k = j + N - 1;
  for (c = 0; c < N-1; ++c) {
    assert(i == k - c);
    assert(*i == vals[N - 1 - c]);
    assert(*i == boost::implicit_cast<value_type>(j[N - 1 - c]));
    Iterator q = k - c;
    assert(*i == *q);
    assert(i > j);
    assert(i >= j);
    assert(j <= i);
    assert(j < i);
    --i;
  }
}

// Precondition: i != j
template <class Iterator, class ConstIterator>
void const_nonconst_iterator_test(Iterator i, ConstIterator j)
{
  assert(i != j);
  assert(j != i);

  ConstIterator k(i);
  assert(k == i);
  assert(i == k);

  k = i;
  assert(k == i);
  assert(i == k);
}

} // namespace iterators

using iterators::undefined;
using iterators::trivial_iterator_test;
using iterators::mutable_trivial_iterator_test;
using iterators::input_iterator_test;
using iterators::lvalue_test;
using iterators::forward_iterator_test;
using iterators::bidirectional_iterator_test;
using iterators::random_access_iterator_test;
using iterators::const_nonconst_iterator_test;

} // namespace boost

#endif // BOOST_ITERATOR_TESTS_HPP
