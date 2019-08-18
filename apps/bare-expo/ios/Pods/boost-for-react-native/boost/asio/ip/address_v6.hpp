//
// ip/address_v6.hpp
// ~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_IP_ADDRESS_V6_HPP
#define BOOST_ASIO_IP_ADDRESS_V6_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <string>
#include <boost/asio/detail/array.hpp>
#include <boost/asio/detail/socket_types.hpp>
#include <boost/asio/detail/winsock_init.hpp>
#include <boost/system/error_code.hpp>
#include <boost/asio/ip/address_v4.hpp>

#if !defined(BOOST_ASIO_NO_IOSTREAM)
# include <iosfwd>
#endif // !defined(BOOST_ASIO_NO_IOSTREAM)

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ip {

/// Implements IP version 6 style addresses.
/**
 * The boost::asio::ip::address_v6 class provides the ability to use and
 * manipulate IP version 6 addresses.
 *
 * @par Thread Safety
 * @e Distinct @e objects: Safe.@n
 * @e Shared @e objects: Unsafe.
 */
class address_v6
{
public:
  /// The type used to represent an address as an array of bytes.
  /**
   * @note This type is defined in terms of the C++0x template @c std::array
   * when it is available. Otherwise, it uses @c boost:array.
   */
#if defined(GENERATING_DOCUMENTATION)
  typedef array<unsigned char, 16> bytes_type;
#else
  typedef boost::asio::detail::array<unsigned char, 16> bytes_type;
#endif

  /// Default constructor.
  BOOST_ASIO_DECL address_v6();

  /// Construct an address from raw bytes and scope ID.
  BOOST_ASIO_DECL explicit address_v6(const bytes_type& bytes,
      unsigned long scope_id = 0);

  /// Copy constructor.
  BOOST_ASIO_DECL address_v6(const address_v6& other);

#if defined(BOOST_ASIO_HAS_MOVE)
  /// Move constructor.
  BOOST_ASIO_DECL address_v6(address_v6&& other);
#endif // defined(BOOST_ASIO_HAS_MOVE)

  /// Assign from another address.
  BOOST_ASIO_DECL address_v6& operator=(const address_v6& other);

#if defined(BOOST_ASIO_HAS_MOVE)
  /// Move-assign from another address.
  BOOST_ASIO_DECL address_v6& operator=(address_v6&& other);
#endif // defined(BOOST_ASIO_HAS_MOVE)

  /// The scope ID of the address.
  /**
   * Returns the scope ID associated with the IPv6 address.
   */
  unsigned long scope_id() const
  {
    return scope_id_;
  }

  /// The scope ID of the address.
  /**
   * Modifies the scope ID associated with the IPv6 address.
   */
  void scope_id(unsigned long id)
  {
    scope_id_ = id;
  }

  /// Get the address in bytes, in network byte order.
  BOOST_ASIO_DECL bytes_type to_bytes() const;

  /// Get the address as a string.
  BOOST_ASIO_DECL std::string to_string() const;

  /// Get the address as a string.
  BOOST_ASIO_DECL std::string to_string(boost::system::error_code& ec) const;

  /// Create an address from an IP address string.
  BOOST_ASIO_DECL static address_v6 from_string(const char* str);

  /// Create an address from an IP address string.
  BOOST_ASIO_DECL static address_v6 from_string(
      const char* str, boost::system::error_code& ec);

  /// Create an address from an IP address string.
  BOOST_ASIO_DECL static address_v6 from_string(const std::string& str);

  /// Create an address from an IP address string.
  BOOST_ASIO_DECL static address_v6 from_string(
      const std::string& str, boost::system::error_code& ec);

  /// Converts an IPv4-mapped or IPv4-compatible address to an IPv4 address.
  BOOST_ASIO_DECL address_v4 to_v4() const;

  /// Determine whether the address is a loopback address.
  BOOST_ASIO_DECL bool is_loopback() const;

  /// Determine whether the address is unspecified.
  BOOST_ASIO_DECL bool is_unspecified() const;

  /// Determine whether the address is link local.
  BOOST_ASIO_DECL bool is_link_local() const;

  /// Determine whether the address is site local.
  BOOST_ASIO_DECL bool is_site_local() const;

  /// Determine whether the address is a mapped IPv4 address.
  BOOST_ASIO_DECL bool is_v4_mapped() const;

  /// Determine whether the address is an IPv4-compatible address.
  BOOST_ASIO_DECL bool is_v4_compatible() const;

  /// Determine whether the address is a multicast address.
  BOOST_ASIO_DECL bool is_multicast() const;

  /// Determine whether the address is a global multicast address.
  BOOST_ASIO_DECL bool is_multicast_global() const;

  /// Determine whether the address is a link-local multicast address.
  BOOST_ASIO_DECL bool is_multicast_link_local() const;

  /// Determine whether the address is a node-local multicast address.
  BOOST_ASIO_DECL bool is_multicast_node_local() const;

  /// Determine whether the address is a org-local multicast address.
  BOOST_ASIO_DECL bool is_multicast_org_local() const;

  /// Determine whether the address is a site-local multicast address.
  BOOST_ASIO_DECL bool is_multicast_site_local() const;

  /// Compare two addresses for equality.
  BOOST_ASIO_DECL friend bool operator==(
      const address_v6& a1, const address_v6& a2);

  /// Compare two addresses for inequality.
  friend bool operator!=(const address_v6& a1, const address_v6& a2)
  {
    return !(a1 == a2);
  }

  /// Compare addresses for ordering.
  BOOST_ASIO_DECL friend bool operator<(
      const address_v6& a1, const address_v6& a2);

  /// Compare addresses for ordering.
  friend bool operator>(const address_v6& a1, const address_v6& a2)
  {
    return a2 < a1;
  }

  /// Compare addresses for ordering.
  friend bool operator<=(const address_v6& a1, const address_v6& a2)
  {
    return !(a2 < a1);
  }

  /// Compare addresses for ordering.
  friend bool operator>=(const address_v6& a1, const address_v6& a2)
  {
    return !(a1 < a2);
  }

  /// Obtain an address object that represents any address.
  static address_v6 any()
  {
    return address_v6();
  }

  /// Obtain an address object that represents the loopback address.
  BOOST_ASIO_DECL static address_v6 loopback();

  /// Create an IPv4-mapped IPv6 address.
  BOOST_ASIO_DECL static address_v6 v4_mapped(const address_v4& addr);

  /// Create an IPv4-compatible IPv6 address.
  BOOST_ASIO_DECL static address_v6 v4_compatible(const address_v4& addr);

private:
  // The underlying IPv6 address.
  boost::asio::detail::in6_addr_type addr_;

  // The scope ID associated with the address.
  unsigned long scope_id_;
};

#if !defined(BOOST_ASIO_NO_IOSTREAM)

/// Output an address as a string.
/**
 * Used to output a human-readable string for a specified address.
 *
 * @param os The output stream to which the string will be written.
 *
 * @param addr The address to be written.
 *
 * @return The output stream.
 *
 * @relates boost::asio::ip::address_v6
 */
template <typename Elem, typename Traits>
std::basic_ostream<Elem, Traits>& operator<<(
    std::basic_ostream<Elem, Traits>& os, const address_v6& addr);

#endif // !defined(BOOST_ASIO_NO_IOSTREAM)

} // namespace ip
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#include <boost/asio/ip/impl/address_v6.hpp>
#if defined(BOOST_ASIO_HEADER_ONLY)
# include <boost/asio/ip/impl/address_v6.ipp>
#endif // defined(BOOST_ASIO_HEADER_ONLY)

#endif // BOOST_ASIO_IP_ADDRESS_V6_HPP
