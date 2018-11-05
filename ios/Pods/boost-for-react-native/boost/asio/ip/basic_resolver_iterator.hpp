//
// ip/basic_resolver_iterator.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IP_BASIC_RESOLVER_ITERATOR_HPP
#define BOOST_ASIO_IP_BASIC_RESOLVER_ITERATOR_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <cstddef>
#include <cstring>
#include <iterator>
#include <string>
#include <vector>
#include <boost/asio/detail/shared_ptr.hpp>
#include <boost/asio/detail/socket_ops.hpp>
#include <boost/asio/detail/socket_types.hpp>
#include <boost/asio/ip/basic_resolver_entry.hpp>

#if defined(BOOST_ASIO_WINDOWS_RUNTIME)
# include <boost/asio/detail/winrt_utils.hpp>
#endif // defined(BOOST_ASIO_WINDOWS_RUNTIME)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ip {

/// An iterator over the entries produced by a resolver.
/**
 * The boost::asio::ip::basic_resolver_iterator class template is used to define
 * iterators over the results returned by a resolver.
 *
 * The iterator's value_type, obtained when the iterator is dereferenced, is:
 * @code const basic_resolver_entry<InternetProtocol> @endcode
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
template <typename InternetProtocol>
class basic_resolver_iterator
{
public:
  /// The type used for the distance between two iterators.
  typedef std::ptrdiff_t difference_type;

  /// The type of the value pointed to by the iterator.
  typedef basic_resolver_entry<InternetProtocol> value_type;

  /// The type of the result of applying operator->() to the iterator.
  typedef const basic_resolver_entry<InternetProtocol>* pointer;

  /// The type of the result of applying operator*() to the iterator.
  typedef const basic_resolver_entry<InternetProtocol>& reference;

  /// The iterator category.
  typedef std::forward_iterator_tag iterator_category;

  /// Default constructor creates an end iterator.
  basic_resolver_iterator()
    : index_(0)
  {
  }

  /// Create an iterator from an addrinfo list returned by getaddrinfo.
  static basic_resolver_iterator create(
      boost::asio::detail::addrinfo_type* address_info,
      const std::string& host_name, const std::string& service_name)
  {
    basic_resolver_iterator iter;
    if (!address_info)
      return iter;

    std::string actual_host_name = host_name;
    if (address_info->ai_canonname)
      actual_host_name = address_info->ai_canonname;

    iter.values_.reset(new values_type);

    while (address_info)
    {
      if (address_info->ai_family == BOOST_ASIO_OS_DEF(AF_INET)
          || address_info->ai_family == BOOST_ASIO_OS_DEF(AF_INET6))
      {
        using namespace std; // For memcpy.
        typename InternetProtocol::endpoint endpoint;
        endpoint.resize(static_cast<std::size_t>(address_info->ai_addrlen));
        memcpy(endpoint.data(), address_info->ai_addr,
            address_info->ai_addrlen);
        iter.values_->push_back(
            basic_resolver_entry<InternetProtocol>(endpoint,
              actual_host_name, service_name));
      }
      address_info = address_info->ai_next;
    }

    return iter;
  }

  /// Create an iterator from an endpoint, host name and service name.
  static basic_resolver_iterator create(
      const typename InternetProtocol::endpoint& endpoint,
      const std::string& host_name, const std::string& service_name)
  {
    basic_resolver_iterator iter;
    iter.values_.reset(new values_type);
    iter.values_->push_back(
        basic_resolver_entry<InternetProtocol>(
          endpoint, host_name, service_name));
    return iter;
  }

  /// Create an iterator from a sequence of endpoints, host and service name.
  template <typename EndpointIterator>
  static basic_resolver_iterator create(
      EndpointIterator begin, EndpointIterator end,
      const std::string& host_name, const std::string& service_name)
  {
    basic_resolver_iterator iter;
    if (begin != end)
    {
      iter.values_.reset(new values_type);
      for (EndpointIterator ep_iter = begin; ep_iter != end; ++ep_iter)
      {
        iter.values_->push_back(
            basic_resolver_entry<InternetProtocol>(
              *ep_iter, host_name, service_name));
      }
    }
    return iter;
  }

#if defined(BOOST_ASIO_WINDOWS_RUNTIME)
  /// Create an iterator from a Windows Runtime list of EndpointPair objects.
  static basic_resolver_iterator create(
      Windows::Foundation::Collections::IVectorView<
        Windows::Networking::EndpointPair^>^ endpoints,
      const boost::asio::detail::addrinfo_type& hints,
      const std::string& host_name, const std::string& service_name)
  {
    basic_resolver_iterator iter;
    if (endpoints->Size)
    {
      iter.values_.reset(new values_type);
      for (unsigned int i = 0; i < endpoints->Size; ++i)
      {
        auto pair = endpoints->GetAt(i);

        if (hints.ai_family == BOOST_ASIO_OS_DEF(AF_INET)
            && pair->RemoteHostName->Type
              != Windows::Networking::HostNameType::Ipv4)
          continue;

        if (hints.ai_family == BOOST_ASIO_OS_DEF(AF_INET6)
            && pair->RemoteHostName->Type
              != Windows::Networking::HostNameType::Ipv6)
          continue;

        iter.values_->push_back(
            basic_resolver_entry<InternetProtocol>(
              typename InternetProtocol::endpoint(
                ip::address::from_string(
                  boost::asio::detail::winrt_utils::string(
                    pair->RemoteHostName->CanonicalName)),
                boost::asio::detail::winrt_utils::integer(
                  pair->RemoteServiceName)),
              host_name, service_name));
      }
    }
    return iter;
  }
#endif // defined(BOOST_ASIO_WINDOWS_RUNTIME)

  /// Dereference an iterator.
  const basic_resolver_entry<InternetProtocol>& operator*() const
  {
    return dereference();
  }

  /// Dereference an iterator.
  const basic_resolver_entry<InternetProtocol>* operator->() const
  {
    return &dereference();
  }

  /// Increment operator (prefix).
  basic_resolver_iterator& operator++()
  {
    increment();
    return *this;
  }

  /// Increment operator (postfix).
  basic_resolver_iterator operator++(int)
  {
    basic_resolver_iterator tmp(*this);
    ++*this;
    return tmp;
  }

  /// Test two iterators for equality.
  friend bool operator==(const basic_resolver_iterator& a,
      const basic_resolver_iterator& b)
  {
    return a.equal(b);
  }

  /// Test two iterators for inequality.
  friend bool operator!=(const basic_resolver_iterator& a,
      const basic_resolver_iterator& b)
  {
    return !a.equal(b);
  }

private:
  void increment()
  {
    if (++index_ == values_->size())
    {
      // Reset state to match a default constructed end iterator.
      values_.reset();
      index_ = 0;
    }
  }

  bool equal(const basic_resolver_iterator& other) const
  {
    if (!values_ && !other.values_)
      return true;
    if (values_ != other.values_)
      return false;
    return index_ == other.index_;
  }

  const basic_resolver_entry<InternetProtocol>& dereference() const
  {
    return (*values_)[index_];
  }

  typedef std::vector<basic_resolver_entry<InternetProtocol> > values_type;
  boost::asio::detail::shared_ptr<values_type> values_;
  std::size_t index_;
};

} // namespace ip
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_IP_BASIC_RESOLVER_ITERATOR_HPP
