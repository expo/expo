#ifndef BOOST_SERIALIZATION_ARRAY_HPP
#define BOOST_SERIALIZATION_ARRAY_HPP

// (C) Copyright 2005 Matthias Troyer and Dave Abrahams
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

//#include <iostream>

#include <boost/config.hpp> // msvc 6.0 needs this for warning suppression

#if defined(BOOST_NO_STDC_NAMESPACE)
namespace std{ 
    using ::size_t; 
} // namespace std
#endif

#include <boost/serialization/nvp.hpp>
#include <boost/serialization/split_member.hpp>
#include <boost/serialization/wrapper.hpp>
#include <boost/serialization/collection_size_type.hpp>
#include <boost/mpl/always.hpp>
#include <boost/mpl/apply.hpp>
#include <boost/mpl/bool_fwd.hpp>
#include <boost/type_traits/remove_const.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/static_assert.hpp>

namespace boost { namespace serialization {

// traits to specify whether to use  an optimized array serialization

template <class Archive>
struct use_array_optimization : boost::mpl::always<boost::mpl::false_> {};

template<class T>
class array_wrapper :
    public wrapper_traits<const array_wrapper< T > >
{
private:
    array_wrapper & operator=(const array_wrapper & rhs);
public:
    // note: I would like to make the copy constructor private but this breaks
    // make_array.  So I try to make make_array a friend - but that doesn't
    // build.  Need a C++ guru to explain this!
    template<class S>
    friend const boost::serialization::array_wrapper<T> make_array( T* t, S s);

    array_wrapper(const array_wrapper & rhs) :
        m_t(rhs.m_t),
        m_element_count(rhs.m_element_count)
    {}
public:
    array_wrapper(T * t, std::size_t s) :
        m_t(t),
        m_element_count(s)
    {}

    // default implementation
    template<class Archive>
    void serialize_optimized(Archive &ar, const unsigned int, mpl::false_ ) const
    {
      // default implemention does the loop
      std::size_t c = count();
      T * t = address();
      while(0 < c--)
            ar & boost::serialization::make_nvp("item", *t++);
    }

    // optimized implementation
    template<class Archive>
    void serialize_optimized(Archive &ar, const unsigned int version, mpl::true_ )
    {
      boost::serialization::split_member(ar, *this, version);
    }

    // default implementation
    template<class Archive>
    void save(Archive &ar, const unsigned int version) const
    {
      ar.save_array(*this,version);
    }

    // default implementation
    template<class Archive>
    void load(Archive &ar, const unsigned int version)
    {
      ar.load_array(*this,version);
    }
    
    // default implementation
    template<class Archive>
    void serialize(Archive &ar, const unsigned int version)
    {
      typedef typename 
          boost::serialization::use_array_optimization<Archive>::template apply<
                    typename remove_const< T >::type 
                >::type use_optimized;
      serialize_optimized(ar,version,use_optimized());
    }
    
    T * address() const
    {
      return m_t;
    }

    std::size_t count() const
    {
      return m_element_count;
    }

private:
    T * const m_t;
    const std::size_t m_element_count;
};

template<class T, class S>
inline
const array_wrapper< T > make_array( T* t, S s){
    const array_wrapper< T > a(t, s);
    return a;
}

} } // end namespace boost::serialization

// I can't figure out why BOOST_NO_CXX11_HDR_ARRAY
// has been set for clang-11.  So just make sure
// it's reset now.  Needs further research!!!

#if defined(_LIBCPP_VERSION)
#undef BOOST_NO_CXX11_HDR_ARRAY
#endif

#ifndef BOOST_NO_CXX11_HDR_ARRAY
#include <array>
namespace boost { namespace serialization {
// implement serialization for std::array
template <class Archive, class T, std::size_t N>
void serialize(Archive& ar, std::array<T,N>& a, const unsigned int /* version */)
{
    ar & boost::serialization::make_nvp(
        "elems",
        *static_cast<T (*)[N]>(static_cast<void *>(a.data()))
    );
    
}
} } // end namespace boost::serialization
#endif

#include <boost/array.hpp>

namespace boost { namespace serialization {
// implement serialization for boost::array
template <class Archive, class T, std::size_t N>
void serialize(Archive& ar, boost::array<T,N>& a, const unsigned int /* version */)
{
    ar & boost::serialization::make_nvp("elems", a.elems);
}

} } // end namespace boost::serialization

#define BOOST_SERIALIZATION_USE_ARRAY_OPTIMIZATION(Archive)           \
namespace boost { namespace serialization {                           \
template <> struct use_array_optimization<Archive> {                  \
  template <class ValueType>                                          \
  struct apply : boost::mpl::apply1<Archive::use_array_optimization   \
      , typename boost::remove_const<ValueType>::type   \
    >::type {};                                                       \
}; }}

#endif //BOOST_SERIALIZATION_ARRAY_HPP
