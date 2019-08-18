//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_FA3ED0DCA17911DEA6BBA09955D89593
#define UUID_FA3ED0DCA17911DEA6BBA09955D89593

#include <boost/qvm/inline.hpp>
#include <boost/qvm/deduce_mat.hpp>
#include <boost/qvm/detail/remove_const.hpp>
#include <boost/qvm/assert.hpp>

namespace
boost
    {
    namespace
    qvm
        {
        template <class T,int R,int CR,int C>
        struct
        mat_traits<T[R][CR][C]>
            {
            static int const rows=0;
            static int const cols=0;
            typedef void scalar_type;
            };

        template <class T,int Rows,int Cols>
        struct
        mat_traits<T[Rows][Cols]>
            {
            typedef T this_matrix[Rows][Cols];
            typedef typename qvm_detail::remove_const<T>::type scalar_type;
            static int const rows=Rows;
            static int const cols=Cols;

            template <int Row,int Col>
            static
            BOOST_QVM_INLINE_CRITICAL
            scalar_type
            read_element( this_matrix const & x )
                {
                BOOST_QVM_STATIC_ASSERT(Row>=0);
                BOOST_QVM_STATIC_ASSERT(Row<Rows);
                BOOST_QVM_STATIC_ASSERT(Col>=0);
                BOOST_QVM_STATIC_ASSERT(Col<Cols);
                return x[Row][Col];
                }

            template <int Row,int Col>
            static
            BOOST_QVM_INLINE_CRITICAL
            scalar_type &
            write_element( this_matrix & x )
                {
                BOOST_QVM_STATIC_ASSERT(Row>=0);
                BOOST_QVM_STATIC_ASSERT(Row<Rows);
                BOOST_QVM_STATIC_ASSERT(Col>=0);
                BOOST_QVM_STATIC_ASSERT(Col<Cols);
                return x[Row][Col];
                }

            static
            BOOST_QVM_INLINE_CRITICAL
            scalar_type
            read_element_idx( int row, int col, this_matrix const & x )
                {
                BOOST_QVM_ASSERT(row>=0);
                BOOST_QVM_ASSERT(row<Rows);
                BOOST_QVM_ASSERT(col>=0);
                BOOST_QVM_ASSERT(col<Cols);
                return x[row][col];
                }

            static
            BOOST_QVM_INLINE_CRITICAL
            scalar_type &
            write_element_idx( int row, int col, this_matrix & x )
                {
                BOOST_QVM_ASSERT(row>=0);
                BOOST_QVM_ASSERT(row<Rows);
                BOOST_QVM_ASSERT(col>=0);
                BOOST_QVM_ASSERT(col<Cols);
                return x[row][col];
                }
            };

        template <class T,int Rows,int Cols,int R,int C>
        struct
        deduce_mat<T[Rows][Cols],R,C>
            {
            typedef mat<T,R,C> type;
            };

        template <class T,int Rows,int Cols,int R,int C>
        struct
        deduce_mat<T const[Rows][Cols],R,C>
            {
            typedef mat<T,R,C> type;
            };

        template <class T1,class T2,int Rows,int Cols,int R,int C>
        struct
        deduce_mat2<T1[Rows][Cols],T2[Rows][Cols],R,C>
            {
            typedef mat<typename deduce_scalar<T1,T2>::type,R,C> type;
            };

        template <int Rows,int Cols,class T>
        T (&ptr_mref( T * ptr ))[Rows][Cols]
            {
            return *reinterpret_cast<T (*)[Rows][Cols]>(ptr);
            }
        }
    }

#endif
