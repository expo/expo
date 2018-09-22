#include "tommath.h"

#ifdef BN_S_MP_MUL_DIGS_C
/* LibTomMath, multiple-precision integer library -- Tom St Denis
 *
 * LibTomMath is a library that provides multiple-precision
 * integer arithmetic as well as number theoretic functionality.
 *
 * The library was designed directly after the MPI library by
 * Michael Fromberger but has been written from scratch with
 * additional optimizations in place.
 *
 * The library is free for all purposes without any express
 * guarantee it works.
 *
 * Tom St Denis, tomstdenis@gmail.com, http://libtom.org
 */

/* multiplies |a| * |b| and only computes upto digs digits of result
 * HAC pp. 595, Algorithm 14.12  Modified so you can control how 
 * many digits of output are created.
 */
int s_mp_mul_digs (mp_int * a, mp_int * b, mp_int * c, int digs)
{
  mp_int  t;
  int     res, pa, pb, ix, iy;
  mp_digit u;
  mp_word r;
  mp_digit tmpx, *tmpt, *tmpy;

  /* can we use the fast multiplier? */
  if (((digs) < MP_WARRAY) &&
      MIN (a->used, b->used) < 
          (1 << ((CHAR_BIT * sizeof (mp_word)) - (2 * DIGIT_BIT)))) {
    return fast_s_mp_mul_digs (a, b, c, digs);
  }

  if ((res = mp_init_size (&t, digs)) != MP_OKAY) {
    return res;
  }
  t.used = digs;

  /* compute the digits of the product directly */
  pa = a->used;
  for (ix = 0; ix < pa; ix++) {
    /* set the carry to zero */
    u = 0;

    /* limit ourselves to making digs digits of output */
    pb = MIN (b->used, digs - ix);

    /* setup some aliases */
    /* copy of the digit from a used within the nested loop */
    tmpx = a->dp[ix];
    
    /* an alias for the destination shifted ix places */
    tmpt = t.dp + ix;
    
    /* an alias for the digits of b */
    tmpy = b->dp;

    /* compute the columns of the output and propagate the carry */
    for (iy = 0; iy < pb; iy++) {
      /* compute the column as a mp_word */
      r       = ((mp_word)*tmpt) +
                ((mp_word)tmpx) * ((mp_word)*tmpy++) +
                ((mp_word) u);

      /* the new column is the lower part of the result */
      *tmpt++ = (mp_digit) (r & ((mp_word) MP_MASK));

      /* get the carry word from the result */
      u       = (mp_digit) (r >> ((mp_word) DIGIT_BIT));
    }
    /* set carry if it is placed below digs */
    if (ix + iy < digs) {
      *tmpt = u;
    }
  }

  mp_clamp (&t);
  mp_exch (&t, c);

  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_TO_UNSIGNED_BIN_N_C

/* store in unsigned [big endian] format */
int mp_to_unsigned_bin_n (mp_int * a, unsigned char *b, unsigned long *outlen)
{
   if (*outlen < (unsigned long)mp_unsigned_bin_size(a)) {
      return MP_VAL;
   }
   *outlen = mp_unsigned_bin_size(a);
   return mp_to_unsigned_bin(a, b);
}
#endif

#ifdef BN_MP_EXPT_D_C

/* calculate c = a**b  using a square-multiply algorithm */
int mp_expt_d (mp_int * a, mp_digit b, mp_int * c)
{
  int     res, x;
  mp_int  g;

  if ((res = mp_init_copy (&g, a)) != MP_OKAY) {
    return res;
  }

  /* set initial result */
  mp_set (c, 1);

  for (x = 0; x < (int) DIGIT_BIT; x++) {
    /* square */
    if ((res = mp_sqr (c, c)) != MP_OKAY) {
      mp_clear (&g);
      return res;
    }

    /* if the bit is set multiply */
    if ((b & (mp_digit) (((mp_digit)1) << (DIGIT_BIT - 1))) != 0) {
      if ((res = mp_mul (c, &g, c)) != MP_OKAY) {
         mp_clear (&g);
         return res;
      }
    }

    /* shift to next bit */
    b <<= 1;
  }

  mp_clear (&g);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_SET_INT_C

/* set a 32-bit const */
int mp_set_int (mp_int * a, unsigned long b)
{
  int     x, res;

  mp_zero (a);
  
  /* set four bits at a time */
  for (x = 0; x < 8; x++) {
    /* shift the number up four bits */
    if ((res = mp_mul_2d (a, 4, a)) != MP_OKAY) {
      return res;
    }

    /* OR in the top four bits of the source */
    a->dp[0] |= (b >> 28) & 15;

    /* shift the source up to the next four bits */
    b <<= 4;

    /* ensure that digits are not clamped off */
    a->used += 1;
  }
  mp_clamp (a);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_ADD_C

/* high level addition (handles signs) */
int mp_add (mp_int * a, mp_int * b, mp_int * c)
{
  int     sa, sb, res;

  /* get sign of both inputs */
  sa = a->sign;
  sb = b->sign;

  /* handle two cases, not four */
  if (sa == sb) {
    /* both positive or both negative */
    /* add their magnitudes, copy the sign */
    c->sign = sa;
    res = s_mp_add (a, b, c);
  } else {
    /* one positive, the other negative */
    /* subtract the one with the greater magnitude from */
    /* the one of the lesser magnitude.  The result gets */
    /* the sign of the one with the greater magnitude. */
    if (mp_cmp_mag (a, b) == MP_LT) {
      c->sign = sb;
      res = s_mp_sub (b, a, c);
    } else {
      c->sign = sa;
      res = s_mp_sub (a, b, c);
    }
  }
  return res;
}

#endif

#ifdef BN_MP_INIT_C

/* init a new mp_int */
int mp_init (mp_int * a)
{
  int i;

  /* allocate memory required and clear it */
  a->dp = OPT_CAST(mp_digit) XMALLOC (sizeof (mp_digit) * MP_PREC);
  if (a->dp == NULL) {
    return MP_MEM;
  }

  /* set the digits to zero */
  for (i = 0; i < MP_PREC; i++) {
      a->dp[i] = 0;
  }

  /* set the used to zero, allocated digits to the default precision
   * and sign to positive */
  a->used  = 0;
  a->alloc = MP_PREC;
  a->sign  = MP_ZPOS;

  return MP_OKAY;
}
#endif

#ifdef BN_MP_CNT_LSB_C

static const int lnz[16] = { 
   4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0
};

/* Counts the number of lsbs which are zero before the first zero bit */
int mp_cnt_lsb(mp_int *a)
{
   int x;
   mp_digit q, qq;

   /* easy out */
   if (mp_iszero(a) == 1) {
      return 0;
   }

   /* scan lower digits until non-zero */
   for (x = 0; x < a->used && a->dp[x] == 0; x++);
   q = a->dp[x];
   x *= DIGIT_BIT;

   /* now scan this digit until a 1 is found */
   if ((q & 1) == 0) {
      do {
         qq  = q & 15;
         x  += lnz[qq];
         q >>= 4;
      } while (qq == 0);
   }
   return x;
}

#endif

#ifdef BN_MP_TOOM_SQR_C

/* squaring using Toom-Cook 3-way algorithm */
int
mp_toom_sqr(mp_int *a, mp_int *b)
{
    mp_int w0, w1, w2, w3, w4, tmp1, a0, a1, a2;
    int res, B;

    /* init temps */
    if ((res = mp_init_multi(&w0, &w1, &w2, &w3, &w4, &a0, &a1, &a2, &tmp1, NULL)) != MP_OKAY) {
       return res;
    }

    /* B */
    B = a->used / 3;

    /* a = a2 * B**2 + a1 * B + a0 */
    if ((res = mp_mod_2d(a, DIGIT_BIT * B, &a0)) != MP_OKAY) {
       goto ERR;
    }

    if ((res = mp_copy(a, &a1)) != MP_OKAY) {
       goto ERR;
    }
    mp_rshd(&a1, B);
    mp_mod_2d(&a1, DIGIT_BIT * B, &a1);

    if ((res = mp_copy(a, &a2)) != MP_OKAY) {
       goto ERR;
    }
    mp_rshd(&a2, B*2);

    /* w0 = a0*a0 */
    if ((res = mp_sqr(&a0, &w0)) != MP_OKAY) {
       goto ERR;
    }

    /* w4 = a2 * a2 */
    if ((res = mp_sqr(&a2, &w4)) != MP_OKAY) {
       goto ERR;
    }

    /* w1 = (a2 + 2(a1 + 2a0))**2 */
    if ((res = mp_mul_2(&a0, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul_2(&tmp1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a2, &tmp1)) != MP_OKAY) {
       goto ERR;
    }

    if ((res = mp_sqr(&tmp1, &w1)) != MP_OKAY) {
       goto ERR;
    }

    /* w3 = (a0 + 2(a1 + 2a2))**2 */
    if ((res = mp_mul_2(&a2, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul_2(&tmp1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a0, &tmp1)) != MP_OKAY) {
       goto ERR;
    }

    if ((res = mp_sqr(&tmp1, &w3)) != MP_OKAY) {
       goto ERR;
    }


    /* w2 = (a2 + a1 + a0)**2 */
    if ((res = mp_add(&a2, &a1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a0, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_sqr(&tmp1, &w2)) != MP_OKAY) {
       goto ERR;
    }

    /* now solve the matrix

       0  0  0  0  1
       1  2  4  8  16
       1  1  1  1  1
       16 8  4  2  1
       1  0  0  0  0

       using 12 subtractions, 4 shifts, 2 small divisions and 1 small multiplication.
     */

     /* r1 - r4 */
     if ((res = mp_sub(&w1, &w4, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - r0 */
     if ((res = mp_sub(&w3, &w0, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r1/2 */
     if ((res = mp_div_2(&w1, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3/2 */
     if ((res = mp_div_2(&w3, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r2 - r0 - r4 */
     if ((res = mp_sub(&w2, &w0, &w2)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w2, &w4, &w2)) != MP_OKAY) {
        goto ERR;
     }
     /* r1 - r2 */
     if ((res = mp_sub(&w1, &w2, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - r2 */
     if ((res = mp_sub(&w3, &w2, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r1 - 8r0 */
     if ((res = mp_mul_2d(&w0, 3, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w1, &tmp1, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - 8r4 */
     if ((res = mp_mul_2d(&w4, 3, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w3, &tmp1, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* 3r2 - r1 - r3 */
     if ((res = mp_mul_d(&w2, 3, &w2)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w2, &w1, &w2)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w2, &w3, &w2)) != MP_OKAY) {
        goto ERR;
     }
     /* r1 - r2 */
     if ((res = mp_sub(&w1, &w2, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - r2 */
     if ((res = mp_sub(&w3, &w2, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r1/3 */
     if ((res = mp_div_3(&w1, &w1, NULL)) != MP_OKAY) {
        goto ERR;
     }
     /* r3/3 */
     if ((res = mp_div_3(&w3, &w3, NULL)) != MP_OKAY) {
        goto ERR;
     }

     /* at this point shift W[n] by B*n */
     if ((res = mp_lshd(&w1, 1*B)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_lshd(&w2, 2*B)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_lshd(&w3, 3*B)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_lshd(&w4, 4*B)) != MP_OKAY) {
        goto ERR;
     }

     if ((res = mp_add(&w0, &w1, b)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_add(&w2, &w3, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_add(&w4, &tmp1, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_add(&tmp1, b, b)) != MP_OKAY) {
        goto ERR;
     }

ERR:
     mp_clear_multi(&w0, &w1, &w2, &w3, &w4, &a0, &a1, &a2, &tmp1, NULL);
     return res;
}

#endif

#ifdef BN_MP_FREAD_C

/* read a bigint from a file stream in ASCII */
int mp_fread(mp_int *a, int radix, FILE *stream)
{
   int err, ch, neg, y;
   
   /* clear a */
   mp_zero(a);
   
   /* if first digit is - then set negative */
   ch = fgetc(stream);
   if (ch == '-') {
      neg = MP_NEG;
      ch = fgetc(stream);
   } else {
      neg = MP_ZPOS;
   }
   
   for (;;) {
      /* find y in the radix map */
      for (y = 0; y < radix; y++) {
          if (mp_s_rmap[y] == ch) {
             break;
          }
      }
      if (y == radix) {
         break;
      }
      
      /* shift up and add */
      if ((err = mp_mul_d(a, radix, a)) != MP_OKAY) {
         return err;
      }
      if ((err = mp_add_d(a, y, a)) != MP_OKAY) {
         return err;
      }
      
      ch = fgetc(stream);
   }
   if (mp_cmp_d(a, 0) != MP_EQ) {
      a->sign = neg;
   }
   
   return MP_OKAY;
}

#endif

#ifdef BN_MP_DIV_3_C

/* divide by three (based on routine from MPI and the GMP manual) */
int
mp_div_3 (mp_int * a, mp_int *c, mp_digit * d)
{
  mp_int   q;
  mp_word  w, t;
  mp_digit b;
  int      res, ix;
  
  /* b = 2**DIGIT_BIT / 3 */
  b = (((mp_word)1) << ((mp_word)DIGIT_BIT)) / ((mp_word)3);

  if ((res = mp_init_size(&q, a->used)) != MP_OKAY) {
     return res;
  }
  
  q.used = a->used;
  q.sign = a->sign;
  w = 0;
  for (ix = a->used - 1; ix >= 0; ix--) {
     w = (w << ((mp_word)DIGIT_BIT)) | ((mp_word)a->dp[ix]);

     if (w >= 3) {
        /* multiply w by [1/3] */
        t = (w * ((mp_word)b)) >> ((mp_word)DIGIT_BIT);

        /* now subtract 3 * [w/3] from w, to get the remainder */
        w -= t+t+t;

        /* fixup the remainder as required since
         * the optimization is not exact.
         */
        while (w >= 3) {
           t += 1;
           w -= 3;
        }
      } else {
        t = 0;
      }
      q.dp[ix] = (mp_digit)t;
  }

  /* [optional] store the remainder */
  if (d != NULL) {
     *d = (mp_digit)w;
  }

  /* [optional] store the quotient */
  if (c != NULL) {
     mp_clamp(&q);
     mp_exch(&q, c);
  }
  mp_clear(&q);
  
  return res;
}

#endif

#ifdef BN_MP_LCM_C

/* computes least common multiple as |a*b|/(a, b) */
int mp_lcm (mp_int * a, mp_int * b, mp_int * c)
{
  int     res;
  mp_int  t1, t2;


  if ((res = mp_init_multi (&t1, &t2, NULL)) != MP_OKAY) {
    return res;
  }

  /* t1 = get the GCD of the two inputs */
  if ((res = mp_gcd (a, b, &t1)) != MP_OKAY) {
    goto LBL_T;
  }

  /* divide the smallest by the GCD */
  if (mp_cmp_mag(a, b) == MP_LT) {
     /* store quotient in t2 such that t2 * b is the LCM */
     if ((res = mp_div(a, &t1, &t2, NULL)) != MP_OKAY) {
        goto LBL_T;
     }
     res = mp_mul(b, &t2, c);
  } else {
     /* store quotient in t2 such that t2 * a is the LCM */
     if ((res = mp_div(b, &t1, &t2, NULL)) != MP_OKAY) {
        goto LBL_T;
     }
     res = mp_mul(a, &t2, c);
  }

  /* fix the sign to positive */
  c->sign = MP_ZPOS;

LBL_T:
  mp_clear_multi (&t1, &t2, NULL);
  return res;
}
#endif

#ifdef BN_MP_REDUCE_IS_2K_C

/* determines if mp_reduce_2k can be used */
int mp_reduce_is_2k(mp_int *a)
{
   int ix, iy, iw;
   mp_digit iz;
   
   if (a->used == 0) {
      return MP_NO;
   } else if (a->used == 1) {
      return MP_YES;
   } else if (a->used > 1) {
      iy = mp_count_bits(a);
      iz = 1;
      iw = 1;
    
      /* Test every bit from the second digit up, must be 1 */
      for (ix = DIGIT_BIT; ix < iy; ix++) {
          if ((a->dp[iw] & iz) == 0) {
             return MP_NO;
          }
          iz <<= 1;
          if (iz > (mp_digit)MP_MASK) {
             ++iw;
             iz = 1;
          }
      }
   }
   return MP_YES;
}

#endif

#ifdef BNCORE_C

/* Known optimal configurations

 CPU                    /Compiler     /MUL CUTOFF/SQR CUTOFF
-------------------------------------------------------------
 Intel P4 Northwood     /GCC v3.4.1   /        88/       128/LTM 0.32 ;-)
 AMD Athlon64           /GCC v3.4.4   /        80/       120/LTM 0.35
 
*/

int     KARATSUBA_MUL_CUTOFF = 80,      /* Min. number of digits before Karatsuba multiplication is used. */
        KARATSUBA_SQR_CUTOFF = 120,     /* Min. number of digits before Karatsuba squaring is used. */
        
        TOOM_MUL_CUTOFF      = 350,      /* no optimal values of these are known yet so set em high */
        TOOM_SQR_CUTOFF      = 400; 
#endif

#ifdef BN_MP_MOD_2D_C

/* calc a value mod 2**b */
int
mp_mod_2d (mp_int * a, int b, mp_int * c)
{
  int     x, res;

  /* if b is <= 0 then zero the int */
  if (b <= 0) {
    mp_zero (c);
    return MP_OKAY;
  }

  /* if the modulus is larger than the value than return */
  if (b >= (int) (a->used * DIGIT_BIT)) {
    res = mp_copy (a, c);
    return res;
  }

  /* copy */
  if ((res = mp_copy (a, c)) != MP_OKAY) {
    return res;
  }

  /* zero digits above the last digit of the modulus */
  for (x = (b / DIGIT_BIT) + ((b % DIGIT_BIT) == 0 ? 0 : 1); x < c->used; x++) {
    c->dp[x] = 0;
  }
  /* clear the digit that is not completely outside/inside the modulus */
  c->dp[b / DIGIT_BIT] &=
    (mp_digit) ((((mp_digit) 1) << (((mp_digit) b) % DIGIT_BIT)) - ((mp_digit) 1));
  mp_clamp (c);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_N_ROOT_C

/* find the n'th root of an integer 
 *
 * Result found such that (c)**b <= a and (c+1)**b > a 
 *
 * This algorithm uses Newton's approximation 
 * x[i+1] = x[i] - f(x[i])/f'(x[i]) 
 * which will find the root in log(N) time where 
 * each step involves a fair bit.  This is not meant to 
 * find huge roots [square and cube, etc].
 */
int mp_n_root (mp_int * a, mp_digit b, mp_int * c)
{
  mp_int  t1, t2, t3;
  int     res, neg;

  /* input must be positive if b is even */
  if ((b & 1) == 0 && a->sign == MP_NEG) {
    return MP_VAL;
  }

  if ((res = mp_init (&t1)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_init (&t2)) != MP_OKAY) {
    goto LBL_T1;
  }

  if ((res = mp_init (&t3)) != MP_OKAY) {
    goto LBL_T2;
  }

  /* if a is negative fudge the sign but keep track */
  neg     = a->sign;
  a->sign = MP_ZPOS;

  /* t2 = 2 */
  mp_set (&t2, 2);

  do {
    /* t1 = t2 */
    if ((res = mp_copy (&t2, &t1)) != MP_OKAY) {
      goto LBL_T3;
    }

    /* t2 = t1 - ((t1**b - a) / (b * t1**(b-1))) */
    
    /* t3 = t1**(b-1) */
    if ((res = mp_expt_d (&t1, b - 1, &t3)) != MP_OKAY) {   
      goto LBL_T3;
    }

    /* numerator */
    /* t2 = t1**b */
    if ((res = mp_mul (&t3, &t1, &t2)) != MP_OKAY) {    
      goto LBL_T3;
    }

    /* t2 = t1**b - a */
    if ((res = mp_sub (&t2, a, &t2)) != MP_OKAY) {  
      goto LBL_T3;
    }

    /* denominator */
    /* t3 = t1**(b-1) * b  */
    if ((res = mp_mul_d (&t3, b, &t3)) != MP_OKAY) {    
      goto LBL_T3;
    }

    /* t3 = (t1**b - a)/(b * t1**(b-1)) */
    if ((res = mp_div (&t2, &t3, &t3, NULL)) != MP_OKAY) {  
      goto LBL_T3;
    }

    if ((res = mp_sub (&t1, &t3, &t2)) != MP_OKAY) {
      goto LBL_T3;
    }
  }  while (mp_cmp (&t1, &t2) != MP_EQ);

  /* result can be off by a few so check */
  for (;;) {
    if ((res = mp_expt_d (&t1, b, &t2)) != MP_OKAY) {
      goto LBL_T3;
    }

    if (mp_cmp (&t2, a) == MP_GT) {
      if ((res = mp_sub_d (&t1, 1, &t1)) != MP_OKAY) {
         goto LBL_T3;
      }
    } else {
      break;
    }
  }

  /* reset the sign of a first */
  a->sign = neg;

  /* set the result */
  mp_exch (&t1, c);

  /* set the sign of the result */
  c->sign = neg;

  res = MP_OKAY;

LBL_T3:mp_clear (&t3);
LBL_T2:mp_clear (&t2);
LBL_T1:mp_clear (&t1);
  return res;
}
#endif

#ifdef BN_MP_MULMOD_C

/* d = a * b (mod c) */
int mp_mulmod (mp_int * a, mp_int * b, mp_int * c, mp_int * d)
{
  int     res;
  mp_int  t;

  if ((res = mp_init (&t)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_mul (a, b, &t)) != MP_OKAY) {
    mp_clear (&t);
    return res;
  }
  res = mp_mod (&t, c, d);
  mp_clear (&t);
  return res;
}
#endif

#ifdef BN_ERROR_C

static const struct {
     int code;
     char *msg;
} msgs[] = {
     { MP_OKAY, "Successful" },
     { MP_MEM,  "Out of heap" },
     { MP_VAL,  "Value out of range" }
};

/* return a char * string for a given code */
char *mp_error_to_string(int code)
{
   int x;

   /* scan the lookup table for the given message */
   for (x = 0; x < (int)(sizeof(msgs) / sizeof(msgs[0])); x++) {
       if (msgs[x].code == code) {
          return msgs[x].msg;
       }
   }

   /* generic reply for invalid code */
   return "Invalid error code";
}

#endif

#ifdef BN_MP_REDUCE_C

/* reduces x mod m, assumes 0 < x < m**2, mu is 
 * precomputed via mp_reduce_setup.
 * From HAC pp.604 Algorithm 14.42
 */
int mp_reduce (mp_int * x, mp_int * m, mp_int * mu)
{
  mp_int  q;
  int     res, um = m->used;

  /* q = x */
  if ((res = mp_init_copy (&q, x)) != MP_OKAY) {
    return res;
  }

  /* q1 = x / b**(k-1)  */
  mp_rshd (&q, um - 1);         

  /* according to HAC this optimization is ok */
  if (((unsigned long) um) > (((mp_digit)1) << (DIGIT_BIT - 1))) {
    if ((res = mp_mul (&q, mu, &q)) != MP_OKAY) {
      goto CLEANUP;
    }
  } else {
#ifdef BN_S_MP_MUL_HIGH_DIGS_C
    if ((res = s_mp_mul_high_digs (&q, mu, &q, um)) != MP_OKAY) {
      goto CLEANUP;
    }
#elif defined(BN_FAST_S_MP_MUL_HIGH_DIGS_C)
    if ((res = fast_s_mp_mul_high_digs (&q, mu, &q, um)) != MP_OKAY) {
      goto CLEANUP;
    }
#else 
    { 
      res = MP_VAL;
      goto CLEANUP;
    }
#endif
  }

  /* q3 = q2 / b**(k+1) */
  mp_rshd (&q, um + 1);         

  /* x = x mod b**(k+1), quick (no division) */
  if ((res = mp_mod_2d (x, DIGIT_BIT * (um + 1), x)) != MP_OKAY) {
    goto CLEANUP;
  }

  /* q = q * m mod b**(k+1), quick (no division) */
  if ((res = s_mp_mul_digs (&q, m, &q, um + 1)) != MP_OKAY) {
    goto CLEANUP;
  }

  /* x = x - q */
  if ((res = mp_sub (x, &q, x)) != MP_OKAY) {
    goto CLEANUP;
  }

  /* If x < 0, add b**(k+1) to it */
  if (mp_cmp_d (x, 0) == MP_LT) {
    mp_set (&q, 1);
    if ((res = mp_lshd (&q, um + 1)) != MP_OKAY)
      goto CLEANUP;
    if ((res = mp_add (x, &q, x)) != MP_OKAY)
      goto CLEANUP;
  }

  /* Back off if it's too big */
  while (mp_cmp (x, m) != MP_LT) {
    if ((res = s_mp_sub (x, m, x)) != MP_OKAY) {
      goto CLEANUP;
    }
  }
  
CLEANUP:
  mp_clear (&q);

  return res;
}
#endif

#ifdef BN_MP_KARATSUBA_SQR_C

/* Karatsuba squaring, computes b = a*a using three 
 * half size squarings
 *
 * See comments of karatsuba_mul for details.  It 
 * is essentially the same algorithm but merely 
 * tuned to perform recursive squarings.
 */
int mp_karatsuba_sqr (mp_int * a, mp_int * b)
{
  mp_int  x0, x1, t1, t2, x0x0, x1x1;
  int     B, err;

  err = MP_MEM;

  /* min # of digits */
  B = a->used;

  /* now divide in two */
  B = B >> 1;

  /* init copy all the temps */
  if (mp_init_size (&x0, B) != MP_OKAY)
    goto ERR;
  if (mp_init_size (&x1, a->used - B) != MP_OKAY)
    goto X0;

  /* init temps */
  if (mp_init_size (&t1, a->used * 2) != MP_OKAY)
    goto X1;
  if (mp_init_size (&t2, a->used * 2) != MP_OKAY)
    goto T1;
  if (mp_init_size (&x0x0, B * 2) != MP_OKAY)
    goto T2;
  if (mp_init_size (&x1x1, (a->used - B) * 2) != MP_OKAY)
    goto X0X0;

  {
    register int x;
    register mp_digit *dst, *src;

    src = a->dp;

    /* now shift the digits */
    dst = x0.dp;
    for (x = 0; x < B; x++) {
      *dst++ = *src++;
    }

    dst = x1.dp;
    for (x = B; x < a->used; x++) {
      *dst++ = *src++;
    }
  }

  x0.used = B;
  x1.used = a->used - B;

  mp_clamp (&x0);

  /* now calc the products x0*x0 and x1*x1 */
  if (mp_sqr (&x0, &x0x0) != MP_OKAY)
    goto X1X1;           /* x0x0 = x0*x0 */
  if (mp_sqr (&x1, &x1x1) != MP_OKAY)
    goto X1X1;           /* x1x1 = x1*x1 */

  /* now calc (x1+x0)**2 */
  if (s_mp_add (&x1, &x0, &t1) != MP_OKAY)
    goto X1X1;           /* t1 = x1 - x0 */
  if (mp_sqr (&t1, &t1) != MP_OKAY)
    goto X1X1;           /* t1 = (x1 - x0) * (x1 - x0) */

  /* add x0y0 */
  if (s_mp_add (&x0x0, &x1x1, &t2) != MP_OKAY)
    goto X1X1;           /* t2 = x0x0 + x1x1 */
  if (s_mp_sub (&t1, &t2, &t1) != MP_OKAY)
    goto X1X1;           /* t1 = (x1+x0)**2 - (x0x0 + x1x1) */

  /* shift by B */
  if (mp_lshd (&t1, B) != MP_OKAY)
    goto X1X1;           /* t1 = (x0x0 + x1x1 - (x1-x0)*(x1-x0))<<B */
  if (mp_lshd (&x1x1, B * 2) != MP_OKAY)
    goto X1X1;           /* x1x1 = x1x1 << 2*B */

  if (mp_add (&x0x0, &t1, &t1) != MP_OKAY)
    goto X1X1;           /* t1 = x0x0 + t1 */
  if (mp_add (&t1, &x1x1, b) != MP_OKAY)
    goto X1X1;           /* t1 = x0x0 + t1 + x1x1 */

  err = MP_OKAY;

X1X1:mp_clear (&x1x1);
X0X0:mp_clear (&x0x0);
T2:mp_clear (&t2);
T1:mp_clear (&t1);
X1:mp_clear (&x1);
X0:mp_clear (&x0);
ERR:
  return err;
}
#endif

#ifdef BN_MP_PRIME_IS_DIVISIBLE_C

/* determines if an integers is divisible by one 
 * of the first PRIME_SIZE primes or not
 *
 * sets result to 0 if not, 1 if yes
 */
int mp_prime_is_divisible (mp_int * a, int *result)
{
  int     err, ix;
  mp_digit res;

  /* default to not */
  *result = MP_NO;

  for (ix = 0; ix < PRIME_SIZE; ix++) {
    /* what is a mod LBL_prime_tab[ix] */
    if ((err = mp_mod_d (a, ltm_prime_tab[ix], &res)) != MP_OKAY) {
      return err;
    }

    /* is the residue zero? */
    if (res == 0) {
      *result = MP_YES;
      return MP_OKAY;
    }
  }

  return MP_OKAY;
}
#endif

#ifdef BN_MP_ZERO_C

/* set to zero */
void mp_zero (mp_int * a)
{
  int       n;
  mp_digit *tmp;

  a->sign = MP_ZPOS;
  a->used = 0;

  tmp = a->dp;
  for (n = 0; n < a->alloc; n++) {
     *tmp++ = 0;
  }
}
#endif

#ifdef BN_MP_TORADIX_C

/* stores a bignum as a ASCII string in a given radix (2..64) */
int mp_toradix (mp_int * a, char *str, int radix)
{
  int     res, digs;
  mp_int  t;
  mp_digit d;
  char   *_s = str;

  /* check range of the radix */
  if (radix < 2 || radix > 64) {
    return MP_VAL;
  }

  /* quick out if its zero */
  if (mp_iszero(a) == 1) {
     *str++ = '0';
     *str = '\0';
     return MP_OKAY;
  }

  if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
    return res;
  }

  /* if it is negative output a - */
  if (t.sign == MP_NEG) {
    ++_s;
    *str++ = '-';
    t.sign = MP_ZPOS;
  }

  digs = 0;
  while (mp_iszero (&t) == 0) {
    if ((res = mp_div_d (&t, (mp_digit) radix, &t, &d)) != MP_OKAY) {
      mp_clear (&t);
      return res;
    }
    *str++ = mp_s_rmap[d];
    ++digs;
  }

  /* reverse the digits of the string.  In this case _s points
   * to the first digit [exluding the sign] of the number]
   */
  bn_reverse ((unsigned char *)_s, digs);

  /* append a NULL so the string is properly terminated */
  *str = '\0';

  mp_clear (&t);
  return MP_OKAY;
}

#endif

#ifdef BN_MP_DIV_D_C

static int s_is_power_of_two(mp_digit b, int *p)
{
   int x;

   /* fast return if no power of two */
   if ((b==0) || (b & (b-1))) {
      return 0;
   }

   for (x = 0; x < DIGIT_BIT; x++) {
      if (b == (((mp_digit)1)<<x)) {
         *p = x;
         return 1;
      }
   }
   return 0;
}

/* single digit division (based on routine from MPI) */
int mp_div_d (mp_int * a, mp_digit b, mp_int * c, mp_digit * d)
{
  mp_int  q;
  mp_word w;
  mp_digit t;
  int     res, ix;

  /* cannot divide by zero */
  if (b == 0) {
     return MP_VAL;
  }

  /* quick outs */
  if (b == 1 || mp_iszero(a) == 1) {
     if (d != NULL) {
        *d = 0;
     }
     if (c != NULL) {
        return mp_copy(a, c);
     }
     return MP_OKAY;
  }

  /* power of two ? */
  if (s_is_power_of_two(b, &ix) == 1) {
     if (d != NULL) {
        *d = a->dp[0] & ((((mp_digit)1)<<ix) - 1);
     }
     if (c != NULL) {
        return mp_div_2d(a, ix, c, NULL);
     }
     return MP_OKAY;
  }

#ifdef BN_MP_DIV_3_C
  /* three? */
  if (b == 3) {
     return mp_div_3(a, c, d);
  }
#endif

  /* no easy answer [c'est la vie].  Just division */
  if ((res = mp_init_size(&q, a->used)) != MP_OKAY) {
     return res;
  }
  
  q.used = a->used;
  q.sign = a->sign;
  w = 0;
  for (ix = a->used - 1; ix >= 0; ix--) {
     w = (w << ((mp_word)DIGIT_BIT)) | ((mp_word)a->dp[ix]);
     
     if (w >= b) {
        t = (mp_digit)(w / b);
        w -= ((mp_word)t) * ((mp_word)b);
      } else {
        t = 0;
      }
      q.dp[ix] = (mp_digit)t;
  }
  
  if (d != NULL) {
     *d = (mp_digit)w;
  }
  
  if (c != NULL) {
     mp_clamp(&q);
     mp_exch(&q, c);
  }
  mp_clear(&q);
  
  return res;
}

#endif

#ifdef BN_MP_SUB_C

/* high level subtraction (handles signs) */
int
mp_sub (mp_int * a, mp_int * b, mp_int * c)
{
  int     sa, sb, res;

  sa = a->sign;
  sb = b->sign;

  if (sa != sb) {
    /* subtract a negative from a positive, OR */
    /* subtract a positive from a negative. */
    /* In either case, ADD their magnitudes, */
    /* and use the sign of the first number. */
    c->sign = sa;
    res = s_mp_add (a, b, c);
  } else {
    /* subtract a positive from a positive, OR */
    /* subtract a negative from a negative. */
    /* First, take the difference between their */
    /* magnitudes, then... */
    if (mp_cmp_mag (a, b) != MP_LT) {
      /* Copy the sign from the first */
      c->sign = sa;
      /* The first has a larger or equal magnitude */
      res = s_mp_sub (a, b, c);
    } else {
      /* The result has the *opposite* sign from */
      /* the first number. */
      c->sign = (sa == MP_ZPOS) ? MP_NEG : MP_ZPOS;
      /* The second has a larger magnitude */
      res = s_mp_sub (b, a, c);
    }
  }
  return res;
}

#endif

#ifdef BN_MP_INIT_SIZE_C

/* init an mp_init for a given size */
int mp_init_size (mp_int * a, int size)
{
  int x;

  /* pad size so there are always extra digits */
  size += (MP_PREC * 2) - (size % MP_PREC);	
  
  /* alloc mem */
  a->dp = OPT_CAST(mp_digit) XMALLOC (sizeof (mp_digit) * size);
  if (a->dp == NULL) {
    return MP_MEM;
  }

  /* set the members */
  a->used  = 0;
  a->alloc = size;
  a->sign  = MP_ZPOS;

  /* zero the digits */
  for (x = 0; x < size; x++) {
      a->dp[x] = 0;
  }

  return MP_OKAY;
}
#endif

#ifdef BN_MP_PRIME_NEXT_PRIME_C

/* finds the next prime after the number "a" using "t" trials
 * of Miller-Rabin.
 *
 * bbs_style = 1 means the prime must be congruent to 3 mod 4
 */
int mp_prime_next_prime(mp_int *a, int t, int bbs_style)
{
   int      err, res = 0, x, y;
   mp_digit res_tab[PRIME_SIZE], step, kstep;
   mp_int   b;

   /* ensure t is valid */
   if (t <= 0 || t > PRIME_SIZE) {
      return MP_VAL;
   }

   /* force positive */
   a->sign = MP_ZPOS;

   /* simple algo if a is less than the largest prime in the table */
   if (mp_cmp_d(a, ltm_prime_tab[PRIME_SIZE-1]) == MP_LT) {
      /* find which prime it is bigger than */
      for (x = PRIME_SIZE - 2; x >= 0; x--) {
          if (mp_cmp_d(a, ltm_prime_tab[x]) != MP_LT) {
             if (bbs_style == 1) {
                /* ok we found a prime smaller or
                 * equal [so the next is larger]
                 *
                 * however, the prime must be
                 * congruent to 3 mod 4
                 */
                if ((ltm_prime_tab[x + 1] & 3) != 3) {
                   /* scan upwards for a prime congruent to 3 mod 4 */
                   for (y = x + 1; y < PRIME_SIZE; y++) {
                       if ((ltm_prime_tab[y] & 3) == 3) {
                          mp_set(a, ltm_prime_tab[y]);
                          return MP_OKAY;
                       }
                   }
                }
             } else {
                mp_set(a, ltm_prime_tab[x + 1]);
                return MP_OKAY;
             }
          }
      }
      /* at this point a maybe 1 */
      if (mp_cmp_d(a, 1) == MP_EQ) {
         mp_set(a, 2);
         return MP_OKAY;
      }
      /* fall through to the sieve */
   }

   /* generate a prime congruent to 3 mod 4 or 1/3 mod 4? */
   if (bbs_style == 1) {
      kstep   = 4;
   } else {
      kstep   = 2;
   }

   /* at this point we will use a combination of a sieve and Miller-Rabin */

   if (bbs_style == 1) {
      /* if a mod 4 != 3 subtract the correct value to make it so */
      if ((a->dp[0] & 3) != 3) {
         if ((err = mp_sub_d(a, (a->dp[0] & 3) + 1, a)) != MP_OKAY) { return err; };
      }
   } else {
      if (mp_iseven(a) == 1) {
         /* force odd */
         if ((err = mp_sub_d(a, 1, a)) != MP_OKAY) {
            return err;
         }
      }
   }

   /* generate the restable */
   for (x = 1; x < PRIME_SIZE; x++) {
      if ((err = mp_mod_d(a, ltm_prime_tab[x], res_tab + x)) != MP_OKAY) {
         return err;
      }
   }

   /* init temp used for Miller-Rabin Testing */
   if ((err = mp_init(&b)) != MP_OKAY) {
      return err;
   }

   for (;;) {
      /* skip to the next non-trivially divisible candidate */
      step = 0;
      do {
         /* y == 1 if any residue was zero [e.g. cannot be prime] */
         y     =  0;

         /* increase step to next candidate */
         step += kstep;

         /* compute the new residue without using division */
         for (x = 1; x < PRIME_SIZE; x++) {
             /* add the step to each residue */
             res_tab[x] += kstep;

             /* subtract the modulus [instead of using division] */
             if (res_tab[x] >= ltm_prime_tab[x]) {
                res_tab[x]  -= ltm_prime_tab[x];
             }

             /* set flag if zero */
             if (res_tab[x] == 0) {
                y = 1;
             }
         }
      } while (y == 1 && step < ((((mp_digit)1)<<DIGIT_BIT) - kstep));

      /* add the step */
      if ((err = mp_add_d(a, step, a)) != MP_OKAY) {
         goto LBL_ERR;
      }

      /* if didn't pass sieve and step == MAX then skip test */
      if (y == 1 && step >= ((((mp_digit)1)<<DIGIT_BIT) - kstep)) {
         continue;
      }

      /* is this prime? */
      for (x = 0; x < t; x++) {
          mp_set(&b, ltm_prime_tab[x]);
          if ((err = mp_prime_miller_rabin(a, &b, &res)) != MP_OKAY) {
             goto LBL_ERR;
          }
          if (res == MP_NO) {
             break;
          }
      }

      if (res == MP_YES) {
         break;
      }
   }

   err = MP_OKAY;
LBL_ERR:
   mp_clear(&b);
   return err;
}

#endif

#ifdef BN_MP_INVMOD_C

/* hac 14.61, pp608 */
int mp_invmod (mp_int * a, mp_int * b, mp_int * c)
{
  /* b cannot be negative */
  if (b->sign == MP_NEG || mp_iszero(b) == 1) {
    return MP_VAL;
  }

#ifdef BN_FAST_MP_INVMOD_C
  /* if the modulus is odd we can use a faster routine instead */
  if (mp_isodd (b) == 1) {
    return fast_mp_invmod (a, b, c);
  }
#endif

#ifdef BN_MP_INVMOD_SLOW_C
  return mp_invmod_slow(a, b, c);
#endif

  return MP_VAL;
}
#endif

#ifdef BN_MP_DIV_2_C

/* b = a/2 */
int mp_div_2(mp_int * a, mp_int * b)
{
  int     x, res, oldused;

  /* copy */
  if (b->alloc < a->used) {
    if ((res = mp_grow (b, a->used)) != MP_OKAY) {
      return res;
    }
  }

  oldused = b->used;
  b->used = a->used;
  {
    register mp_digit r, rr, *tmpa, *tmpb;

    /* source alias */
    tmpa = a->dp + b->used - 1;

    /* dest alias */
    tmpb = b->dp + b->used - 1;

    /* carry */
    r = 0;
    for (x = b->used - 1; x >= 0; x--) {
      /* get the carry for the next iteration */
      rr = *tmpa & 1;

      /* shift the current digit, add in carry and store */
      *tmpb-- = (*tmpa-- >> 1) | (r << (DIGIT_BIT - 1));

      /* forward carry to next iteration */
      r = rr;
    }

    /* zero excess digits */
    tmpb = b->dp + b->used;
    for (x = b->used; x < oldused; x++) {
      *tmpb++ = 0;
    }
  }
  b->sign = a->sign;
  mp_clamp (b);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_INIT_MULTI_C

#include <stdarg.h>

int mp_init_multi(mp_int *mp, ...) 
{
    mp_err res = MP_OKAY;      /* Assume ok until proven otherwise */
    int n = 0;                 /* Number of ok inits */
    mp_int* cur_arg = mp;
    va_list args;

    va_start(args, mp);        /* init args to next argument from caller */
    while (cur_arg != NULL) {
        if (mp_init(cur_arg) != MP_OKAY) {
            /* Oops - error! Back-track and mp_clear what we already
               succeeded in init-ing, then return error.
            */
            va_list clean_args;
            
            /* end the current list */
            va_end(args);
            
            /* now start cleaning up */            
            cur_arg = mp;
            va_start(clean_args, mp);
            while (n--) {
                mp_clear(cur_arg);
                cur_arg = va_arg(clean_args, mp_int*);
            }
            va_end(clean_args);
            res = MP_MEM;
            break;
        }
        n++;
        cur_arg = va_arg(args, mp_int*);
    }
    va_end(args);
    return res;                /* Assumed ok, if error flagged above. */
}

#endif

#ifdef BN_MP_READ_UNSIGNED_BIN_C

/* reads a unsigned char array, assumes the msb is stored first [big endian] */
int mp_read_unsigned_bin (mp_int * a, const unsigned char *b, int c)
{
  int     res;

  /* make sure there are at least two digits */
  if (a->alloc < 2) {
     if ((res = mp_grow(a, 2)) != MP_OKAY) {
        return res;
     }
  }

  /* zero the int */
  mp_zero (a);

  /* read the bytes in */
  while (c-- > 0) {
    if ((res = mp_mul_2d (a, 8, a)) != MP_OKAY) {
      return res;
    }

#ifndef MP_8BIT
      a->dp[0] |= *b++;
      a->used += 1;
#else
      a->dp[0] = (*b & MP_MASK);
      a->dp[1] |= ((*b++ >> 7U) & 1);
      a->used += 2;
#endif
  }
  mp_clamp (a);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_KARATSUBA_MUL_C

/* c = |a| * |b| using Karatsuba Multiplication using 
 * three half size multiplications
 *
 * Let B represent the radix [e.g. 2**DIGIT_BIT] and 
 * let n represent half of the number of digits in 
 * the min(a,b)
 *
 * a = a1 * B**n + a0
 * b = b1 * B**n + b0
 *
 * Then, a * b => 
   a1b1 * B**2n + ((a1 + a0)(b1 + b0) - (a0b0 + a1b1)) * B + a0b0
 *
 * Note that a1b1 and a0b0 are used twice and only need to be 
 * computed once.  So in total three half size (half # of 
 * digit) multiplications are performed, a0b0, a1b1 and 
 * (a1+b1)(a0+b0)
 *
 * Note that a multiplication of half the digits requires
 * 1/4th the number of single precision multiplications so in 
 * total after one call 25% of the single precision multiplications 
 * are saved.  Note also that the call to mp_mul can end up back 
 * in this function if the a0, a1, b0, or b1 are above the threshold.  
 * This is known as divide-and-conquer and leads to the famous 
 * O(N**lg(3)) or O(N**1.584) work which is asymptopically lower than 
 * the standard O(N**2) that the baseline/comba methods use.  
 * Generally though the overhead of this method doesn't pay off 
 * until a certain size (N ~ 80) is reached.
 */
int mp_karatsuba_mul (mp_int * a, mp_int * b, mp_int * c)
{
  mp_int  x0, x1, y0, y1, t1, x0y0, x1y1;
  int     B, err;

  /* default the return code to an error */
  err = MP_MEM;

  /* min # of digits */
  B = MIN (a->used, b->used);

  /* now divide in two */
  B = B >> 1;

  /* init copy all the temps */
  if (mp_init_size (&x0, B) != MP_OKAY)
    goto ERR;
  if (mp_init_size (&x1, a->used - B) != MP_OKAY)
    goto X0;
  if (mp_init_size (&y0, B) != MP_OKAY)
    goto X1;
  if (mp_init_size (&y1, b->used - B) != MP_OKAY)
    goto Y0;

  /* init temps */
  if (mp_init_size (&t1, B * 2) != MP_OKAY)
    goto Y1;
  if (mp_init_size (&x0y0, B * 2) != MP_OKAY)
    goto T1;
  if (mp_init_size (&x1y1, B * 2) != MP_OKAY)
    goto X0Y0;

  /* now shift the digits */
  x0.used = y0.used = B;
  x1.used = a->used - B;
  y1.used = b->used - B;

  {
    register int x;
    register mp_digit *tmpa, *tmpb, *tmpx, *tmpy;

    /* we copy the digits directly instead of using higher level functions
     * since we also need to shift the digits
     */
    tmpa = a->dp;
    tmpb = b->dp;

    tmpx = x0.dp;
    tmpy = y0.dp;
    for (x = 0; x < B; x++) {
      *tmpx++ = *tmpa++;
      *tmpy++ = *tmpb++;
    }

    tmpx = x1.dp;
    for (x = B; x < a->used; x++) {
      *tmpx++ = *tmpa++;
    }

    tmpy = y1.dp;
    for (x = B; x < b->used; x++) {
      *tmpy++ = *tmpb++;
    }
  }

  /* only need to clamp the lower words since by definition the 
   * upper words x1/y1 must have a known number of digits
   */
  mp_clamp (&x0);
  mp_clamp (&y0);

  /* now calc the products x0y0 and x1y1 */
  /* after this x0 is no longer required, free temp [x0==t2]! */
  if (mp_mul (&x0, &y0, &x0y0) != MP_OKAY)  
    goto X1Y1;          /* x0y0 = x0*y0 */
  if (mp_mul (&x1, &y1, &x1y1) != MP_OKAY)
    goto X1Y1;          /* x1y1 = x1*y1 */

  /* now calc x1+x0 and y1+y0 */
  if (s_mp_add (&x1, &x0, &t1) != MP_OKAY)
    goto X1Y1;          /* t1 = x1 - x0 */
  if (s_mp_add (&y1, &y0, &x0) != MP_OKAY)
    goto X1Y1;          /* t2 = y1 - y0 */
  if (mp_mul (&t1, &x0, &t1) != MP_OKAY)
    goto X1Y1;          /* t1 = (x1 + x0) * (y1 + y0) */

  /* add x0y0 */
  if (mp_add (&x0y0, &x1y1, &x0) != MP_OKAY)
    goto X1Y1;          /* t2 = x0y0 + x1y1 */
  if (s_mp_sub (&t1, &x0, &t1) != MP_OKAY)
    goto X1Y1;          /* t1 = (x1+x0)*(y1+y0) - (x1y1 + x0y0) */

  /* shift by B */
  if (mp_lshd (&t1, B) != MP_OKAY)
    goto X1Y1;          /* t1 = (x0y0 + x1y1 - (x1-x0)*(y1-y0))<<B */
  if (mp_lshd (&x1y1, B * 2) != MP_OKAY)
    goto X1Y1;          /* x1y1 = x1y1 << 2*B */

  if (mp_add (&x0y0, &t1, &t1) != MP_OKAY)
    goto X1Y1;          /* t1 = x0y0 + t1 */
  if (mp_add (&t1, &x1y1, c) != MP_OKAY)
    goto X1Y1;          /* t1 = x0y0 + t1 + x1y1 */

  /* Algorithm succeeded set the return code to MP_OKAY */
  err = MP_OKAY;

X1Y1:mp_clear (&x1y1);
X0Y0:mp_clear (&x0y0);
T1:mp_clear (&t1);
Y1:mp_clear (&y1);
Y0:mp_clear (&y0);
X1:mp_clear (&x1);
X0:mp_clear (&x0);
ERR:
  return err;
}
#endif

#ifdef BN_MP_MUL_2_C

/* b = a*2 */
int mp_mul_2(mp_int * a, mp_int * b)
{
  int     x, res, oldused;

  /* grow to accomodate result */
  if (b->alloc < a->used + 1) {
    if ((res = mp_grow (b, a->used + 1)) != MP_OKAY) {
      return res;
    }
  }

  oldused = b->used;
  b->used = a->used;

  {
    register mp_digit r, rr, *tmpa, *tmpb;

    /* alias for source */
    tmpa = a->dp;
    
    /* alias for dest */
    tmpb = b->dp;

    /* carry */
    r = 0;
    for (x = 0; x < a->used; x++) {
    
      /* get what will be the *next* carry bit from the 
       * MSB of the current digit 
       */
      rr = *tmpa >> ((mp_digit)(DIGIT_BIT - 1));
      
      /* now shift up this digit, add in the carry [from the previous] */
      *tmpb++ = ((*tmpa++ << ((mp_digit)1)) | r) & MP_MASK;
      
      /* copy the carry that would be from the source 
       * digit into the next iteration 
       */
      r = rr;
    }

    /* new leading digit? */
    if (r != 0) {
      /* add a MSB which is always 1 at this point */
      *tmpb = 1;
      ++(b->used);
    }

    /* now zero any excess digits on the destination 
     * that we didn't write to 
     */
    tmpb = b->dp + b->used;
    for (x = b->used; x < oldused; x++) {
      *tmpb++ = 0;
    }
  }
  b->sign = a->sign;
  return MP_OKAY;
}
#endif

#ifdef BN_MP_AND_C

/* AND two ints together */
int
mp_and (mp_int * a, mp_int * b, mp_int * c)
{
  int     res, ix, px;
  mp_int  t, *x;

  if (a->used > b->used) {
    if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
      return res;
    }
    px = b->used;
    x = b;
  } else {
    if ((res = mp_init_copy (&t, b)) != MP_OKAY) {
      return res;
    }
    px = a->used;
    x = a;
  }

  for (ix = 0; ix < px; ix++) {
    t.dp[ix] &= x->dp[ix];
  }

  /* zero digits above the last from the smallest mp_int */
  for (; ix < t.used; ix++) {
    t.dp[ix] = 0;
  }

  mp_clamp (&t);
  mp_exch (c, &t);
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_REVERSE_C

/* reverse an array, used for radix code */
void
bn_reverse (unsigned char *s, int len)
{
  int     ix, iy;
  unsigned char t;

  ix = 0;
  iy = len - 1;
  while (ix < iy) {
    t     = s[ix];
    s[ix] = s[iy];
    s[iy] = t;
    ++ix;
    --iy;
  }
}
#endif

#ifdef BN_MP_PRIME_RABIN_MILLER_TRIALS_C

static const struct {
   int k, t;
} sizes[] = {
{   128,    28 },
{   256,    16 },
{   384,    10 },
{   512,     7 },
{   640,     6 },
{   768,     5 },
{   896,     4 },
{  1024,     4 }
};

/* returns # of RM trials required for a given bit size */
int mp_prime_rabin_miller_trials(int size)
{
   int x;

   for (x = 0; x < (int)(sizeof(sizes)/(sizeof(sizes[0]))); x++) {
       if (sizes[x].k == size) {
          return sizes[x].t;
       } else if (sizes[x].k > size) {
          return (x == 0) ? sizes[0].t : sizes[x - 1].t;
       }
   }
   return sizes[x-1].t + 1;
}


#endif

#ifdef BN_MP_INIT_COPY_C

/* creates "a" then copies b into it */
int mp_init_copy (mp_int * a, mp_int * b)
{
  int     res;

  if ((res = mp_init (a)) != MP_OKAY) {
    return res;
  }
  return mp_copy (b, a);
}
#endif

#ifdef BN_FAST_MP_MONTGOMERY_REDUCE_C

/* computes xR**-1 == x (mod N) via Montgomery Reduction
 *
 * This is an optimized implementation of montgomery_reduce
 * which uses the comba method to quickly calculate the columns of the
 * reduction.
 *
 * Based on Algorithm 14.32 on pp.601 of HAC.
*/
int fast_mp_montgomery_reduce (mp_int * x, mp_int * n, mp_digit rho)
{
  int     ix, res, olduse;
	mp_word W[MP_WARRAY] = {};

  /* get old used count */
  olduse = x->used;

  /* grow a as required */
  if (x->alloc < n->used + 1) {
    if ((res = mp_grow (x, n->used + 1)) != MP_OKAY) {
      return res;
    }
  }

  /* first we have to get the digits of the input into
   * an array of double precision words W[...]
   */
  {
    register mp_word *_W;
    register mp_digit *tmpx;

    /* alias for the W[] array */
    _W   = W;

    /* alias for the digits of  x*/
    tmpx = x->dp;

    /* copy the digits of a into W[0..a->used-1] */
    for (ix = 0; ix < x->used; ix++) {
      *_W++ = *tmpx++;
    }

    /* zero the high words of W[a->used..m->used*2] */
    for (; ix < n->used * 2 + 1; ix++) {
      *_W++ = 0;
    }
  }

  /* now we proceed to zero successive digits
   * from the least significant upwards
   */
  for (ix = 0; ix < n->used; ix++) {
    /* mu = ai * m' mod b
     *
     * We avoid a double precision multiplication (which isn't required)
     * by casting the value down to a mp_digit.  Note this requires
     * that W[ix-1] have  the carry cleared (see after the inner loop)
     */
    register mp_digit mu;
    mu = (mp_digit) (((W[ix] & MP_MASK) * rho) & MP_MASK);

    /* a = a + mu * m * b**i
     *
     * This is computed in place and on the fly.  The multiplication
     * by b**i is handled by offseting which columns the results
     * are added to.
     *
     * Note the comba method normally doesn't handle carries in the
     * inner loop In this case we fix the carry from the previous
     * column since the Montgomery reduction requires digits of the
     * result (so far) [see above] to work.  This is
     * handled by fixing up one carry after the inner loop.  The
     * carry fixups are done in order so after these loops the
     * first m->used words of W[] have the carries fixed
     */
    {
      register int iy;
      register mp_digit *tmpn;
      register mp_word *_W;

      /* alias for the digits of the modulus */
      tmpn = n->dp;

      /* Alias for the columns set by an offset of ix */
      _W = W + ix;

      /* inner loop */
      for (iy = 0; iy < n->used; iy++) {
          *_W++ += ((mp_word)mu) * ((mp_word)*tmpn++);
      }
    }

    /* now fix carry for next digit, W[ix+1] */
    W[ix + 1] += W[ix] >> ((mp_word) DIGIT_BIT);
  }

  /* now we have to propagate the carries and
   * shift the words downward [all those least
   * significant digits we zeroed].
   */
  {
    register mp_digit *tmpx;
    register mp_word *_W, *_W1;

    /* nox fix rest of carries */

    /* alias for current word */
    _W1 = W + ix;

    /* alias for next word, where the carry goes */
    _W = W + ++ix;

    for (; ix <= n->used * 2 + 1; ix++) {
      *_W++ += *_W1++ >> ((mp_word) DIGIT_BIT);
    }

    /* copy out, A = A/b**n
     *
     * The result is A/b**n but instead of converting from an
     * array of mp_word to mp_digit than calling mp_rshd
     * we just copy them in the right order
     */

    /* alias for destination word */
    tmpx = x->dp;

    /* alias for shifted double precision result */
    _W = W + n->used;

    for (ix = 0; ix < n->used + 1; ix++) {
      *tmpx++ = (mp_digit)(*_W++ & ((mp_word) MP_MASK));
    }

    /* zero oldused digits, if the input a was larger than
     * m->used+1 we'll have to clear the digits
     */
    for (; ix < olduse; ix++) {
      *tmpx++ = 0;
    }
  }

  /* set the max used and clamp */
  x->used = n->used + 1;
  mp_clamp (x);

  /* if A >= m then A = A - m */
  if (mp_cmp_mag (x, n) != MP_LT) {
    return s_mp_sub (x, n, x);
  }
  return MP_OKAY;
}
#endif

#ifdef BN_MP_LSHD_C

/* shift left a certain amount of digits */
int mp_lshd (mp_int * a, int b)
{
  int     x, res;

  /* if its less than zero return */
  if (b <= 0) {
    return MP_OKAY;
  }

  /* grow to fit the new digits */
  if (a->alloc < a->used + b) {
     if ((res = mp_grow (a, a->used + b)) != MP_OKAY) {
       return res;
     }
  }

  {
    register mp_digit *top, *bottom;

    /* increment the used by the shift amount then copy upwards */
    a->used += b;

    /* top */
    top = a->dp + a->used - 1;

    /* base */
    bottom = a->dp + a->used - 1 - b;

    /* much like mp_rshd this is implemented using a sliding window
     * except the window goes the otherway around.  Copying from
     * the bottom to the top.  see bn_mp_rshd.c for more info.
     */
    for (x = a->used - 1; x >= b; x--) {
      *top-- = *bottom--;
    }

    /* zero the lower digits */
    top = a->dp;
    for (x = 0; x < b; x++) {
      *top++ = 0;
    }
  }
  return MP_OKAY;
}
#endif

#ifdef BN_MP_CMP_C

/* compare two ints (signed)*/
int
mp_cmp (mp_int * a, mp_int * b)
{
  /* compare based on sign */
  if (a->sign != b->sign) {
     if (a->sign == MP_NEG) {
        return MP_LT;
     } else {
        return MP_GT;
     }
  }
  
  /* compare digits */
  if (a->sign == MP_NEG) {
     /* if negative compare opposite direction */
     return mp_cmp_mag(b, a);
  } else {
     return mp_cmp_mag(a, b);
  }
}
#endif

#ifdef BN_MP_COUNT_BITS_C

/* returns the number of bits in an int */
int
mp_count_bits (mp_int * a)
{
  int     r;
  mp_digit q;

  /* shortcut */
  if (a->used == 0) {
    return 0;
  }

  /* get number of digits and add that */
  r = (a->used - 1) * DIGIT_BIT;
  
  /* take the last digit and count the bits in it */
  q = a->dp[a->used - 1];
  while (q > ((mp_digit) 0)) {
    ++r;
    q >>= ((mp_digit) 1);
  }
  return r;
}
#endif

#ifdef BN_MP_OR_C

/* OR two ints together */
int mp_or (mp_int * a, mp_int * b, mp_int * c)
{
  int     res, ix, px;
  mp_int  t, *x;

  if (a->used > b->used) {
    if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
      return res;
    }
    px = b->used;
    x = b;
  } else {
    if ((res = mp_init_copy (&t, b)) != MP_OKAY) {
      return res;
    }
    px = a->used;
    x = a;
  }

  for (ix = 0; ix < px; ix++) {
    t.dp[ix] |= x->dp[ix];
  }
  mp_clamp (&t);
  mp_exch (c, &t);
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_EXTEUCLID_C

/* Extended euclidean algorithm of (a, b) produces 
   a*u1 + b*u2 = u3
 */
int mp_exteuclid(mp_int *a, mp_int *b, mp_int *U1, mp_int *U2, mp_int *U3)
{
   mp_int u1,u2,u3,v1,v2,v3,t1,t2,t3,q,tmp;
   int err;

   if ((err = mp_init_multi(&u1, &u2, &u3, &v1, &v2, &v3, &t1, &t2, &t3, &q, &tmp, NULL)) != MP_OKAY) {
      return err;
   }

   /* initialize, (u1,u2,u3) = (1,0,a) */
   mp_set(&u1, 1);
   if ((err = mp_copy(a, &u3)) != MP_OKAY)                                        { goto _ERR; }

   /* initialize, (v1,v2,v3) = (0,1,b) */
   mp_set(&v2, 1);
   if ((err = mp_copy(b, &v3)) != MP_OKAY)                                        { goto _ERR; }

   /* loop while v3 != 0 */
   while (mp_iszero(&v3) == MP_NO) {
       /* q = u3/v3 */
       if ((err = mp_div(&u3, &v3, &q, NULL)) != MP_OKAY)                         { goto _ERR; }

       /* (t1,t2,t3) = (u1,u2,u3) - (v1,v2,v3)q */
       if ((err = mp_mul(&v1, &q, &tmp)) != MP_OKAY)                              { goto _ERR; }
       if ((err = mp_sub(&u1, &tmp, &t1)) != MP_OKAY)                             { goto _ERR; }
       if ((err = mp_mul(&v2, &q, &tmp)) != MP_OKAY)                              { goto _ERR; }
       if ((err = mp_sub(&u2, &tmp, &t2)) != MP_OKAY)                             { goto _ERR; }
       if ((err = mp_mul(&v3, &q, &tmp)) != MP_OKAY)                              { goto _ERR; }
       if ((err = mp_sub(&u3, &tmp, &t3)) != MP_OKAY)                             { goto _ERR; }

       /* (u1,u2,u3) = (v1,v2,v3) */
       if ((err = mp_copy(&v1, &u1)) != MP_OKAY)                                  { goto _ERR; }
       if ((err = mp_copy(&v2, &u2)) != MP_OKAY)                                  { goto _ERR; }
       if ((err = mp_copy(&v3, &u3)) != MP_OKAY)                                  { goto _ERR; }

       /* (v1,v2,v3) = (t1,t2,t3) */
       if ((err = mp_copy(&t1, &v1)) != MP_OKAY)                                  { goto _ERR; }
       if ((err = mp_copy(&t2, &v2)) != MP_OKAY)                                  { goto _ERR; }
       if ((err = mp_copy(&t3, &v3)) != MP_OKAY)                                  { goto _ERR; }
   }

   /* make sure U3 >= 0 */
   if (u3.sign == MP_NEG) {
      mp_neg(&u1, &u1);
      mp_neg(&u2, &u2);
      mp_neg(&u3, &u3);
   }

   /* copy result out */
   if (U1 != NULL) { mp_exch(U1, &u1); }
   if (U2 != NULL) { mp_exch(U2, &u2); }
   if (U3 != NULL) { mp_exch(U3, &u3); }

   err = MP_OKAY;
_ERR: mp_clear_multi(&u1, &u2, &u3, &v1, &v2, &v3, &t1, &t2, &t3, &q, &tmp, NULL);
   return err;
}
#endif

#ifdef BN_MP_PRIME_RANDOM_EX_C

/* makes a truly random prime of a given size (bits),
 *
 * Flags are as follows:
 * 
 *   LTM_PRIME_BBS      - make prime congruent to 3 mod 4
 *   LTM_PRIME_SAFE     - make sure (p-1)/2 is prime as well (implies LTM_PRIME_BBS)
 *   LTM_PRIME_2MSB_OFF - make the 2nd highest bit zero
 *   LTM_PRIME_2MSB_ON  - make the 2nd highest bit one
 *
 * You have to supply a callback which fills in a buffer with random bytes.  "dat" is a parameter you can
 * have passed to the callback (e.g. a state or something).  This function doesn't use "dat" itself
 * so it can be NULL
 *
 */

/* This is possibly the mother of all prime generation functions, muahahahahaha! */
int mp_prime_random_ex(mp_int *a, int t, int size, int flags, ltm_prime_callback cb, void *dat)
{
   unsigned char *tmp, maskAND, maskOR_msb, maskOR_lsb;
   int res, err, bsize, maskOR_msb_offset;

   /* sanity check the input */
   if (size <= 1 || t <= 0) {
      return MP_VAL;
   }

   /* LTM_PRIME_SAFE implies LTM_PRIME_BBS */
   if (flags & LTM_PRIME_SAFE) {
      flags |= LTM_PRIME_BBS;
   }

   /* calc the byte size */
   bsize = (size>>3) + ((size&7)?1:0);

   /* we need a buffer of bsize bytes */
   tmp = OPT_CAST(unsigned char) XMALLOC(bsize);
   if (tmp == NULL) {
      return MP_MEM;
   }

   /* calc the maskAND value for the MSbyte*/
   maskAND = ((size&7) == 0) ? 0xFF : (0xFF >> (8 - (size & 7)));

   /* calc the maskOR_msb */
   maskOR_msb        = 0;
   maskOR_msb_offset = ((size & 7) == 1) ? 1 : 0;
   if (flags & LTM_PRIME_2MSB_ON) {
      maskOR_msb       |= 0x80 >> ((9 - size) & 7);
   }  

   /* get the maskOR_lsb */
   maskOR_lsb         = 1;
   if (flags & LTM_PRIME_BBS) {
      maskOR_lsb     |= 3;
   }

   do {
      /* read the bytes */
      if (cb(tmp, bsize, dat) != bsize) {
         err = MP_VAL;
         goto error;
      }
 
      /* work over the MSbyte */
      tmp[0]    &= maskAND;
      tmp[0]    |= 1 << ((size - 1) & 7);

      /* mix in the maskORs */
      tmp[maskOR_msb_offset]   |= maskOR_msb;
      tmp[bsize-1]             |= maskOR_lsb;

      /* read it in */
      if ((err = mp_read_unsigned_bin(a, tmp, bsize)) != MP_OKAY)     { goto error; }

      /* is it prime? */
      if ((err = mp_prime_is_prime(a, t, &res)) != MP_OKAY)           { goto error; }
      if (res == MP_NO) {  
         continue;
      }

      if (flags & LTM_PRIME_SAFE) {
         /* see if (a-1)/2 is prime */
         if ((err = mp_sub_d(a, 1, a)) != MP_OKAY)                    { goto error; }
         if ((err = mp_div_2(a, a)) != MP_OKAY)                       { goto error; }
 
         /* is it prime? */
         if ((err = mp_prime_is_prime(a, t, &res)) != MP_OKAY)        { goto error; }
      }
   } while (res == MP_NO);

   if (flags & LTM_PRIME_SAFE) {
      /* restore a to the original value */
      if ((err = mp_mul_2(a, a)) != MP_OKAY)                          { goto error; }
      if ((err = mp_add_d(a, 1, a)) != MP_OKAY)                       { goto error; }
   }

   err = MP_OKAY;
error:
   XFREE(tmp);
   return err;
}


#endif

#ifdef BN_MP_JACOBI_C

/* computes the jacobi c = (a | n) (or Legendre if n is prime)
 * HAC pp. 73 Algorithm 2.149
 */
int mp_jacobi (mp_int * a, mp_int * p, int *c)
{
  mp_int  a1, p1;
  int     k, s, r, res;
  mp_digit residue;

  /* if p <= 0 return MP_VAL */
  if (mp_cmp_d(p, 0) != MP_GT) {
     return MP_VAL;
  }

  /* step 1.  if a == 0, return 0 */
  if (mp_iszero (a) == 1) {
    *c = 0;
    return MP_OKAY;
  }

  /* step 2.  if a == 1, return 1 */
  if (mp_cmp_d (a, 1) == MP_EQ) {
    *c = 1;
    return MP_OKAY;
  }

  /* default */
  s = 0;

  /* step 3.  write a = a1 * 2**k  */
  if ((res = mp_init_copy (&a1, a)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_init (&p1)) != MP_OKAY) {
    goto LBL_A1;
  }

  /* divide out larger power of two */
  k = mp_cnt_lsb(&a1);
  if ((res = mp_div_2d(&a1, k, &a1, NULL)) != MP_OKAY) {
     goto LBL_P1;
  }

  /* step 4.  if e is even set s=1 */
  if ((k & 1) == 0) {
    s = 1;
  } else {
    /* else set s=1 if p = 1/7 (mod 8) or s=-1 if p = 3/5 (mod 8) */
    residue = p->dp[0] & 7;

    if (residue == 1 || residue == 7) {
      s = 1;
    } else if (residue == 3 || residue == 5) {
      s = -1;
    }
  }

  /* step 5.  if p == 3 (mod 4) *and* a1 == 3 (mod 4) then s = -s */
  if ( ((p->dp[0] & 3) == 3) && ((a1.dp[0] & 3) == 3)) {
    s = -s;
  }

  /* if a1 == 1 we're done */
  if (mp_cmp_d (&a1, 1) == MP_EQ) {
    *c = s;
  } else {
    /* n1 = n mod a1 */
    if ((res = mp_mod (p, &a1, &p1)) != MP_OKAY) {
      goto LBL_P1;
    }
    if ((res = mp_jacobi (&p1, &a1, &r)) != MP_OKAY) {
      goto LBL_P1;
    }
    *c = s * r;
  }

  /* done */
  res = MP_OKAY;
LBL_P1:mp_clear (&p1);
LBL_A1:mp_clear (&a1);
  return res;
}
#endif

#ifdef BN_MP_RADIX_SIZE_C

/* returns size of ASCII reprensentation */
int mp_radix_size (mp_int * a, int radix, int *size)
{
  int     res, digs;
  mp_int  t;
  mp_digit d;

  *size = 0;

  /* special case for binary */
  if (radix == 2) {
    *size = mp_count_bits (a) + (a->sign == MP_NEG ? 1 : 0) + 1;
    return MP_OKAY;
  }

  /* make sure the radix is in range */
  if (radix < 2 || radix > 64) {
    return MP_VAL;
  }

  if (mp_iszero(a) == MP_YES) {
    *size = 2;
    return MP_OKAY;
  }

  /* digs is the digit count */
  digs = 0;

  /* if it's negative add one for the sign */
  if (a->sign == MP_NEG) {
    ++digs;
  }

  /* init a copy of the input */
  if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
    return res;
  }

  /* force temp to positive */
  t.sign = MP_ZPOS; 

  /* fetch out all of the digits */
  while (mp_iszero (&t) == MP_NO) {
    if ((res = mp_div_d (&t, (mp_digit) radix, &t, &d)) != MP_OKAY) {
      mp_clear (&t);
      return res;
    }
    ++digs;
  }
  mp_clear (&t);

  /* return digs + 1, the 1 is for the NULL byte that would be required. */
  *size = digs + 1;
  return MP_OKAY;
}

#endif

#ifdef BN_MP_RSHD_C

/* shift right a certain amount of digits */
void mp_rshd (mp_int * a, int b)
{
  int     x;

  /* if b <= 0 then ignore it */
  if (b <= 0) {
    return;
  }

  /* if b > used then simply zero it and return */
  if (a->used <= b) {
    mp_zero (a);
    return;
  }

  {
    register mp_digit *bottom, *top;

    /* shift the digits down */

    /* bottom */
    bottom = a->dp;

    /* top [offset into digits] */
    top = a->dp + b;

    /* this is implemented as a sliding window where 
     * the window is b-digits long and digits from 
     * the top of the window are copied to the bottom
     *
     * e.g.

     b-2 | b-1 | b0 | b1 | b2 | ... | bb |   ---->
                 /\                   |      ---->
                  \-------------------/      ---->
     */
    for (x = 0; x < (a->used - b); x++) {
      *bottom++ = *top++;
    }

    /* zero the top digits */
    for (; x < a->used; x++) {
      *bottom++ = 0;
    }
  }
  
  /* remove excess digits */
  a->used -= b;
}
#endif

#ifdef BN_MP_MUL_D_C

/* multiply by a digit */
int
mp_mul_d (mp_int * a, mp_digit b, mp_int * c)
{
  mp_digit u, *tmpa, *tmpc;
  mp_word  r;
  int      ix, res, olduse;

  /* make sure c is big enough to hold a*b */
  if (c->alloc < a->used + 1) {
    if ((res = mp_grow (c, a->used + 1)) != MP_OKAY) {
      return res;
    }
  }

  /* get the original destinations used count */
  olduse = c->used;

  /* set the sign */
  c->sign = a->sign;

  /* alias for a->dp [source] */
  tmpa = a->dp;

  /* alias for c->dp [dest] */
  tmpc = c->dp;

  /* zero carry */
  u = 0;

  /* compute columns */
  for (ix = 0; ix < a->used; ix++) {
    /* compute product and carry sum for this term */
    r       = ((mp_word) u) + ((mp_word)*tmpa++) * ((mp_word)b);

    /* mask off higher bits to get a single digit */
    *tmpc++ = (mp_digit) (r & ((mp_word) MP_MASK));

    /* send carry into next iteration */
    u       = (mp_digit) (r >> ((mp_word) DIGIT_BIT));
  }

  /* store final carry [if any] and increment ix offset  */
  *tmpc++ = u;
  ++ix;

  /* now zero digits above the top */
  while (ix++ < olduse) {
     *tmpc++ = 0;
  }

  /* set used count */
  c->used = a->used + 1;
  mp_clamp(c);

  return MP_OKAY;
}
#endif

#ifdef BN_MP_MONTGOMERY_REDUCE_C

/* computes xR**-1 == x (mod N) via Montgomery Reduction */
int
mp_montgomery_reduce (mp_int * x, mp_int * n, mp_digit rho)
{
  int     ix, res, digs;
  mp_digit mu;

  /* can the fast reduction [comba] method be used?
   *
   * Note that unlike in mul you're safely allowed *less*
   * than the available columns [255 per default] since carries
   * are fixed up in the inner loop.
   */
  digs = n->used * 2 + 1;
  if ((digs < MP_WARRAY) &&
      n->used <
      (1 << ((CHAR_BIT * sizeof (mp_word)) - (2 * DIGIT_BIT)))) {
    return fast_mp_montgomery_reduce (x, n, rho);
  }

  /* grow the input as required */
  if (x->alloc < digs) {
    if ((res = mp_grow (x, digs)) != MP_OKAY) {
      return res;
    }
  }
  x->used = digs;

  for (ix = 0; ix < n->used; ix++) {
    /* mu = ai * rho mod b
     *
     * The value of rho must be precalculated via
     * montgomery_setup() such that
     * it equals -1/n0 mod b this allows the
     * following inner loop to reduce the
     * input one digit at a time
     */
    mu = (mp_digit) (((mp_word)x->dp[ix]) * ((mp_word)rho) & MP_MASK);

    /* a = a + mu * m * b**i */
    {
      register int iy;
      register mp_digit *tmpn, *tmpx, u;
      register mp_word r;

      /* alias for digits of the modulus */
      tmpn = n->dp;

      /* alias for the digits of x [the input] */
      tmpx = x->dp + ix;

      /* set the carry to zero */
      u = 0;

      /* Multiply and add in place */
      for (iy = 0; iy < n->used; iy++) {
        /* compute product and sum */
        r       = ((mp_word)mu) * ((mp_word)*tmpn++) +
                  ((mp_word) u) + ((mp_word) * tmpx);

        /* get carry */
        u       = (mp_digit)(r >> ((mp_word) DIGIT_BIT));

        /* fix digit */
        *tmpx++ = (mp_digit)(r & ((mp_word) MP_MASK));
      }
      /* At this point the ix'th digit of x should be zero */


      /* propagate carries upwards as required*/
      while (u) {
        *tmpx   += u;
        u        = *tmpx >> DIGIT_BIT;
        *tmpx++ &= MP_MASK;
      }
    }
  }

  /* at this point the n.used'th least
   * significant digits of x are all zero
   * which means we can shift x to the
   * right by n.used digits and the
   * residue is unchanged.
   */

  /* x = x/b**n.used */
  mp_clamp(x);
  mp_rshd (x, n->used);

  /* if x >= n then x = x - n */
  if (mp_cmp_mag (x, n) != MP_LT) {
    return s_mp_sub (x, n, x);
  }

  return MP_OKAY;
}
#endif

#ifdef BN_S_MP_EXPTMOD_C

#ifdef MP_LOW_MEM
   #define TAB_SIZE 32
#else
   #define TAB_SIZE 256
#endif

int s_mp_exptmod (mp_int * G, mp_int * X, mp_int * P, mp_int * Y, int redmode)
{
  mp_int  M[TAB_SIZE], res, mu;
  mp_digit buf;
  int     err, bitbuf, bitcpy, bitcnt, mode, digidx, x, y, winsize;
  int (*redux)(mp_int*,mp_int*,mp_int*);

  /* find window size */
  x = mp_count_bits (X);
  if (x <= 7) {
    winsize = 2;
  } else if (x <= 36) {
    winsize = 3;
  } else if (x <= 140) {
    winsize = 4;
  } else if (x <= 450) {
    winsize = 5;
  } else if (x <= 1303) {
    winsize = 6;
  } else if (x <= 3529) {
    winsize = 7;
  } else {
    winsize = 8;
  }

#ifdef MP_LOW_MEM
    if (winsize > 5) {
       winsize = 5;
    }
#endif

  /* init M array */
  /* init first cell */
  if ((err = mp_init(&M[1])) != MP_OKAY) {
     return err; 
  }

  /* now init the second half of the array */
  for (x = 1<<(winsize-1); x < (1 << winsize); x++) {
    if ((err = mp_init(&M[x])) != MP_OKAY) {
      for (y = 1<<(winsize-1); y < x; y++) {
        mp_clear (&M[y]);
      }
      mp_clear(&M[1]);
      return err;
    }
  }

  /* create mu, used for Barrett reduction */
  if ((err = mp_init (&mu)) != MP_OKAY) {
    goto LBL_M;
  }
  
  if (redmode == 0) {
     if ((err = mp_reduce_setup (&mu, P)) != MP_OKAY) {
        goto LBL_MU;
     }
     redux = mp_reduce;
  } else {
     if ((err = mp_reduce_2k_setup_l (P, &mu)) != MP_OKAY) {
        goto LBL_MU;
     }
     redux = mp_reduce_2k_l;
  }    

  /* create M table
   *
   * The M table contains powers of the base, 
   * e.g. M[x] = G**x mod P
   *
   * The first half of the table is not 
   * computed though accept for M[0] and M[1]
   */
  if ((err = mp_mod (G, P, &M[1])) != MP_OKAY) {
    goto LBL_MU;
  }

  /* compute the value at M[1<<(winsize-1)] by squaring 
   * M[1] (winsize-1) times 
   */
  if ((err = mp_copy (&M[1], &M[1 << (winsize - 1)])) != MP_OKAY) {
    goto LBL_MU;
  }

  for (x = 0; x < (winsize - 1); x++) {
    /* square it */
    if ((err = mp_sqr (&M[1 << (winsize - 1)], 
                       &M[1 << (winsize - 1)])) != MP_OKAY) {
      goto LBL_MU;
    }

    /* reduce modulo P */
    if ((err = redux (&M[1 << (winsize - 1)], P, &mu)) != MP_OKAY) {
      goto LBL_MU;
    }
  }

  /* create upper table, that is M[x] = M[x-1] * M[1] (mod P)
   * for x = (2**(winsize - 1) + 1) to (2**winsize - 1)
   */
  for (x = (1 << (winsize - 1)) + 1; x < (1 << winsize); x++) {
    if ((err = mp_mul (&M[x - 1], &M[1], &M[x])) != MP_OKAY) {
      goto LBL_MU;
    }
    if ((err = redux (&M[x], P, &mu)) != MP_OKAY) {
      goto LBL_MU;
    }
  }

  /* setup result */
  if ((err = mp_init (&res)) != MP_OKAY) {
    goto LBL_MU;
  }
  mp_set (&res, 1);

  /* set initial mode and bit cnt */
  mode   = 0;
  bitcnt = 1;
  buf    = 0;
  digidx = X->used - 1;
  bitcpy = 0;
  bitbuf = 0;

  for (;;) {
    /* grab next digit as required */
    if (--bitcnt == 0) {
      /* if digidx == -1 we are out of digits */
      if (digidx == -1) {
        break;
      }
      /* read next digit and reset the bitcnt */
      buf    = X->dp[digidx--];
      bitcnt = (int) DIGIT_BIT;
    }

    /* grab the next msb from the exponent */
    y     = (buf >> (mp_digit)(DIGIT_BIT - 1)) & 1;
    buf <<= (mp_digit)1;

    /* if the bit is zero and mode == 0 then we ignore it
     * These represent the leading zero bits before the first 1 bit
     * in the exponent.  Technically this opt is not required but it
     * does lower the # of trivial squaring/reductions used
     */
    if (mode == 0 && y == 0) {
      continue;
    }

    /* if the bit is zero and mode == 1 then we square */
    if (mode == 1 && y == 0) {
      if ((err = mp_sqr (&res, &res)) != MP_OKAY) {
        goto LBL_RES;
      }
      if ((err = redux (&res, P, &mu)) != MP_OKAY) {
        goto LBL_RES;
      }
      continue;
    }

    /* else we add it to the window */
    bitbuf |= (y << (winsize - ++bitcpy));
    mode    = 2;

    if (bitcpy == winsize) {
      /* ok window is filled so square as required and multiply  */
      /* square first */
      for (x = 0; x < winsize; x++) {
        if ((err = mp_sqr (&res, &res)) != MP_OKAY) {
          goto LBL_RES;
        }
        if ((err = redux (&res, P, &mu)) != MP_OKAY) {
          goto LBL_RES;
        }
      }

      /* then multiply */
      if ((err = mp_mul (&res, &M[bitbuf], &res)) != MP_OKAY) {
        goto LBL_RES;
      }
      if ((err = redux (&res, P, &mu)) != MP_OKAY) {
        goto LBL_RES;
      }

      /* empty window and reset */
      bitcpy = 0;
      bitbuf = 0;
      mode   = 1;
    }
  }

  /* if bits remain then square/multiply */
  if (mode == 2 && bitcpy > 0) {
    /* square then multiply if the bit is set */
    for (x = 0; x < bitcpy; x++) {
      if ((err = mp_sqr (&res, &res)) != MP_OKAY) {
        goto LBL_RES;
      }
      if ((err = redux (&res, P, &mu)) != MP_OKAY) {
        goto LBL_RES;
      }

      bitbuf <<= 1;
      if ((bitbuf & (1 << winsize)) != 0) {
        /* then multiply */
        if ((err = mp_mul (&res, &M[1], &res)) != MP_OKAY) {
          goto LBL_RES;
        }
        if ((err = redux (&res, P, &mu)) != MP_OKAY) {
          goto LBL_RES;
        }
      }
    }
  }

  mp_exch (&res, Y);
  err = MP_OKAY;
LBL_RES:mp_clear (&res);
LBL_MU:mp_clear (&mu);
LBL_M:
  mp_clear(&M[1]);
  for (x = 1<<(winsize-1); x < (1 << winsize); x++) {
    mp_clear (&M[x]);
  }
  return err;
}
#endif

#ifdef BN_MP_SUB_D_C

/* single digit subtraction */
int
mp_sub_d (mp_int * a, mp_digit b, mp_int * c)
{
  mp_digit *tmpa, *tmpc, mu;
  int       res, ix, oldused;

  /* grow c as required */
  if (c->alloc < a->used + 1) {
     if ((res = mp_grow(c, a->used + 1)) != MP_OKAY) {
        return res;
     }
  }

  /* if a is negative just do an unsigned
   * addition [with fudged signs]
   */
  if (a->sign == MP_NEG) {
     a->sign = MP_ZPOS;
     res     = mp_add_d(a, b, c);
     a->sign = c->sign = MP_NEG;

     /* clamp */
     mp_clamp(c);

     return res;
  }

  /* setup regs */
  oldused = c->used;
  tmpa    = a->dp;
  tmpc    = c->dp;

  /* if a <= b simply fix the single digit */
  if ((a->used == 1 && a->dp[0] <= b) || a->used == 0) {
     if (a->used == 1) {
        *tmpc++ = b - *tmpa;
     } else {
        *tmpc++ = b;
     }
     ix      = 1;

     /* negative/1digit */
     c->sign = MP_NEG;
     c->used = 1;
  } else {
     /* positive/size */
     c->sign = MP_ZPOS;
     c->used = a->used;

     /* subtract first digit */
     *tmpc    = *tmpa++ - b;
     mu       = *tmpc >> (sizeof(mp_digit) * CHAR_BIT - 1);
     *tmpc++ &= MP_MASK;

     /* handle rest of the digits */
     for (ix = 1; ix < a->used; ix++) {
        *tmpc    = *tmpa++ - mu;
        mu       = *tmpc >> (sizeof(mp_digit) * CHAR_BIT - 1);
        *tmpc++ &= MP_MASK;
     }
  }

  /* zero excess digits */
  while (ix++ < oldused) {
     *tmpc++ = 0;
  }
  mp_clamp(c);
  return MP_OKAY;
}

#endif

#ifdef BN_MP_DIV_2D_C

/* shift right by a certain bit count (store quotient in c, optional remainder in d) */
int mp_div_2d (mp_int * a, int b, mp_int * c, mp_int * d)
{
  mp_digit D, r, rr;
  int     x, res;
  mp_int  t;


  /* if the shift count is <= 0 then we do no work */
  if (b <= 0) {
    res = mp_copy (a, c);
    if (d != NULL) {
      mp_zero (d);
    }
    return res;
  }

  if ((res = mp_init (&t)) != MP_OKAY) {
    return res;
  }

  /* get the remainder */
  if (d != NULL) {
    if ((res = mp_mod_2d (a, b, &t)) != MP_OKAY) {
      mp_clear (&t);
      return res;
    }
  }

  /* copy */
  if ((res = mp_copy (a, c)) != MP_OKAY) {
    mp_clear (&t);
    return res;
  }

  /* shift by as many digits in the bit count */
  if (b >= (int)DIGIT_BIT) {
    mp_rshd (c, b / DIGIT_BIT);
  }

  /* shift any bit count < DIGIT_BIT */
  D = (mp_digit) (b % DIGIT_BIT);
  if (D != 0) {
    register mp_digit *tmpc, mask, shift;

    /* mask */
    mask = (((mp_digit)1) << D) - 1;

    /* shift for lsb */
    shift = DIGIT_BIT - D;

    /* alias */
    tmpc = c->dp + (c->used - 1);

    /* carry */
    r = 0;
    for (x = c->used - 1; x >= 0; x--) {
      /* get the lower  bits of this word in a temp */
      rr = *tmpc & mask;

      /* shift the current word and mix in the carry bits from the previous word */
      *tmpc = (*tmpc >> D) | (r << shift);
      --tmpc;

      /* set the carry to the carry bits of the current word found above */
      r = rr;
    }
  }
  mp_clamp (c);
  if (d != NULL) {
    mp_exch (&t, d);
  }
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_ADD_D_C

/* single digit addition */
int
mp_add_d (mp_int * a, mp_digit b, mp_int * c)
{
  int     res, ix, oldused;
  mp_digit *tmpa, *tmpc, mu;

  /* grow c as required */
  if (c->alloc < a->used + 1) {
     if ((res = mp_grow(c, a->used + 1)) != MP_OKAY) {
        return res;
     }
  }

  /* if a is negative and |a| >= b, call c = |a| - b */
  if (a->sign == MP_NEG && (a->used > 1 || a->dp[0] >= b)) {
     /* temporarily fix sign of a */
     a->sign = MP_ZPOS;

     /* c = |a| - b */
     res = mp_sub_d(a, b, c);

     /* fix sign  */
     a->sign = c->sign = MP_NEG;

     /* clamp */
     mp_clamp(c);

     return res;
  }

  /* old number of used digits in c */
  oldused = c->used;

  /* sign always positive */
  c->sign = MP_ZPOS;

  /* source alias */
  tmpa    = a->dp;

  /* destination alias */
  tmpc    = c->dp;

  /* if a is positive */
  if (a->sign == MP_ZPOS) {
     /* add digit, after this we're propagating
      * the carry.
      */
     *tmpc   = *tmpa++ + b;
     mu      = *tmpc >> DIGIT_BIT;
     *tmpc++ &= MP_MASK;

     /* now handle rest of the digits */
     for (ix = 1; ix < a->used; ix++) {
        *tmpc   = *tmpa++ + mu;
        mu      = *tmpc >> DIGIT_BIT;
        *tmpc++ &= MP_MASK;
     }
     /* set final carry */
     ix++;
     *tmpc++  = mu;

     /* setup size */
     c->used = a->used + 1;
  } else {
     /* a was negative and |a| < b */
     c->used  = 1;

     /* the result is a single digit */
     if (a->used == 1) {
        *tmpc++  =  b - a->dp[0];
     } else {
        *tmpc++  =  b;
     }

     /* setup count so the clearing of oldused
      * can fall through correctly
      */
     ix       = 1;
  }

  /* now zero to oldused */
  while (ix++ < oldused) {
     *tmpc++ = 0;
  }
  mp_clamp(c);

  return MP_OKAY;
}

#endif

#ifdef BN_MP_SQR_C

/* computes b = a*a */
int
mp_sqr (mp_int * a, mp_int * b)
{
  int     res;

#ifdef BN_MP_TOOM_SQR_C
  /* use Toom-Cook? */
  if (a->used >= TOOM_SQR_CUTOFF) {
    res = mp_toom_sqr(a, b);
  /* Karatsuba? */
  } else 
#endif
#ifdef BN_MP_KARATSUBA_SQR_C
if (a->used >= KARATSUBA_SQR_CUTOFF) {
    res = mp_karatsuba_sqr (a, b);
  } else 
#endif
  {
#ifdef BN_FAST_S_MP_SQR_C
    /* can we use the fast comba multiplier? */
    if ((a->used * 2 + 1) < MP_WARRAY && 
         a->used < 
         (1 << (sizeof(mp_word) * CHAR_BIT - 2*DIGIT_BIT - 1))) {
      res = fast_s_mp_sqr (a, b);
    } else
#endif
#ifdef BN_S_MP_SQR_C
      res = s_mp_sqr (a, b);
#else
      res = MP_VAL;
#endif
  }
  b->sign = MP_ZPOS;
  return res;
}
#endif

#ifdef BN_MP_GROW_C

/* grow as required */
int mp_grow (mp_int * a, int size)
{
  int     i;
  mp_digit *tmp;

  /* if the alloc size is smaller alloc more ram */
  if (a->alloc < size) {
    /* ensure there are always at least MP_PREC digits extra on top */
    size += (MP_PREC * 2) - (size % MP_PREC);

    /* reallocate the array a->dp
     *
     * We store the return in a temporary variable
     * in case the operation failed we don't want
     * to overwrite the dp member of a.
     */
    tmp = OPT_CAST(mp_digit) XREALLOC (a->dp, sizeof (mp_digit) * size);
    if (tmp == NULL) {
      /* reallocation failed but "a" is still valid [can be freed] */
      return MP_MEM;
    }

    /* reallocation succeeded so set a->dp */
    a->dp = tmp;

    /* zero excess digits */
    i        = a->alloc;
    a->alloc = size;
    for (; i < a->alloc; i++) {
      a->dp[i] = 0;
    }
  }
  return MP_OKAY;
}
#endif

#ifdef BN_MP_MUL_2D_C

/* shift left by a certain bit count */
int mp_mul_2d (mp_int * a, int b, mp_int * c)
{
  mp_digit d;
  int      res;

  /* copy */
  if (a != c) {
     if ((res = mp_copy (a, c)) != MP_OKAY) {
       return res;
     }
  }

  if (c->alloc < (int)(c->used + b/DIGIT_BIT + 1)) {
     if ((res = mp_grow (c, c->used + b / DIGIT_BIT + 1)) != MP_OKAY) {
       return res;
     }
  }

  /* shift by as many digits in the bit count */
  if (b >= (int)DIGIT_BIT) {
    if ((res = mp_lshd (c, b / DIGIT_BIT)) != MP_OKAY) {
      return res;
    }
  }

  /* shift any bit count < DIGIT_BIT */
  d = (mp_digit) (b % DIGIT_BIT);
  if (d != 0) {
    register mp_digit *tmpc, shift, mask, r, rr;
    register int x;

    /* bitmask for carries */
    mask = (((mp_digit)1) << d) - 1;

    /* shift for msbs */
    shift = DIGIT_BIT - d;

    /* alias */
    tmpc = c->dp;

    /* carry */
    r    = 0;
    for (x = 0; x < c->used; x++) {
      /* get the higher bits of the current word */
      rr = (*tmpc >> shift) & mask;

      /* shift the current word and OR in the carry */
      *tmpc = ((*tmpc << d) | r) & MP_MASK;
      ++tmpc;

      /* set the carry to the carry bits of the current word */
      r = rr;
    }
    
    /* set final carry */
    if (r != 0) {
       c->dp[(c->used)++] = r;
    }
  }
  mp_clamp (c);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_CMP_D_C

/* compare a digit */
int mp_cmp_d(mp_int * a, mp_digit b)
{
  /* compare based on sign */
  if (a->sign == MP_NEG) {
    return MP_LT;
  }

  /* compare based on magnitude */
  if (a->used > 1) {
    return MP_GT;
  }

  /* compare the only digit of a to b */
  if (a->dp[0] > b) {
    return MP_GT;
  } else if (a->dp[0] < b) {
    return MP_LT;
  } else {
    return MP_EQ;
  }
}
#endif

#ifdef BN_MP_CMP_MAG_C

/* compare maginitude of two ints (unsigned) */
int mp_cmp_mag (mp_int * a, mp_int * b)
{
  int     n;
  mp_digit *tmpa, *tmpb;

  /* compare based on # of non-zero digits */
  if (a->used > b->used) {
    return MP_GT;
  }
  
  if (a->used < b->used) {
    return MP_LT;
  }

  /* alias for a */
  tmpa = a->dp + (a->used - 1);

  /* alias for b */
  tmpb = b->dp + (a->used - 1);

  /* compare based on digits  */
  for (n = 0; n < a->used; ++n, --tmpa, --tmpb) {
    if (*tmpa > *tmpb) {
      return MP_GT;
    }

    if (*tmpa < *tmpb) {
      return MP_LT;
    }
  }
  return MP_EQ;
}
#endif

#ifdef BN_MP_CLEAR_C

/* clear one (frees)  */
void
mp_clear (mp_int * a)
{
  int i;

  /* only do anything if a hasn't been freed previously */
  if (a->dp != NULL) {
    /* first zero the digits */
    for (i = 0; i < a->used; i++) {
        a->dp[i] = 0;
    }

    /* free ram */
    XFREE(a->dp);

    /* reset members to make debugging easier */
    a->dp    = NULL;
    a->alloc = a->used = 0;
    a->sign  = MP_ZPOS;
  }
}
#endif

#ifdef BN_MP_INVMOD_SLOW_C

/* hac 14.61, pp608 */
int mp_invmod_slow (mp_int * a, mp_int * b, mp_int * c)
{
  mp_int  x, y, u, v, A, B, C, D;
  int     res;

  /* b cannot be negative */
  if (b->sign == MP_NEG || mp_iszero(b) == 1) {
    return MP_VAL;
  }

  /* init temps */
  if ((res = mp_init_multi(&x, &y, &u, &v, 
                           &A, &B, &C, &D, NULL)) != MP_OKAY) {
     return res;
  }

  /* x = a, y = b */
  if ((res = mp_mod(a, b, &x)) != MP_OKAY) {
      goto LBL_ERR;
  }
  if ((res = mp_copy (b, &y)) != MP_OKAY) {
    goto LBL_ERR;
  }

  /* 2. [modified] if x,y are both even then return an error! */
  if (mp_iseven (&x) == 1 && mp_iseven (&y) == 1) {
    res = MP_VAL;
    goto LBL_ERR;
  }

  /* 3. u=x, v=y, A=1, B=0, C=0,D=1 */
  if ((res = mp_copy (&x, &u)) != MP_OKAY) {
    goto LBL_ERR;
  }
  if ((res = mp_copy (&y, &v)) != MP_OKAY) {
    goto LBL_ERR;
  }
  mp_set (&A, 1);
  mp_set (&D, 1);

top:
  /* 4.  while u is even do */
  while (mp_iseven (&u) == 1) {
    /* 4.1 u = u/2 */
    if ((res = mp_div_2 (&u, &u)) != MP_OKAY) {
      goto LBL_ERR;
    }
    /* 4.2 if A or B is odd then */
    if (mp_isodd (&A) == 1 || mp_isodd (&B) == 1) {
      /* A = (A+y)/2, B = (B-x)/2 */
      if ((res = mp_add (&A, &y, &A)) != MP_OKAY) {
         goto LBL_ERR;
      }
      if ((res = mp_sub (&B, &x, &B)) != MP_OKAY) {
         goto LBL_ERR;
      }
    }
    /* A = A/2, B = B/2 */
    if ((res = mp_div_2 (&A, &A)) != MP_OKAY) {
      goto LBL_ERR;
    }
    if ((res = mp_div_2 (&B, &B)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }

  /* 5.  while v is even do */
  while (mp_iseven (&v) == 1) {
    /* 5.1 v = v/2 */
    if ((res = mp_div_2 (&v, &v)) != MP_OKAY) {
      goto LBL_ERR;
    }
    /* 5.2 if C or D is odd then */
    if (mp_isodd (&C) == 1 || mp_isodd (&D) == 1) {
      /* C = (C+y)/2, D = (D-x)/2 */
      if ((res = mp_add (&C, &y, &C)) != MP_OKAY) {
         goto LBL_ERR;
      }
      if ((res = mp_sub (&D, &x, &D)) != MP_OKAY) {
         goto LBL_ERR;
      }
    }
    /* C = C/2, D = D/2 */
    if ((res = mp_div_2 (&C, &C)) != MP_OKAY) {
      goto LBL_ERR;
    }
    if ((res = mp_div_2 (&D, &D)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }

  /* 6.  if u >= v then */
  if (mp_cmp (&u, &v) != MP_LT) {
    /* u = u - v, A = A - C, B = B - D */
    if ((res = mp_sub (&u, &v, &u)) != MP_OKAY) {
      goto LBL_ERR;
    }

    if ((res = mp_sub (&A, &C, &A)) != MP_OKAY) {
      goto LBL_ERR;
    }

    if ((res = mp_sub (&B, &D, &B)) != MP_OKAY) {
      goto LBL_ERR;
    }
  } else {
    /* v - v - u, C = C - A, D = D - B */
    if ((res = mp_sub (&v, &u, &v)) != MP_OKAY) {
      goto LBL_ERR;
    }

    if ((res = mp_sub (&C, &A, &C)) != MP_OKAY) {
      goto LBL_ERR;
    }

    if ((res = mp_sub (&D, &B, &D)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }

  /* if not zero goto step 4 */
  if (mp_iszero (&u) == 0)
    goto top;

  /* now a = C, b = D, gcd == g*v */

  /* if v != 1 then there is no inverse */
  if (mp_cmp_d (&v, 1) != MP_EQ) {
    res = MP_VAL;
    goto LBL_ERR;
  }

  /* if its too low */
  while (mp_cmp_d(&C, 0) == MP_LT) {
      if ((res = mp_add(&C, b, &C)) != MP_OKAY) {
         goto LBL_ERR;
      }
  }
  
  /* too big */
  while (mp_cmp_mag(&C, b) != MP_LT) {
      if ((res = mp_sub(&C, b, &C)) != MP_OKAY) {
         goto LBL_ERR;
      }
  }
  
  /* C is now the inverse */
  mp_exch (&C, c);
  res = MP_OKAY;
LBL_ERR:mp_clear_multi (&x, &y, &u, &v, &A, &B, &C, &D, NULL);
  return res;
}
#endif

#ifdef BN_MP_DIV_C

#ifdef BN_MP_DIV_SMALL

/* slower bit-bang division... also smaller */
int mp_div(mp_int * a, mp_int * b, mp_int * c, mp_int * d)
{
   mp_int ta, tb, tq, q;
   int    res, n, n2;

  /* is divisor zero ? */
  if (mp_iszero (b) == 1) {
    return MP_VAL;
  }

  /* if a < b then q=0, r = a */
  if (mp_cmp_mag (a, b) == MP_LT) {
    if (d != NULL) {
      res = mp_copy (a, d);
    } else {
      res = MP_OKAY;
    }
    if (c != NULL) {
      mp_zero (c);
    }
    return res;
  }
	
  /* init our temps */
  if ((res = mp_init_multi(&ta, &tb, &tq, &q, NULL) != MP_OKAY)) {
     return res;
  }


  mp_set(&tq, 1);
  n = mp_count_bits(a) - mp_count_bits(b);
  if (((res = mp_abs(a, &ta)) != MP_OKAY) ||
      ((res = mp_abs(b, &tb)) != MP_OKAY) || 
      ((res = mp_mul_2d(&tb, n, &tb)) != MP_OKAY) ||
      ((res = mp_mul_2d(&tq, n, &tq)) != MP_OKAY)) {
      goto LBL_ERR;
  }

  while (n-- >= 0) {
     if (mp_cmp(&tb, &ta) != MP_GT) {
        if (((res = mp_sub(&ta, &tb, &ta)) != MP_OKAY) ||
            ((res = mp_add(&q, &tq, &q)) != MP_OKAY)) {
           goto LBL_ERR;
        }
     }
     if (((res = mp_div_2d(&tb, 1, &tb, NULL)) != MP_OKAY) ||
         ((res = mp_div_2d(&tq, 1, &tq, NULL)) != MP_OKAY)) {
           goto LBL_ERR;
     }
  }

  /* now q == quotient and ta == remainder */
  n  = a->sign;
  n2 = (a->sign == b->sign ? MP_ZPOS : MP_NEG);
  if (c != NULL) {
     mp_exch(c, &q);
     c->sign  = (mp_iszero(c) == MP_YES) ? MP_ZPOS : n2;
  }
  if (d != NULL) {
     mp_exch(d, &ta);
     d->sign = (mp_iszero(d) == MP_YES) ? MP_ZPOS : n;
  }
LBL_ERR:
   mp_clear_multi(&ta, &tb, &tq, &q, NULL);
   return res;
}

#else

/* integer signed division. 
 * c*b + d == a [e.g. a/b, c=quotient, d=remainder]
 * HAC pp.598 Algorithm 14.20
 *
 * Note that the description in HAC is horribly 
 * incomplete.  For example, it doesn't consider 
 * the case where digits are removed from 'x' in 
 * the inner loop.  It also doesn't consider the 
 * case that y has fewer than three digits, etc..
 *
 * The overall algorithm is as described as 
 * 14.20 from HAC but fixed to treat these cases.
*/
int mp_div (mp_int * a, mp_int * b, mp_int * c, mp_int * d)
{
  mp_int  q, x, y, t1, t2;
  int     res, n, t, i, norm, neg;

  /* is divisor zero ? */
  if (mp_iszero (b) == 1) {
    return MP_VAL;
  }

  /* if a < b then q=0, r = a */
  if (mp_cmp_mag (a, b) == MP_LT) {
    if (d != NULL) {
      res = mp_copy (a, d);
    } else {
      res = MP_OKAY;
    }
    if (c != NULL) {
      mp_zero (c);
    }
    return res;
  }

  if ((res = mp_init_size (&q, a->used + 2)) != MP_OKAY) {
    return res;
  }
  q.used = a->used + 2;

  if ((res = mp_init (&t1)) != MP_OKAY) {
    goto LBL_Q;
  }

  if ((res = mp_init (&t2)) != MP_OKAY) {
    goto LBL_T1;
  }

  if ((res = mp_init_copy (&x, a)) != MP_OKAY) {
    goto LBL_T2;
  }

  if ((res = mp_init_copy (&y, b)) != MP_OKAY) {
    goto LBL_X;
  }

  /* fix the sign */
  neg = (a->sign == b->sign) ? MP_ZPOS : MP_NEG;
  x.sign = y.sign = MP_ZPOS;

  /* normalize both x and y, ensure that y >= b/2, [b == 2**DIGIT_BIT] */
  norm = mp_count_bits(&y) % DIGIT_BIT;
  if (norm < (int)(DIGIT_BIT-1)) {
     norm = (DIGIT_BIT-1) - norm;
     if ((res = mp_mul_2d (&x, norm, &x)) != MP_OKAY) {
       goto LBL_Y;
     }
     if ((res = mp_mul_2d (&y, norm, &y)) != MP_OKAY) {
       goto LBL_Y;
     }
  } else {
     norm = 0;
  }

  /* note hac does 0 based, so if used==5 then its 0,1,2,3,4, e.g. use 4 */
  n = x.used - 1;
  t = y.used - 1;

  /* while (x >= y*b**n-t) do { q[n-t] += 1; x -= y*b**{n-t} } */
  if ((res = mp_lshd (&y, n - t)) != MP_OKAY) { /* y = y*b**{n-t} */
    goto LBL_Y;
  }

  while (mp_cmp (&x, &y) != MP_LT) {
    ++(q.dp[n - t]);
    if ((res = mp_sub (&x, &y, &x)) != MP_OKAY) {
      goto LBL_Y;
    }
  }

  /* reset y by shifting it back down */
  mp_rshd (&y, n - t);

  /* step 3. for i from n down to (t + 1) */
  for (i = n; i >= (t + 1); i--) {
    if (i > x.used) {
      continue;
    }

    /* step 3.1 if xi == yt then set q{i-t-1} to b-1, 
     * otherwise set q{i-t-1} to (xi*b + x{i-1})/yt */
    if (x.dp[i] == y.dp[t]) {
      q.dp[i - t - 1] = ((((mp_digit)1) << DIGIT_BIT) - 1);
    } else {
      mp_word tmp;
      tmp = ((mp_word) x.dp[i]) << ((mp_word) DIGIT_BIT);
      tmp |= ((mp_word) x.dp[i - 1]);
      tmp /= ((mp_word) y.dp[t]);
      if (tmp > (mp_word) MP_MASK)
        tmp = MP_MASK;
      q.dp[i - t - 1] = (mp_digit) (tmp & (mp_word) (MP_MASK));
    }

    /* while (q{i-t-1} * (yt * b + y{t-1})) > 
             xi * b**2 + xi-1 * b + xi-2 
     
       do q{i-t-1} -= 1; 
    */
    q.dp[i - t - 1] = (q.dp[i - t - 1] + 1) & MP_MASK;
    do {
      q.dp[i - t - 1] = (q.dp[i - t - 1] - 1) & MP_MASK;

      /* find left hand */
      mp_zero (&t1);
      t1.dp[0] = (t - 1 < 0) ? 0 : y.dp[t - 1];
      t1.dp[1] = y.dp[t];
      t1.used = 2;
      if ((res = mp_mul_d (&t1, q.dp[i - t - 1], &t1)) != MP_OKAY) {
        goto LBL_Y;
      }

      /* find right hand */
      t2.dp[0] = (i - 2 < 0) ? 0 : x.dp[i - 2];
      t2.dp[1] = (i - 1 < 0) ? 0 : x.dp[i - 1];
      t2.dp[2] = x.dp[i];
      t2.used = 3;
    } while (mp_cmp_mag(&t1, &t2) == MP_GT);

    /* step 3.3 x = x - q{i-t-1} * y * b**{i-t-1} */
    if ((res = mp_mul_d (&y, q.dp[i - t - 1], &t1)) != MP_OKAY) {
      goto LBL_Y;
    }

    if ((res = mp_lshd (&t1, i - t - 1)) != MP_OKAY) {
      goto LBL_Y;
    }

    if ((res = mp_sub (&x, &t1, &x)) != MP_OKAY) {
      goto LBL_Y;
    }

    /* if x < 0 then { x = x + y*b**{i-t-1}; q{i-t-1} -= 1; } */
    if (x.sign == MP_NEG) {
      if ((res = mp_copy (&y, &t1)) != MP_OKAY) {
        goto LBL_Y;
      }
      if ((res = mp_lshd (&t1, i - t - 1)) != MP_OKAY) {
        goto LBL_Y;
      }
      if ((res = mp_add (&x, &t1, &x)) != MP_OKAY) {
        goto LBL_Y;
      }

      q.dp[i - t - 1] = (q.dp[i - t - 1] - 1UL) & MP_MASK;
    }
  }

  /* now q is the quotient and x is the remainder 
   * [which we have to normalize] 
   */
  
  /* get sign before writing to c */
  x.sign = x.used == 0 ? MP_ZPOS : a->sign;

  if (c != NULL) {
    mp_clamp (&q);
    mp_exch (&q, c);
    c->sign = neg;
  }

  if (d != NULL) {
    mp_div_2d (&x, norm, &x, NULL);
    mp_exch (&x, d);
  }

  res = MP_OKAY;

LBL_Y:mp_clear (&y);
LBL_X:mp_clear (&x);
LBL_T2:mp_clear (&t2);
LBL_T1:mp_clear (&t1);
LBL_Q:mp_clear (&q);
  return res;
}

#endif

#endif

#ifdef BN_MP_REDUCE_2K_SETUP_L_C

/* determines the setup value */
int mp_reduce_2k_setup_l(mp_int *a, mp_int *d)
{
   int    res;
   mp_int tmp;
   
   if ((res = mp_init(&tmp)) != MP_OKAY) {
      return res;
   }
   
   if ((res = mp_2expt(&tmp, mp_count_bits(a))) != MP_OKAY) {
      goto ERR;
   }
   
   if ((res = s_mp_sub(&tmp, a, d)) != MP_OKAY) {
      goto ERR;
   }
   
ERR:
   mp_clear(&tmp);
   return res;
}
#endif

#ifdef BN_MP_MONTGOMERY_CALC_NORMALIZATION_C

/*
 * shifts with subtractions when the result is greater than b.
 *
 * The method is slightly modified to shift B unconditionally upto just under
 * the leading bit of b.  This saves alot of multiple precision shifting.
 */
int mp_montgomery_calc_normalization (mp_int * a, mp_int * b)
{
  int     x, bits, res;

  /* how many bits of last digit does b use */
  bits = mp_count_bits (b) % DIGIT_BIT;

  if (b->used > 1) {
     if ((res = mp_2expt (a, (b->used - 1) * DIGIT_BIT + bits - 1)) != MP_OKAY) {
        return res;
     }
  } else {
     mp_set(a, 1);
     bits = 1;
  }


  /* now compute C = A * B mod b */
  for (x = bits - 1; x < (int)DIGIT_BIT; x++) {
    if ((res = mp_mul_2 (a, a)) != MP_OKAY) {
      return res;
    }
    if (mp_cmp_mag (a, b) != MP_LT) {
      if ((res = s_mp_sub (a, b, a)) != MP_OKAY) {
        return res;
      }
    }
  }

  return MP_OKAY;
}
#endif

#ifdef BN_MP_READ_SIGNED_BIN_C


/* read signed bin, big endian, first byte is 0==positive or 1==negative */
int mp_read_signed_bin (mp_int * a, const unsigned char *b, int c)
{
  int     res;

  /* read magnitude */
  if ((res = mp_read_unsigned_bin (a, b + 1, c - 1)) != MP_OKAY) {
    return res;
  }

  /* first byte is 0 for positive, non-zero for negative */
  if (b[0] == 0) {
     a->sign = MP_ZPOS;
  } else {
     a->sign = MP_NEG;
  }

  return MP_OKAY;
}
#endif

#ifdef BN_MP_XOR_C

/* XOR two ints together */
int
mp_xor (mp_int * a, mp_int * b, mp_int * c)
{
  int     res, ix, px;
  mp_int  t, *x;

  if (a->used > b->used) {
    if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
      return res;
    }
    px = b->used;
    x = b;
  } else {
    if ((res = mp_init_copy (&t, b)) != MP_OKAY) {
      return res;
    }
    px = a->used;
    x = a;
  }

  for (ix = 0; ix < px; ix++) {
     t.dp[ix] ^= x->dp[ix];
  }
  mp_clamp (&t);
  mp_exch (c, &t);
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_EXPTMOD_C

/* this is a shell function that calls either the normal or Montgomery
 * exptmod functions.  Originally the call to the montgomery code was
 * embedded in the normal function but that wasted alot of stack space
 * for nothing (since 99% of the time the Montgomery code would be called)
 */
int mp_exptmod (mp_int * G, mp_int * X, mp_int * P, mp_int * Y)
{
  int dr;

  /* modulus P must be positive */
  if (P->sign == MP_NEG) {
     return MP_VAL;
  }

  /* if exponent X is negative we have to recurse */
  if (X->sign == MP_NEG) {
#ifdef BN_MP_INVMOD_C
     mp_int tmpG, tmpX;
     int err;

     /* first compute 1/G mod P */
     if ((err = mp_init(&tmpG)) != MP_OKAY) {
        return err;
     }
     if ((err = mp_invmod(G, P, &tmpG)) != MP_OKAY) {
        mp_clear(&tmpG);
        return err;
     }

     /* now get |X| */
     if ((err = mp_init(&tmpX)) != MP_OKAY) {
        mp_clear(&tmpG);
        return err;
     }
     if ((err = mp_abs(X, &tmpX)) != MP_OKAY) {
        mp_clear_multi(&tmpG, &tmpX, NULL);
        return err;
     }

     /* and now compute (1/G)**|X| instead of G**X [X < 0] */
     err = mp_exptmod(&tmpG, &tmpX, P, Y);
     mp_clear_multi(&tmpG, &tmpX, NULL);
     return err;
#else 
     /* no invmod */
     return MP_VAL;
#endif
  }

/* modified diminished radix reduction */
#if defined(BN_MP_REDUCE_IS_2K_L_C) && defined(BN_MP_REDUCE_2K_L_C) && defined(BN_S_MP_EXPTMOD_C)
  if (mp_reduce_is_2k_l(P) == MP_YES) {
     return s_mp_exptmod(G, X, P, Y, 1);
  }
#endif

#ifdef BN_MP_DR_IS_MODULUS_C
  /* is it a DR modulus? */
  dr = mp_dr_is_modulus(P);
#else
  /* default to no */
  dr = 0;
#endif

#ifdef BN_MP_REDUCE_IS_2K_C
  /* if not, is it a unrestricted DR modulus? */
  if (dr == 0) {
     dr = mp_reduce_is_2k(P) << 1;
  }
#endif
    
  /* if the modulus is odd or dr != 0 use the montgomery method */
#ifdef BN_MP_EXPTMOD_FAST_C
  if (mp_isodd (P) == 1 || dr !=  0) {
    return mp_exptmod_fast (G, X, P, Y, dr);
  } else {
#endif
#ifdef BN_S_MP_EXPTMOD_C
    /* otherwise use the generic Barrett reduction technique */
    return s_mp_exptmod (G, X, P, Y, 0);
#else
    /* no exptmod for evens */
    return MP_VAL;
#endif
#ifdef BN_MP_EXPTMOD_FAST_C
  }
#endif
}

#endif

#ifdef BN_MP_PRIME_IS_PRIME_C

/* performs a variable number of rounds of Miller-Rabin
 *
 * Probability of error after t rounds is no more than

 *
 * Sets result to 1 if probably prime, 0 otherwise
 */
int mp_prime_is_prime (mp_int * a, int t, int *result)
{
  mp_int  b;
  int     ix, err, res;

  /* default to no */
  *result = MP_NO;

  /* valid value of t? */
  if (t <= 0 || t > PRIME_SIZE) {
    return MP_VAL;
  }

  /* is the input equal to one of the primes in the table? */
  for (ix = 0; ix < PRIME_SIZE; ix++) {
      if (mp_cmp_d(a, ltm_prime_tab[ix]) == MP_EQ) {
         *result = 1;
         return MP_OKAY;
      }
  }

  /* first perform trial division */
  if ((err = mp_prime_is_divisible (a, &res)) != MP_OKAY) {
    return err;
  }

  /* return if it was trivially divisible */
  if (res == MP_YES) {
    return MP_OKAY;
  }

  /* now perform the miller-rabin rounds */
  if ((err = mp_init (&b)) != MP_OKAY) {
    return err;
  }

  for (ix = 0; ix < t; ix++) {
    /* set the prime */
    mp_set (&b, ltm_prime_tab[ix]);

    if ((err = mp_prime_miller_rabin (a, &b, &res)) != MP_OKAY) {
      goto LBL_B;
    }

    if (res == MP_NO) {
      goto LBL_B;
    }
  }

  /* passed the test */
  *result = MP_YES;
LBL_B:mp_clear (&b);
  return err;
}
#endif

#ifdef BN_MP_REDUCE_2K_L_C

/* reduces a modulo n where n is of the form 2**p - d 
   This differs from reduce_2k since "d" can be larger
   than a single digit.
*/
int mp_reduce_2k_l(mp_int *a, mp_int *n, mp_int *d)
{
   mp_int q;
   int    p, res;
   
   if ((res = mp_init(&q)) != MP_OKAY) {
      return res;
   }
   
   p = mp_count_bits(n);    
top:
   /* q = a/2**p, a = a mod 2**p */
   if ((res = mp_div_2d(a, p, &q, a)) != MP_OKAY) {
      goto ERR;
   }
   
   /* q = q * d */
   if ((res = mp_mul(&q, d, &q)) != MP_OKAY) { 
      goto ERR;
   }
   
   /* a = a + q */
   if ((res = s_mp_add(a, &q, a)) != MP_OKAY) {
      goto ERR;
   }
   
   if (mp_cmp_mag(a, n) != MP_LT) {
      s_mp_sub(a, n, a);
      goto top;
   }
   
ERR:
   mp_clear(&q);
   return res;
}

#endif

#ifdef BN_MP_EXPTMOD_FAST_C

/* computes Y == G**X mod P, HAC pp.616, Algorithm 14.85
 *
 * Uses a left-to-right k-ary sliding window to compute the modular exponentiation.
 * The value of k changes based on the size of the exponent.
 *
 * Uses Montgomery or Diminished Radix reduction [whichever appropriate]
 */

#ifdef MP_LOW_MEM
   #define TAB_SIZE 32
#else
   #define TAB_SIZE 256
#endif

int mp_exptmod_fast (mp_int * G, mp_int * X, mp_int * P, mp_int * Y, int redmode)
{
  mp_int  M[TAB_SIZE], res;
  mp_digit buf, mp;
  int     err, bitbuf, bitcpy, bitcnt, mode, digidx, x, y, winsize;

  /* use a pointer to the reduction algorithm.  This allows us to use
   * one of many reduction algorithms without modding the guts of
   * the code with if statements everywhere.
   */
  int     (*redux)(mp_int*,mp_int*,mp_digit);

  /* find window size */
  x = mp_count_bits (X);
  if (x <= 7) {
    winsize = 2;
  } else if (x <= 36) {
    winsize = 3;
  } else if (x <= 140) {
    winsize = 4;
  } else if (x <= 450) {
    winsize = 5;
  } else if (x <= 1303) {
    winsize = 6;
  } else if (x <= 3529) {
    winsize = 7;
  } else {
    winsize = 8;
  }

#ifdef MP_LOW_MEM
  if (winsize > 5) {
     winsize = 5;
  }
#endif

  /* init M array */
  /* init first cell */
  if ((err = mp_init(&M[1])) != MP_OKAY) {
     return err;
  }

  /* now init the second half of the array */
  for (x = 1<<(winsize-1); x < (1 << winsize); x++) {
    if ((err = mp_init(&M[x])) != MP_OKAY) {
      for (y = 1<<(winsize-1); y < x; y++) {
        mp_clear (&M[y]);
      }
      mp_clear(&M[1]);
      return err;
    }
  }

  /* determine and setup reduction code */
  if (redmode == 0) {
#ifdef BN_MP_MONTGOMERY_SETUP_C     
     /* now setup montgomery  */
     if ((err = mp_montgomery_setup (P, &mp)) != MP_OKAY) {
        goto LBL_M;
     }
#else
     err = MP_VAL;
     goto LBL_M;
#endif

     /* automatically pick the comba one if available (saves quite a few calls/ifs) */
#ifdef BN_FAST_MP_MONTGOMERY_REDUCE_C
     if (((P->used * 2 + 1) < MP_WARRAY) &&
          P->used < (1 << ((CHAR_BIT * sizeof (mp_word)) - (2 * DIGIT_BIT)))) {
        redux = fast_mp_montgomery_reduce;
     } else 
#endif
     {
#ifdef BN_MP_MONTGOMERY_REDUCE_C
        /* use slower baseline Montgomery method */
        redux = mp_montgomery_reduce;
#else
        err = MP_VAL;
        goto LBL_M;
#endif
     }
  } else if (redmode == 1) {
#if defined(BN_MP_DR_SETUP_C) && defined(BN_MP_DR_REDUCE_C)
     /* setup DR reduction for moduli of the form B**k - b */
     mp_dr_setup(P, &mp);
     redux = mp_dr_reduce;
#else
     err = MP_VAL;
     goto LBL_M;
#endif
  } else {
#if defined(BN_MP_REDUCE_2K_SETUP_C) && defined(BN_MP_REDUCE_2K_C)
     /* setup DR reduction for moduli of the form 2**k - b */
     if ((err = mp_reduce_2k_setup(P, &mp)) != MP_OKAY) {
        goto LBL_M;
     }
     redux = mp_reduce_2k;
#else
     err = MP_VAL;
     goto LBL_M;
#endif
  }

  /* setup result */
  if ((err = mp_init (&res)) != MP_OKAY) {
    goto LBL_M;
  }

  /* create M table
   *

   *
   * The first half of the table is not computed though accept for M[0] and M[1]
   */

  if (redmode == 0) {
#ifdef BN_MP_MONTGOMERY_CALC_NORMALIZATION_C
     /* now we need R mod m */
     if ((err = mp_montgomery_calc_normalization (&res, P)) != MP_OKAY) {
       goto LBL_RES;
     }
#else 
     err = MP_VAL;
     goto LBL_RES;
#endif

     /* now set M[1] to G * R mod m */
     if ((err = mp_mulmod (G, &res, P, &M[1])) != MP_OKAY) {
       goto LBL_RES;
     }
  } else {
     mp_set(&res, 1);
     if ((err = mp_mod(G, P, &M[1])) != MP_OKAY) {
        goto LBL_RES;
     }
  }

  /* compute the value at M[1<<(winsize-1)] by squaring M[1] (winsize-1) times */
  if ((err = mp_copy (&M[1], &M[1 << (winsize - 1)])) != MP_OKAY) {
    goto LBL_RES;
  }

  for (x = 0; x < (winsize - 1); x++) {
    if ((err = mp_sqr (&M[1 << (winsize - 1)], &M[1 << (winsize - 1)])) != MP_OKAY) {
      goto LBL_RES;
    }
    if ((err = redux (&M[1 << (winsize - 1)], P, mp)) != MP_OKAY) {
      goto LBL_RES;
    }
  }

  /* create upper table */
  for (x = (1 << (winsize - 1)) + 1; x < (1 << winsize); x++) {
    if ((err = mp_mul (&M[x - 1], &M[1], &M[x])) != MP_OKAY) {
      goto LBL_RES;
    }
    if ((err = redux (&M[x], P, mp)) != MP_OKAY) {
      goto LBL_RES;
    }
  }

  /* set initial mode and bit cnt */
  mode   = 0;
  bitcnt = 1;
  buf    = 0;
  digidx = X->used - 1;
  bitcpy = 0;
  bitbuf = 0;

  for (;;) {
    /* grab next digit as required */
    if (--bitcnt == 0) {
      /* if digidx == -1 we are out of digits so break */
      if (digidx == -1) {
        break;
      }
      /* read next digit and reset bitcnt */
      buf    = X->dp[digidx--];
      bitcnt = (int)DIGIT_BIT;
    }

    /* grab the next msb from the exponent */
    y     = (mp_digit)(buf >> (DIGIT_BIT - 1)) & 1;
    buf <<= (mp_digit)1;

    /* if the bit is zero and mode == 0 then we ignore it
     * These represent the leading zero bits before the first 1 bit
     * in the exponent.  Technically this opt is not required but it
     * does lower the # of trivial squaring/reductions used
     */
    if (mode == 0 && y == 0) {
      continue;
    }

    /* if the bit is zero and mode == 1 then we square */
    if (mode == 1 && y == 0) {
      if ((err = mp_sqr (&res, &res)) != MP_OKAY) {
        goto LBL_RES;
      }
      if ((err = redux (&res, P, mp)) != MP_OKAY) {
        goto LBL_RES;
      }
      continue;
    }

    /* else we add it to the window */
    bitbuf |= (y << (winsize - ++bitcpy));
    mode    = 2;

    if (bitcpy == winsize) {
      /* ok window is filled so square as required and multiply  */
      /* square first */
      for (x = 0; x < winsize; x++) {
        if ((err = mp_sqr (&res, &res)) != MP_OKAY) {
          goto LBL_RES;
        }
        if ((err = redux (&res, P, mp)) != MP_OKAY) {
          goto LBL_RES;
        }
      }

      /* then multiply */
      if ((err = mp_mul (&res, &M[bitbuf], &res)) != MP_OKAY) {
        goto LBL_RES;
      }
      if ((err = redux (&res, P, mp)) != MP_OKAY) {
        goto LBL_RES;
      }

      /* empty window and reset */
      bitcpy = 0;
      bitbuf = 0;
      mode   = 1;
    }
  }

  /* if bits remain then square/multiply */
  if (mode == 2 && bitcpy > 0) {
    /* square then multiply if the bit is set */
    for (x = 0; x < bitcpy; x++) {
      if ((err = mp_sqr (&res, &res)) != MP_OKAY) {
        goto LBL_RES;
      }
      if ((err = redux (&res, P, mp)) != MP_OKAY) {
        goto LBL_RES;
      }

      /* get next bit of the window */
      bitbuf <<= 1;
      if ((bitbuf & (1 << winsize)) != 0) {
        /* then multiply */
        if ((err = mp_mul (&res, &M[1], &res)) != MP_OKAY) {
          goto LBL_RES;
        }
        if ((err = redux (&res, P, mp)) != MP_OKAY) {
          goto LBL_RES;
        }
      }
    }
  }

  if (redmode == 0) {
     /* fixup result if Montgomery reduction is used
      * recall that any value in a Montgomery system is
      * actually multiplied by R mod n.  So we have
      * to reduce one more time to cancel out the factor
      * of R.
      */
     if ((err = redux(&res, P, mp)) != MP_OKAY) {
       goto LBL_RES;
     }
  }

  /* swap res with Y */
  mp_exch (&res, Y);
  err = MP_OKAY;
LBL_RES:mp_clear (&res);
LBL_M:
  mp_clear(&M[1]);
  for (x = 1<<(winsize-1); x < (1 << winsize); x++) {
    mp_clear (&M[x]);
  }
  return err;
}
#endif

#ifdef BN_S_MP_ADD_C

/* low level addition, based on HAC pp.594, Algorithm 14.7 */
int
s_mp_add (mp_int * a, mp_int * b, mp_int * c)
{
  mp_int *x;
  int     olduse, res, min, max;

  /* find sizes, we let |a| <= |b| which means we have to sort
   * them.  "x" will point to the input with the most digits
   */
  if (a->used > b->used) {
    min = b->used;
    max = a->used;
    x = a;
  } else {
    min = a->used;
    max = b->used;
    x = b;
  }

  /* init result */
  if (c->alloc < max + 1) {
    if ((res = mp_grow (c, max + 1)) != MP_OKAY) {
      return res;
    }
  }

  /* get old used digit count and set new one */
  olduse = c->used;
  c->used = max + 1;

  {
    register mp_digit u, *tmpa, *tmpb, *tmpc;
    register int i;

    /* alias for digit pointers */

    /* first input */
    tmpa = a->dp;

    /* second input */
    tmpb = b->dp;

    /* destination */
    tmpc = c->dp;

    /* zero the carry */
    u = 0;
    for (i = 0; i < min; i++) {
      /* Compute the sum at one digit, T[i] = A[i] + B[i] + U */
      *tmpc = *tmpa++ + *tmpb++ + u;

      /* U = carry bit of T[i] */
      u = *tmpc >> ((mp_digit)DIGIT_BIT);

      /* take away carry bit from T[i] */
      *tmpc++ &= MP_MASK;
    }

    /* now copy higher words if any, that is in A+B 
     * if A or B has more digits add those in 
     */
    if (min != max) {
      for (; i < max; i++) {
        /* T[i] = X[i] + U */
        *tmpc = x->dp[i] + u;

        /* U = carry bit of T[i] */
        u = *tmpc >> ((mp_digit)DIGIT_BIT);

        /* take away carry bit from T[i] */
        *tmpc++ &= MP_MASK;
      }
    }

    /* add carry */
    *tmpc++ = u;

    /* clear digits above oldused */
    for (i = c->used; i < olduse; i++) {
      *tmpc++ = 0;
    }
  }

  mp_clamp (c);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_PRIME_FERMAT_C

/* performs one Fermat test.
 * 
 * If "a" were prime then b**a == b (mod a) since the order of
 * the multiplicative sub-group would be phi(a) = a-1.  That means
 * it would be the same as b**(a mod (a-1)) == b**1 == b (mod a).
 *
 * Sets result to 1 if the congruence holds, or zero otherwise.
 */
int mp_prime_fermat (mp_int * a, mp_int * b, int *result)
{
  mp_int  t;
  int     err;

  /* default to composite  */
  *result = MP_NO;

  /* ensure b > 1 */
  if (mp_cmp_d(b, 1) != MP_GT) {
     return MP_VAL;
  }

  /* init t */
  if ((err = mp_init (&t)) != MP_OKAY) {
    return err;
  }

  /* compute t = b**a mod a */
  if ((err = mp_exptmod (b, a, a, &t)) != MP_OKAY) {
    goto LBL_T;
  }

  /* is it equal to b? */
  if (mp_cmp (&t, b) == MP_EQ) {
    *result = MP_YES;
  }

  err = MP_OKAY;
LBL_T:mp_clear (&t);
  return err;
}
#endif

#ifdef BN_MP_ABS_C

/* b = |a| 
 *
 * Simple function copies the input and fixes the sign to positive
 */
int
mp_abs (mp_int * a, mp_int * b)
{
  int     res;

  /* copy a to b */
  if (a != b) {
     if ((res = mp_copy (a, b)) != MP_OKAY) {
       return res;
     }
  }

  /* force the sign of b to positive */
  b->sign = MP_ZPOS;

  return MP_OKAY;
}
#endif

#ifdef BN_MP_CLAMP_C

/* trim unused digits 
 *
 * This is used to ensure that leading zero digits are
 * trimed and the leading "used" digit will be non-zero
 * Typically very fast.  Also fixes the sign if there
 * are no more leading digits
 */
void
mp_clamp (mp_int * a)
{
  /* decrease used while the most significant digit is
   * zero.
   */
  while (a->used > 0 && a->dp[a->used - 1] == 0) {
    --(a->used);
  }

  /* reset the sign flag if used == 0 */
  if (a->used == 0) {
    a->sign = MP_ZPOS;
  }
}
#endif

/* $Source$ */
/* $Revision: 0.41 $ */
/* $Date: 2007-04-18 09:58:18 +0000 $ */

#ifdef BN_MP_SIGNED_BIN_SIZE_C

/* get the size for an signed equivalent */
int mp_signed_bin_size (mp_int * a)
{
  return 1 + mp_unsigned_bin_size (a);
}
#endif

#ifdef BN_MP_SQRT_C

/* this function is less generic than mp_n_root, simpler and faster */
int mp_sqrt(mp_int *arg, mp_int *ret) 
{
  int res;
  mp_int t1,t2;

  /* must be positive */
  if (arg->sign == MP_NEG) {
    return MP_VAL;
  }

  /* easy out */
  if (mp_iszero(arg) == MP_YES) {
    mp_zero(ret);
    return MP_OKAY;
  }

  if ((res = mp_init_copy(&t1, arg)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_init(&t2)) != MP_OKAY) {
    goto E2;
  }

  /* First approx. (not very bad for large arg) */
  mp_rshd (&t1,t1.used/2);

  /* t1 > 0  */ 
  if ((res = mp_div(arg,&t1,&t2,NULL)) != MP_OKAY) {
    goto E1;
  }
  if ((res = mp_add(&t1,&t2,&t1)) != MP_OKAY) {
    goto E1;
  }
  if ((res = mp_div_2(&t1,&t1)) != MP_OKAY) {
    goto E1;
  }
  /* And now t1 > sqrt(arg) */
  do { 
    if ((res = mp_div(arg,&t1,&t2,NULL)) != MP_OKAY) {
      goto E1;
    }
    if ((res = mp_add(&t1,&t2,&t1)) != MP_OKAY) {
      goto E1;
    }
    if ((res = mp_div_2(&t1,&t1)) != MP_OKAY) {
      goto E1;
    }
    /* t1 >= sqrt(arg) >= t2 at this point */
  } while (mp_cmp_mag(&t1,&t2) == MP_GT);

  mp_exch(&t1,ret);

E1: mp_clear(&t2);
E2: mp_clear(&t1);
  return res;
}

#endif

#ifdef BN_MP_MONTGOMERY_SETUP_C

/* setups the montgomery reduction stuff */
int
mp_montgomery_setup (mp_int * n, mp_digit * rho)
{
  mp_digit x, b;

/* fast inversion mod 2**k
 *
 * Based on the fact that
 *
 * XA = 1 (mod 2**n)  =>  (X(2-XA)) A = 1 (mod 2**2n)
 *                    =>  2*X*A - X*X*A*A = 1
 *                    =>  2*(1) - (1)     = 1
 */
  b = n->dp[0];

  if ((b & 1) == 0) {
    return MP_VAL;
  }

  x = (((b + 2) & 4) << 1) + b; /* here x*a==1 mod 2**4 */
  x *= 2 - b * x;               /* here x*a==1 mod 2**8 */
#if !defined(MP_8BIT)
  x *= 2 - b * x;               /* here x*a==1 mod 2**16 */
#endif
#if defined(MP_64BIT) || !(defined(MP_8BIT) || defined(MP_16BIT))
  x *= 2 - b * x;               /* here x*a==1 mod 2**32 */
#endif
#ifdef MP_64BIT
  x *= 2 - b * x;               /* here x*a==1 mod 2**64 */
#endif

  /* rho = -1/m mod b */
  *rho = (unsigned long)(((mp_word)1 << ((mp_word) DIGIT_BIT)) - x) & MP_MASK;

  return MP_OKAY;
}
#endif

#ifdef BN_MP_FWRITE_C

int mp_fwrite(mp_int *a, int radix, FILE *stream)
{
   char *buf = NULL;
   int err = 0, len = 0, x = 0;
   
   if ((err = mp_radix_size(a, radix, &len)) != MP_OKAY) {
      return err;
   }

   buf = OPT_CAST(char) XMALLOC (len);
   if (buf == NULL) {
      return MP_MEM;
   }
   
   if ((err = mp_toradix(a, buf, radix)) != MP_OKAY) {
      XFREE (buf);
      return err;
   }
   
   for (x = 0; x < len; x++) {
       if (fputc(buf[x], stream) == EOF) {
          XFREE (buf);
          return MP_VAL;
       }
   }
   
   XFREE (buf);
   return MP_OKAY;
}

#endif

#ifdef BN_MP_EXCH_C

/* swap the elements of two integers, for cases where you can't simply swap the 
 * mp_int pointers around
 */
void
mp_exch (mp_int * a, mp_int * b)
{
  mp_int  t;

  t  = *a;
  *a = *b;
  *b = t;
}
#endif

#ifdef BN_PRIME_TAB_C

const mp_digit ltm_prime_tab[] = {
  0x0002, 0x0003, 0x0005, 0x0007, 0x000B, 0x000D, 0x0011, 0x0013,
  0x0017, 0x001D, 0x001F, 0x0025, 0x0029, 0x002B, 0x002F, 0x0035,
  0x003B, 0x003D, 0x0043, 0x0047, 0x0049, 0x004F, 0x0053, 0x0059,
  0x0061, 0x0065, 0x0067, 0x006B, 0x006D, 0x0071, 0x007F,
#ifndef MP_8BIT
  0x0083,
  0x0089, 0x008B, 0x0095, 0x0097, 0x009D, 0x00A3, 0x00A7, 0x00AD,
  0x00B3, 0x00B5, 0x00BF, 0x00C1, 0x00C5, 0x00C7, 0x00D3, 0x00DF,
  0x00E3, 0x00E5, 0x00E9, 0x00EF, 0x00F1, 0x00FB, 0x0101, 0x0107,
  0x010D, 0x010F, 0x0115, 0x0119, 0x011B, 0x0125, 0x0133, 0x0137,

  0x0139, 0x013D, 0x014B, 0x0151, 0x015B, 0x015D, 0x0161, 0x0167,
  0x016F, 0x0175, 0x017B, 0x017F, 0x0185, 0x018D, 0x0191, 0x0199,
  0x01A3, 0x01A5, 0x01AF, 0x01B1, 0x01B7, 0x01BB, 0x01C1, 0x01C9,
  0x01CD, 0x01CF, 0x01D3, 0x01DF, 0x01E7, 0x01EB, 0x01F3, 0x01F7,
  0x01FD, 0x0209, 0x020B, 0x021D, 0x0223, 0x022D, 0x0233, 0x0239,
  0x023B, 0x0241, 0x024B, 0x0251, 0x0257, 0x0259, 0x025F, 0x0265,
  0x0269, 0x026B, 0x0277, 0x0281, 0x0283, 0x0287, 0x028D, 0x0293,
  0x0295, 0x02A1, 0x02A5, 0x02AB, 0x02B3, 0x02BD, 0x02C5, 0x02CF,

  0x02D7, 0x02DD, 0x02E3, 0x02E7, 0x02EF, 0x02F5, 0x02F9, 0x0301,
  0x0305, 0x0313, 0x031D, 0x0329, 0x032B, 0x0335, 0x0337, 0x033B,
  0x033D, 0x0347, 0x0355, 0x0359, 0x035B, 0x035F, 0x036D, 0x0371,
  0x0373, 0x0377, 0x038B, 0x038F, 0x0397, 0x03A1, 0x03A9, 0x03AD,
  0x03B3, 0x03B9, 0x03C7, 0x03CB, 0x03D1, 0x03D7, 0x03DF, 0x03E5,
  0x03F1, 0x03F5, 0x03FB, 0x03FD, 0x0407, 0x0409, 0x040F, 0x0419,
  0x041B, 0x0425, 0x0427, 0x042D, 0x043F, 0x0443, 0x0445, 0x0449,
  0x044F, 0x0455, 0x045D, 0x0463, 0x0469, 0x047F, 0x0481, 0x048B,

  0x0493, 0x049D, 0x04A3, 0x04A9, 0x04B1, 0x04BD, 0x04C1, 0x04C7,
  0x04CD, 0x04CF, 0x04D5, 0x04E1, 0x04EB, 0x04FD, 0x04FF, 0x0503,
  0x0509, 0x050B, 0x0511, 0x0515, 0x0517, 0x051B, 0x0527, 0x0529,
  0x052F, 0x0551, 0x0557, 0x055D, 0x0565, 0x0577, 0x0581, 0x058F,
  0x0593, 0x0595, 0x0599, 0x059F, 0x05A7, 0x05AB, 0x05AD, 0x05B3,
  0x05BF, 0x05C9, 0x05CB, 0x05CF, 0x05D1, 0x05D5, 0x05DB, 0x05E7,
  0x05F3, 0x05FB, 0x0607, 0x060D, 0x0611, 0x0617, 0x061F, 0x0623,
  0x062B, 0x062F, 0x063D, 0x0641, 0x0647, 0x0649, 0x064D, 0x0653
#endif
};
#endif

#ifdef BN_MP_INIT_SET_C

/* initialize and set a digit */
int mp_init_set (mp_int * a, mp_digit b)
{
  int err;
  if ((err = mp_init(a)) != MP_OKAY) {
     return err;
  }
  mp_set(a, b);
  return err;
}
#endif

#ifdef BN_MP_GET_INT_C

/* get the lower 32-bits of an mp_int */
unsigned long mp_get_int(mp_int * a) 
{
  int i;
  unsigned long res;

  if (a->used == 0) {
     return 0;
  }

  /* get number of digits of the lsb we have to read */
  i = MIN(a->used,(int)((sizeof(unsigned long)*CHAR_BIT+DIGIT_BIT-1)/DIGIT_BIT))-1;

  /* get most significant digit of result */
  res = DIGIT(a,i);
   
  while (--i >= 0) {
    res = (res << DIGIT_BIT) | DIGIT(a,i);
  }

  /* force result to 32-bits always so it is consistent on non 32-bit platforms */
  return res & 0xFFFFFFFFUL;
}
#endif

#ifdef BN_MP_MUL_C

/* high level multiplication (handles sign) */
int mp_mul (mp_int * a, mp_int * b, mp_int * c)
{
  int     res, neg;
  neg = (a->sign == b->sign) ? MP_ZPOS : MP_NEG;

  /* use Toom-Cook? */
#ifdef BN_MP_TOOM_MUL_C
  if (MIN (a->used, b->used) >= TOOM_MUL_CUTOFF) {
    res = mp_toom_mul(a, b, c);
  } else 
#endif
#ifdef BN_MP_KARATSUBA_MUL_C
  /* use Karatsuba? */
  if (MIN (a->used, b->used) >= KARATSUBA_MUL_CUTOFF) {
    res = mp_karatsuba_mul (a, b, c);
  } else 
#endif
  {
    /* can we use the fast multiplier?
     *
     * The fast multiplier can be used if the output will 
     * have less than MP_WARRAY digits and the number of 
     * digits won't affect carry propagation
     */
    int     digs = a->used + b->used + 1;

#ifdef BN_FAST_S_MP_MUL_DIGS_C
    if ((digs < MP_WARRAY) &&
        MIN(a->used, b->used) <= 
        (1 << ((CHAR_BIT * sizeof (mp_word)) - (2 * DIGIT_BIT)))) {
      res = fast_s_mp_mul_digs (a, b, c, digs);
    } else 
#endif
#ifdef BN_S_MP_MUL_DIGS_C
      res = s_mp_mul (a, b, c); /* uses s_mp_mul_digs */
#else
      res = MP_VAL;
#endif

  }
  c->sign = (c->used > 0) ? neg : MP_ZPOS;
  return res;
}
#endif

#ifdef BN_MP_SQRMOD_C

/* c = a * a (mod b) */
int
mp_sqrmod (mp_int * a, mp_int * b, mp_int * c)
{
  int     res;
  mp_int  t;

  if ((res = mp_init (&t)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_sqr (a, &t)) != MP_OKAY) {
    mp_clear (&t);
    return res;
  }
  res = mp_mod (&t, b, c);
  mp_clear (&t);
  return res;
}
#endif

#ifdef BN_MP_TO_UNSIGNED_BIN_C

/* store in unsigned [big endian] format */
int mp_to_unsigned_bin (mp_int * a, unsigned char *b)
{
  int     x, res;
  mp_int  t;

  if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
    return res;
  }

  x = 0;
  while (mp_iszero (&t) == 0) {
#ifndef MP_8BIT
      b[x++] = (unsigned char) (t.dp[0] & 255);
#else
      b[x++] = (unsigned char) (t.dp[0] | ((t.dp[1] & 0x01) << 7));
#endif
    if ((res = mp_div_2d (&t, 8, &t, NULL)) != MP_OKAY) {
      mp_clear (&t);
      return res;
    }
  }
  bn_reverse (b, x);
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_S_MP_SQR_C

/* low level squaring, b = a*a, HAC pp.596-597, Algorithm 14.16 */
int s_mp_sqr (mp_int * a, mp_int * b)
{
  mp_int  t;
  int     res, ix, iy, pa;
  mp_word r;
  mp_digit u, tmpx, *tmpt;

  pa = a->used;
  if ((res = mp_init_size (&t, 2*pa + 1)) != MP_OKAY) {
    return res;
  }

  /* default used is maximum possible size */
  t.used = 2*pa + 1;

  for (ix = 0; ix < pa; ix++) {
    /* first calculate the digit at 2*ix */
    /* calculate double precision result */
    r = ((mp_word) t.dp[2*ix]) +
        ((mp_word)a->dp[ix])*((mp_word)a->dp[ix]);

    /* store lower part in result */
    t.dp[ix+ix] = (mp_digit) (r & ((mp_word) MP_MASK));

    /* get the carry */
    u           = (mp_digit)(r >> ((mp_word) DIGIT_BIT));

    /* left hand side of A[ix] * A[iy] */
    tmpx        = a->dp[ix];

    /* alias for where to store the results */
    tmpt        = t.dp + (2*ix + 1);
    
    for (iy = ix + 1; iy < pa; iy++) {
      /* first calculate the product */
      r       = ((mp_word)tmpx) * ((mp_word)a->dp[iy]);

      /* now calculate the double precision result, note we use
       * addition instead of *2 since it's easier to optimize
       */
      r       = ((mp_word) *tmpt) + r + r + ((mp_word) u);

      /* store lower part */
      *tmpt++ = (mp_digit) (r & ((mp_word) MP_MASK));

      /* get carry */
      u       = (mp_digit)(r >> ((mp_word) DIGIT_BIT));
    }
    /* propagate upwards */
    while (u != ((mp_digit) 0)) {
      r       = ((mp_word) *tmpt) + ((mp_word) u);
      *tmpt++ = (mp_digit) (r & ((mp_word) MP_MASK));
      u       = (mp_digit)(r >> ((mp_word) DIGIT_BIT));
    }
  }

  mp_clamp (&t);
  mp_exch (&t, b);
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_NEG_C

/* b = -a */
int mp_neg (mp_int * a, mp_int * b)
{
  int     res;
  if (a != b) {
     if ((res = mp_copy (a, b)) != MP_OKAY) {
        return res;
     }
  }

  if (mp_iszero(b) != MP_YES) {
     b->sign = (a->sign == MP_ZPOS) ? MP_NEG : MP_ZPOS;
  } else {
     b->sign = MP_ZPOS;
  }

  return MP_OKAY;
}
#endif

#ifdef BN_MP_RADIX_SMAP_C

/* chars used in radix conversions */
const char *mp_s_rmap = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";
#endif

#ifdef BN_FAST_S_MP_MUL_DIGS_C

/* Fast (comba) multiplier
 *
 * This is the fast column-array [comba] multiplier.  It is 
 * designed to compute the columns of the product first 
 * then handle the carries afterwards.  This has the effect 
 * of making the nested loops that compute the columns very
 * simple and schedulable on super-scalar processors.
 *
 * This has been modified to produce a variable number of 
 * digits of output so if say only a half-product is required 
 * you don't have to compute the upper half (a feature 
 * required for fast Barrett reduction).
 *
 * Based on Algorithm 14.12 on pp.595 of HAC.
 *
 */
int fast_s_mp_mul_digs (mp_int * a, mp_int * b, mp_int * c, int digs)
{
  int     olduse, res, pa, ix, iz;
	mp_digit W[MP_WARRAY] = {};
  register mp_word  _W;

  /* grow the destination as required */
  if (c->alloc < digs) {
    if ((res = mp_grow (c, digs)) != MP_OKAY) {
      return res;
    }
  }

  /* number of output digits to produce */
  pa = MIN(digs, a->used + b->used);

  /* clear the carry */
  _W = 0;
  for (ix = 0; ix < pa; ix++) { 
      int      tx, ty;
      int      iy;
      mp_digit *tmpx, *tmpy;

      /* get offsets into the two bignums */
      ty = MIN(b->used-1, ix);
      tx = ix - ty;

      /* setup temp aliases */
      tmpx = a->dp + tx;
      tmpy = b->dp + ty;

      /* this is the number of times the loop will iterrate, essentially 
         while (tx++ < a->used && ty-- >= 0) { ... }
       */
      iy = MIN(a->used-tx, ty+1);

      /* execute loop */
      for (iz = 0; iz < iy; ++iz) {
         _W += ((mp_word)*tmpx++)*((mp_word)*tmpy--);

      }

      /* store term */
      W[ix] = ((mp_digit)_W) & MP_MASK;

      /* make next carry */
      _W = _W >> ((mp_word)DIGIT_BIT);
 }

  /* setup dest */
  olduse  = c->used;
  c->used = pa;

  {
    register mp_digit *tmpc;
    tmpc = c->dp;
    for (ix = 0; ix < pa+1; ix++) {
      /* now extract the previous digit [below the carry] */
      *tmpc++ = W[ix];
    }

    /* clear unused digits [that existed in the old copy of c] */
    for (; ix < olduse; ix++) {
      *tmpc++ = 0;
    }
  }
  mp_clamp (c);
  return MP_OKAY;
}
#endif

#ifdef BN_FAST_S_MP_MUL_HIGH_DIGS_C

/* this is a modified version of fast_s_mul_digs that only produces
 * output digits *above* digs.  See the comments for fast_s_mul_digs
 * to see how it works.
 *
 * This is used in the Barrett reduction since for one of the multiplications
 * only the higher digits were needed.  This essentially halves the work.
 *
 * Based on Algorithm 14.12 on pp.595 of HAC.
 */
int fast_s_mp_mul_high_digs (mp_int * a, mp_int * b, mp_int * c, int digs)
{
  int     olduse, res, pa, ix, iz;
  mp_digit W[MP_WARRAY];
  mp_word  _W;

  /* grow the destination as required */
  pa = a->used + b->used;
  if (c->alloc < pa) {
    if ((res = mp_grow (c, pa)) != MP_OKAY) {
      return res;
    }
  }

  /* number of output digits to produce */
  pa = a->used + b->used;
  _W = 0;
  for (ix = digs; ix < pa; ix++) { 
      int      tx, ty, iy;
      mp_digit *tmpx, *tmpy;

      /* get offsets into the two bignums */
      ty = MIN(b->used-1, ix);
      tx = ix - ty;

      /* setup temp aliases */
      tmpx = a->dp + tx;
      tmpy = b->dp + ty;

      /* this is the number of times the loop will iterrate, essentially its 
         while (tx++ < a->used && ty-- >= 0) { ... }
       */
      iy = MIN(a->used-tx, ty+1);

      /* execute loop */
      for (iz = 0; iz < iy; iz++) {
         _W += ((mp_word)*tmpx++)*((mp_word)*tmpy--);
      }

      /* store term */
      W[ix] = ((mp_digit)_W) & MP_MASK;

      /* make next carry */
      _W = _W >> ((mp_word)DIGIT_BIT);
  }
  
  /* setup dest */
  olduse  = c->used;
  c->used = pa;

  {
    register mp_digit *tmpc;

    tmpc = c->dp + digs;
    for (ix = digs; ix < pa; ix++) {
      /* now extract the previous digit [below the carry] */
      *tmpc++ = W[ix];
    }

    /* clear unused digits [that existed in the old copy of c] */
    for (; ix < olduse; ix++) {
      *tmpc++ = 0;
    }
  }
  mp_clamp (c);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_REDUCE_2K_C

/* reduces a modulo n where n is of the form 2**p - d */
int mp_reduce_2k(mp_int *a, mp_int *n, mp_digit d)
{
   mp_int q;
   int    p, res;
   
   if ((res = mp_init(&q)) != MP_OKAY) {
      return res;
   }
   
   p = mp_count_bits(n);    
top:
   /* q = a/2**p, a = a mod 2**p */
   if ((res = mp_div_2d(a, p, &q, a)) != MP_OKAY) {
      goto ERR;
   }
   
   if (d != 1) {
      /* q = q * d */
      if ((res = mp_mul_d(&q, d, &q)) != MP_OKAY) { 
         goto ERR;
      }
   }
   
   /* a = a + q */
   if ((res = s_mp_add(a, &q, a)) != MP_OKAY) {
      goto ERR;
   }
   
   if (mp_cmp_mag(a, n) != MP_LT) {
      s_mp_sub(a, n, a);
      goto top;
   }
   
ERR:
   mp_clear(&q);
   return res;
}

#endif

#ifdef BN_MP_SET_C

/* set to a digit */
void mp_set (mp_int * a, mp_digit b)
{
  mp_zero (a);
  a->dp[0] = b & MP_MASK;
  a->used  = (a->dp[0] != 0) ? 1 : 0;
}
#endif

#ifdef BN_MP_MOD_D_C

int
mp_mod_d (mp_int * a, mp_digit b, mp_digit * c)
{
  return mp_div_d(a, b, NULL, c);
}
#endif

#ifdef BN_MP_COPY_C

/* copy, b = a */
int
mp_copy (mp_int * a, mp_int * b)
{
  int     res, n;

  /* if dst == src do nothing */
  if (a == b) {
    return MP_OKAY;
  }

  /* grow dest */
  if (b->alloc < a->used) {
     if ((res = mp_grow (b, a->used)) != MP_OKAY) {
        return res;
     }
  }

  /* zero b and copy the parameters over */
  {
    register mp_digit *tmpa, *tmpb;

    /* pointer aliases */

    /* source */
    tmpa = a->dp;

    /* destination */
    tmpb = b->dp;

    /* copy all the digits */
    for (n = 0; n < a->used; n++) {
      *tmpb++ = *tmpa++;
    }

    /* clear high digits */
    for (; n < b->used; n++) {
      *tmpb++ = 0;
    }
  }

  /* copy used count and sign */
  b->used = a->used;
  b->sign = a->sign;
  return MP_OKAY;
}
#endif

#ifdef BN_MP_TO_SIGNED_BIN_N_C

/* store in signed [big endian] format */
int mp_to_signed_bin_n (mp_int * a, unsigned char *b, unsigned long *outlen)
{
   if (*outlen < (unsigned long)mp_signed_bin_size(a)) {
      return MP_VAL;
   }
   *outlen = mp_signed_bin_size(a);
   return mp_to_signed_bin(a, b);
}
#endif

#ifdef BN_FAST_S_MP_SQR_C

/* the jist of squaring...
 * you do like mult except the offset of the tmpx [one that 
 * starts closer to zero] can't equal the offset of tmpy.  
 * So basically you set up iy like before then you min it with
 * (ty-tx) so that it never happens.  You double all those 
 * you add in the inner loop

After that loop you do the squares and add them in.
*/

int fast_s_mp_sqr (mp_int * a, mp_int * b)
{
  int       olduse, res, pa, ix, iz;
  mp_digit   W[MP_WARRAY], *tmpx;
  mp_word   W1;

  /* grow the destination as required */
  pa = a->used + a->used;
  if (b->alloc < pa) {
    if ((res = mp_grow (b, pa)) != MP_OKAY) {
      return res;
    }
  }

  /* number of output digits to produce */
  W1 = 0;
  for (ix = 0; ix < pa; ix++) { 
      int      tx, ty, iy;
      mp_word  _W;
      mp_digit *tmpy;

      /* clear counter */
      _W = 0;

      /* get offsets into the two bignums */
      ty = MIN(a->used-1, ix);
      tx = ix - ty;

      /* setup temp aliases */
      tmpx = a->dp + tx;
      tmpy = a->dp + ty;

      /* this is the number of times the loop will iterrate, essentially
         while (tx++ < a->used && ty-- >= 0) { ... }
       */
      iy = MIN(a->used-tx, ty+1);

      /* now for squaring tx can never equal ty 
       * we halve the distance since they approach at a rate of 2x
       * and we have to round because odd cases need to be executed
       */
      iy = MIN(iy, (ty-tx+1)>>1);

      /* execute loop */
      for (iz = 0; iz < iy; iz++) {
         _W += ((mp_word)*tmpx++)*((mp_word)*tmpy--);
      }

      /* double the inner product and add carry */
      _W = _W + _W + W1;

      /* even columns have the square term in them */
      if ((ix&1) == 0) {
         _W += ((mp_word)a->dp[ix>>1])*((mp_word)a->dp[ix>>1]);
      }

      /* store it */
      W[ix] = (mp_digit)(_W & MP_MASK);

      /* make next carry */
      W1 = _W >> ((mp_word)DIGIT_BIT);
  }

  /* setup dest */
  olduse  = b->used;
  b->used = a->used+a->used;

  {
    mp_digit *tmpb;
    tmpb = b->dp;
    for (ix = 0; ix < pa; ix++) {
      *tmpb++ = W[ix] & MP_MASK;
    }

    /* clear unused digits [that existed in the old copy of c] */
    for (; ix < olduse; ix++) {
      *tmpb++ = 0;
    }
  }
  mp_clamp (b);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_SHRINK_C

/* shrink a bignum */
int mp_shrink (mp_int * a)
{
  mp_digit *tmp;
  int used = 1;
  
  if(a->used > 0)
    used = a->used;
  
  if (a->alloc != used) {
    if ((tmp = OPT_CAST(mp_digit) XREALLOC (a->dp, sizeof (mp_digit) * used)) == NULL) {
      return MP_MEM;
    }
    a->dp    = tmp;
    a->alloc = used;
  }
  return MP_OKAY;
}
#endif

#ifdef BN_MP_2EXPT_C

/* computes a = 2**b 
 *
 * Simple algorithm which zeroes the int, grows it then just sets one bit
 * as required.
 */
int
mp_2expt (mp_int * a, int b)
{
  int     res;

  /* zero a as per default */
  mp_zero (a);

  /* grow a to accomodate the single bit */
  if ((res = mp_grow (a, b / DIGIT_BIT + 1)) != MP_OKAY) {
    return res;
  }

  /* set the used count of where the bit will go */
  a->used = b / DIGIT_BIT + 1;

  /* put the single bit in its place */
  a->dp[b / DIGIT_BIT] = ((mp_digit)1) << (b % DIGIT_BIT);

  return MP_OKAY;
}
#endif

#ifdef BN_MP_DR_REDUCE_C

/* reduce "x" in place modulo "n" using the Diminished Radix algorithm.
 *
 * Based on algorithm from the paper
 *
 * "Generating Efficient Primes for Discrete Log Cryptosystems"
 *                 Chae Hoon Lim, Pil Joong Lee,
 *          POSTECH Information Research Laboratories
 *
 * The modulus must be of a special format [see manual]
 *
 * Has been modified to use algorithm 7.10 from the LTM book instead
 *
 * Input x must be in the range 0 <= x <= (n-1)**2
 */
int
mp_dr_reduce (mp_int * x, mp_int * n, mp_digit k)
{
  int      err, i, m;
  mp_word  r;
  mp_digit mu, *tmpx1, *tmpx2;

  /* m = digits in modulus */
  m = n->used;

  /* ensure that "x" has at least 2m digits */
  if (x->alloc < m + m) {
    if ((err = mp_grow (x, m + m)) != MP_OKAY) {
      return err;
    }
  }

/* top of loop, this is where the code resumes if
 * another reduction pass is required.
 */
top:
  /* aliases for digits */
  /* alias for lower half of x */
  tmpx1 = x->dp;

  /* alias for upper half of x, or x/B**m */
  tmpx2 = x->dp + m;

  /* set carry to zero */
  mu = 0;

  /* compute (x mod B**m) + k * [x/B**m] inline and inplace */
  for (i = 0; i < m; i++) {
      r         = ((mp_word)*tmpx2++) * ((mp_word)k) + *tmpx1 + mu;
      *tmpx1++  = (mp_digit)(r & MP_MASK);
      mu        = (mp_digit)(r >> ((mp_word)DIGIT_BIT));
  }

  /* set final carry */
  *tmpx1++ = mu;

  /* zero words above m */
  for (i = m + 1; i < x->used; i++) {
      *tmpx1++ = 0;
  }

  /* clamp, sub and return */
  mp_clamp (x);

  /* if x >= n then subtract and reduce again
   * Each successive "recursion" makes the input smaller and smaller.
   */
  if (mp_cmp_mag (x, n) != MP_LT) {
    s_mp_sub(x, n, x);
    goto top;
  }
  return MP_OKAY;
}
#endif

#ifdef BN_MP_TORADIX_N_C

/* stores a bignum as a ASCII string in a given radix (2..64) 
 *
 * Stores upto maxlen-1 chars and always a NULL byte 
 */
int mp_toradix_n(mp_int * a, char *str, int radix, int maxlen)
{
  int     res, digs;
  mp_int  t;
  mp_digit d;
  char   *_s = str;

  /* check range of the maxlen, radix */
  if (maxlen < 2 || radix < 2 || radix > 64) {
    return MP_VAL;
  }

  /* quick out if its zero */
  if (mp_iszero(a) == MP_YES) {
     *str++ = '0';
     *str = '\0';
     return MP_OKAY;
  }

  if ((res = mp_init_copy (&t, a)) != MP_OKAY) {
    return res;
  }

  /* if it is negative output a - */
  if (t.sign == MP_NEG) {
    /* we have to reverse our digits later... but not the - sign!! */
    ++_s;

    /* store the flag and mark the number as positive */
    *str++ = '-';
    t.sign = MP_ZPOS;
 
    /* subtract a char */
    --maxlen;
  }

  digs = 0;
  while (mp_iszero (&t) == 0) {
    if (--maxlen < 1) {
       /* no more room */
       break;
    }
    if ((res = mp_div_d (&t, (mp_digit) radix, &t, &d)) != MP_OKAY) {
      mp_clear (&t);
      return res;
    }
    *str++ = mp_s_rmap[d];
    ++digs;
  }

  /* reverse the digits of the string.  In this case _s points
   * to the first digit [exluding the sign] of the number
   */
  bn_reverse ((unsigned char *)_s, digs);

  /* append a NULL so the string is properly terminated */
  *str = '\0';

  mp_clear (&t);
  return MP_OKAY;
}

#endif

#ifdef BN_MP_PRIME_MILLER_RABIN_C

/* Miller-Rabin test of "a" to the base of "b" as described in 
 * HAC pp. 139 Algorithm 4.24
 *
 * Sets result to 0 if definitely composite or 1 if probably prime.
 * Randomly the chance of error is no more than 1/4 and often 
 * very much lower.
 */
int mp_prime_miller_rabin (mp_int * a, mp_int * b, int *result)
{
  mp_int  n1, y, r;
  int     s, j, err;

  /* default */
  *result = MP_NO;

  /* ensure b > 1 */
  if (mp_cmp_d(b, 1) != MP_GT) {
     return MP_VAL;
  }     

  /* get n1 = a - 1 */
  if ((err = mp_init_copy (&n1, a)) != MP_OKAY) {
    return err;
  }
  if ((err = mp_sub_d (&n1, 1, &n1)) != MP_OKAY) {
    goto LBL_N1;
  }

  /* set 2**s * r = n1 */
  if ((err = mp_init_copy (&r, &n1)) != MP_OKAY) {
    goto LBL_N1;
  }

  /* count the number of least significant bits
   * which are zero
   */
  s = mp_cnt_lsb(&r);

  /* now divide n - 1 by 2**s */
  if ((err = mp_div_2d (&r, s, &r, NULL)) != MP_OKAY) {
    goto LBL_R;
  }

  /* compute y = b**r mod a */
  if ((err = mp_init (&y)) != MP_OKAY) {
    goto LBL_R;
  }
  if ((err = mp_exptmod (b, &r, a, &y)) != MP_OKAY) {
    goto LBL_Y;
  }

  /* if y != 1 and y != n1 do */
  if (mp_cmp_d (&y, 1) != MP_EQ && mp_cmp (&y, &n1) != MP_EQ) {
    j = 1;
    /* while j <= s-1 and y != n1 */
    while ((j <= (s - 1)) && mp_cmp (&y, &n1) != MP_EQ) {
      if ((err = mp_sqrmod (&y, a, &y)) != MP_OKAY) {
         goto LBL_Y;
      }

      /* if y == 1 then composite */
      if (mp_cmp_d (&y, 1) == MP_EQ) {
         goto LBL_Y;
      }

      ++j;
    }

    /* if y != n1 then composite */
    if (mp_cmp (&y, &n1) != MP_EQ) {
      goto LBL_Y;
    }
  }

  /* probably prime now */
  *result = MP_YES;
LBL_Y:mp_clear (&y);
LBL_R:mp_clear (&r);
LBL_N1:mp_clear (&n1);
  return err;
}
#endif

#ifdef BN_MP_REDUCE_IS_2K_L_C

/* determines if reduce_2k_l can be used */
int mp_reduce_is_2k_l(mp_int *a)
{
   int ix, iy;
   
   if (a->used == 0) {
      return MP_NO;
   } else if (a->used == 1) {
      return MP_YES;
   } else if (a->used > 1) {
      /* if more than half of the digits are -1 we're sold */
      for (iy = ix = 0; ix < a->used; ix++) {
          if (a->dp[ix] == MP_MASK) {
              ++iy;
          }
      }
      return (iy >= (a->used/2)) ? MP_YES : MP_NO;
      
   }
   return MP_NO;
}

#endif

#ifdef BN_MP_DR_SETUP_C

/* determines the setup value */
void mp_dr_setup(mp_int *a, mp_digit *d)
{
   /* the casts are required if DIGIT_BIT is one less than
    * the number of bits in a mp_digit [e.g. DIGIT_BIT==31]
    */
   *d = (mp_digit)((((mp_word)1) << ((mp_word)DIGIT_BIT)) - 
        ((mp_word)a->dp[0]));
}

#endif

#ifdef BN_MP_REDUCE_2K_SETUP_C

/* determines the setup value */
int mp_reduce_2k_setup(mp_int *a, mp_digit *d)
{
   int res, p;
   mp_int tmp;
   
   if ((res = mp_init(&tmp)) != MP_OKAY) {
      return res;
   }
   
   p = mp_count_bits(a);
   if ((res = mp_2expt(&tmp, p)) != MP_OKAY) {
      mp_clear(&tmp);
      return res;
   }
   
   if ((res = s_mp_sub(&tmp, a, &tmp)) != MP_OKAY) {
      mp_clear(&tmp);
      return res;
   }
   
   *d = tmp.dp[0];
   mp_clear(&tmp);
   return MP_OKAY;
}
#endif

#ifdef BN_MP_REDUCE_SETUP_C

/* pre-calculate the value required for Barrett reduction
 * For a given modulus "b" it calulates the value required in "a"
 */
int mp_reduce_setup (mp_int * a, mp_int * b)
{
  int     res;
  
  if ((res = mp_2expt (a, b->used * 2 * DIGIT_BIT)) != MP_OKAY) {
    return res;
  }
  return mp_div (a, b, a, NULL);
}
#endif

#ifdef BN_MP_GCD_C

/* Greatest Common Divisor using the binary method */
int mp_gcd (mp_int * a, mp_int * b, mp_int * c)
{
  mp_int  u, v;
  int     k, u_lsb, v_lsb, res;

  /* either zero than gcd is the largest */
  if (mp_iszero (a) == MP_YES) {
    return mp_abs (b, c);
  }
  if (mp_iszero (b) == MP_YES) {
    return mp_abs (a, c);
  }

  /* get copies of a and b we can modify */
  if ((res = mp_init_copy (&u, a)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_init_copy (&v, b)) != MP_OKAY) {
    goto LBL_U;
  }

  /* must be positive for the remainder of the algorithm */
  u.sign = v.sign = MP_ZPOS;

  /* B1.  Find the common power of two for u and v */
  u_lsb = mp_cnt_lsb(&u);
  v_lsb = mp_cnt_lsb(&v);
  k     = MIN(u_lsb, v_lsb);

  if (k > 0) {
     /* divide the power of two out */
     if ((res = mp_div_2d(&u, k, &u, NULL)) != MP_OKAY) {
        goto LBL_V;
     }

     if ((res = mp_div_2d(&v, k, &v, NULL)) != MP_OKAY) {
        goto LBL_V;
     }
  }

  /* divide any remaining factors of two out */
  if (u_lsb != k) {
     if ((res = mp_div_2d(&u, u_lsb - k, &u, NULL)) != MP_OKAY) {
        goto LBL_V;
     }
  }

  if (v_lsb != k) {
     if ((res = mp_div_2d(&v, v_lsb - k, &v, NULL)) != MP_OKAY) {
        goto LBL_V;
     }
  }

  while (mp_iszero(&v) == 0) {
     /* make sure v is the largest */
     if (mp_cmp_mag(&u, &v) == MP_GT) {
        /* swap u and v to make sure v is >= u */
        mp_exch(&u, &v);
     }
     
     /* subtract smallest from largest */
     if ((res = s_mp_sub(&v, &u, &v)) != MP_OKAY) {
        goto LBL_V;
     }
     
     /* Divide out all factors of two */
     if ((res = mp_div_2d(&v, mp_cnt_lsb(&v), &v, NULL)) != MP_OKAY) {
        goto LBL_V;
     } 
  } 

  /* multiply by 2**k which we divided out at the beginning */
  if ((res = mp_mul_2d (&u, k, c)) != MP_OKAY) {
     goto LBL_V;
  }
  c->sign = MP_ZPOS;
  res = MP_OKAY;
LBL_V:mp_clear (&u);
LBL_U:mp_clear (&v);
  return res;
}
#endif

#ifdef BN_S_MP_SUB_C

/* low level subtraction (assumes |a| > |b|), HAC pp.595 Algorithm 14.9 */
int
s_mp_sub (mp_int * a, mp_int * b, mp_int * c)
{
  int     olduse, res, min, max;

  /* find sizes */
  min = b->used;
  max = a->used;

  /* init result */
  if (c->alloc < max) {
    if ((res = mp_grow (c, max)) != MP_OKAY) {
      return res;
    }
  }
  olduse = c->used;
  c->used = max;

  {
    register mp_digit u, *tmpa, *tmpb, *tmpc;
    register int i;

    /* alias for digit pointers */
    tmpa = a->dp;
    tmpb = b->dp;
    tmpc = c->dp;

    /* set carry to zero */
    u = 0;
    for (i = 0; i < min; i++) {
      /* T[i] = A[i] - B[i] - U */
      *tmpc = *tmpa++ - *tmpb++ - u;

      /* U = carry bit of T[i]
       * Note this saves performing an AND operation since
       * if a carry does occur it will propagate all the way to the
       * MSB.  As a result a single shift is enough to get the carry
       */
      u = *tmpc >> ((mp_digit)(CHAR_BIT * sizeof (mp_digit) - 1));

      /* Clear carry from T[i] */
      *tmpc++ &= MP_MASK;
    }

    /* now copy higher words if any, e.g. if A has more digits than B  */
    for (; i < max; i++) {
      /* T[i] = A[i] - U */
      *tmpc = *tmpa++ - u;

      /* U = carry bit of T[i] */
      u = *tmpc >> ((mp_digit)(CHAR_BIT * sizeof (mp_digit) - 1));

      /* Clear carry from T[i] */
      *tmpc++ &= MP_MASK;
    }

    /* clear digits above used (since we may not have grown result above) */
    for (i = c->used; i < olduse; i++) {
      *tmpc++ = 0;
    }
  }

  mp_clamp (c);
  return MP_OKAY;
}

#endif

#ifdef BN_MP_TOOM_MUL_C

/* multiplication using the Toom-Cook 3-way algorithm 
 *
 * Much more complicated than Karatsuba but has a lower 
 * asymptotic running time of O(N**1.464).  This algorithm is 
 * only particularly useful on VERY large inputs 
 * (we're talking 1000s of digits here...).
*/
int mp_toom_mul(mp_int *a, mp_int *b, mp_int *c)
{
    mp_int w0, w1, w2, w3, w4, tmp1, tmp2, a0, a1, a2, b0, b1, b2;
    int res, B;
        
    /* init temps */
    if ((res = mp_init_multi(&w0, &w1, &w2, &w3, &w4, 
                             &a0, &a1, &a2, &b0, &b1, 
                             &b2, &tmp1, &tmp2, NULL)) != MP_OKAY) {
       return res;
    }
    
    /* B */
    B = MIN(a->used, b->used) / 3;
    
    /* a = a2 * B**2 + a1 * B + a0 */
    if ((res = mp_mod_2d(a, DIGIT_BIT * B, &a0)) != MP_OKAY) {
       goto ERR;
    }

    if ((res = mp_copy(a, &a1)) != MP_OKAY) {
       goto ERR;
    }
    mp_rshd(&a1, B);
    mp_mod_2d(&a1, DIGIT_BIT * B, &a1);

    if ((res = mp_copy(a, &a2)) != MP_OKAY) {
       goto ERR;
    }
    mp_rshd(&a2, B*2);
    
    /* b = b2 * B**2 + b1 * B + b0 */
    if ((res = mp_mod_2d(b, DIGIT_BIT * B, &b0)) != MP_OKAY) {
       goto ERR;
    }

    if ((res = mp_copy(b, &b1)) != MP_OKAY) {
       goto ERR;
    }
    mp_rshd(&b1, B);
    mp_mod_2d(&b1, DIGIT_BIT * B, &b1);

    if ((res = mp_copy(b, &b2)) != MP_OKAY) {
       goto ERR;
    }
    mp_rshd(&b2, B*2);
    
    /* w0 = a0*b0 */
    if ((res = mp_mul(&a0, &b0, &w0)) != MP_OKAY) {
       goto ERR;
    }
    
    /* w4 = a2 * b2 */
    if ((res = mp_mul(&a2, &b2, &w4)) != MP_OKAY) {
       goto ERR;
    }
    
    /* w1 = (a2 + 2(a1 + 2a0))(b2 + 2(b1 + 2b0)) */
    if ((res = mp_mul_2(&a0, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul_2(&tmp1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a2, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    
    if ((res = mp_mul_2(&b0, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp2, &b1, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul_2(&tmp2, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp2, &b2, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    
    if ((res = mp_mul(&tmp1, &tmp2, &w1)) != MP_OKAY) {
       goto ERR;
    }
    
    /* w3 = (a0 + 2(a1 + 2a2))(b0 + 2(b1 + 2b2)) */
    if ((res = mp_mul_2(&a2, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul_2(&tmp1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a0, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    
    if ((res = mp_mul_2(&b2, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp2, &b1, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul_2(&tmp2, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp2, &b0, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    
    if ((res = mp_mul(&tmp1, &tmp2, &w3)) != MP_OKAY) {
       goto ERR;
    }
    

    /* w2 = (a2 + a1 + a0)(b2 + b1 + b0) */
    if ((res = mp_add(&a2, &a1, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp1, &a0, &tmp1)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&b2, &b1, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_add(&tmp2, &b0, &tmp2)) != MP_OKAY) {
       goto ERR;
    }
    if ((res = mp_mul(&tmp1, &tmp2, &w2)) != MP_OKAY) {
       goto ERR;
    }
    
    /* now solve the matrix 
    
       0  0  0  0  1
       1  2  4  8  16
       1  1  1  1  1
       16 8  4  2  1
       1  0  0  0  0
       
       using 12 subtractions, 4 shifts, 
              2 small divisions and 1 small multiplication 
     */
     
     /* r1 - r4 */
     if ((res = mp_sub(&w1, &w4, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - r0 */
     if ((res = mp_sub(&w3, &w0, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r1/2 */
     if ((res = mp_div_2(&w1, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3/2 */
     if ((res = mp_div_2(&w3, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r2 - r0 - r4 */
     if ((res = mp_sub(&w2, &w0, &w2)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w2, &w4, &w2)) != MP_OKAY) {
        goto ERR;
     }
     /* r1 - r2 */
     if ((res = mp_sub(&w1, &w2, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - r2 */
     if ((res = mp_sub(&w3, &w2, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r1 - 8r0 */
     if ((res = mp_mul_2d(&w0, 3, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w1, &tmp1, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - 8r4 */
     if ((res = mp_mul_2d(&w4, 3, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w3, &tmp1, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* 3r2 - r1 - r3 */
     if ((res = mp_mul_d(&w2, 3, &w2)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w2, &w1, &w2)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_sub(&w2, &w3, &w2)) != MP_OKAY) {
        goto ERR;
     }
     /* r1 - r2 */
     if ((res = mp_sub(&w1, &w2, &w1)) != MP_OKAY) {
        goto ERR;
     }
     /* r3 - r2 */
     if ((res = mp_sub(&w3, &w2, &w3)) != MP_OKAY) {
        goto ERR;
     }
     /* r1/3 */
     if ((res = mp_div_3(&w1, &w1, NULL)) != MP_OKAY) {
        goto ERR;
     }
     /* r3/3 */
     if ((res = mp_div_3(&w3, &w3, NULL)) != MP_OKAY) {
        goto ERR;
     }
     
     /* at this point shift W[n] by B*n */
     if ((res = mp_lshd(&w1, 1*B)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_lshd(&w2, 2*B)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_lshd(&w3, 3*B)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_lshd(&w4, 4*B)) != MP_OKAY) {
        goto ERR;
     }     
     
     if ((res = mp_add(&w0, &w1, c)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_add(&w2, &w3, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_add(&w4, &tmp1, &tmp1)) != MP_OKAY) {
        goto ERR;
     }
     if ((res = mp_add(&tmp1, c, c)) != MP_OKAY) {
        goto ERR;
     }     
     
ERR:
     mp_clear_multi(&w0, &w1, &w2, &w3, &w4, 
                    &a0, &a1, &a2, &b0, &b1, 
                    &b2, &tmp1, &tmp2, NULL);
     return res;
}     
     
#endif

#ifdef BN_MP_INIT_SET_INT_C

/* initialize and set a digit */
int mp_init_set_int (mp_int * a, unsigned long b)
{
  int err;
  if ((err = mp_init(a)) != MP_OKAY) {
     return err;
  }
  return mp_set_int(a, b);
}
#endif

#ifdef BN_FAST_MP_INVMOD_C

/* computes the modular inverse via binary extended euclidean algorithm, 
 * that is c = 1/a mod b 
 *
 * Based on slow invmod except this is optimized for the case where b is 
 * odd as per HAC Note 14.64 on pp. 610
 */
int fast_mp_invmod (mp_int * a, mp_int * b, mp_int * c)
{
  mp_int  x, y, u, v, B, D;
  int     res, neg;

  /* 2. [modified] b must be odd   */
  if (mp_iseven (b) == 1) {
    return MP_VAL;
  }

  /* init all our temps */
  if ((res = mp_init_multi(&x, &y, &u, &v, &B, &D, NULL)) != MP_OKAY) {
     return res;
  }

  /* x == modulus, y == value to invert */
  if ((res = mp_copy (b, &x)) != MP_OKAY) {
    goto LBL_ERR;
  }

  /* we need y = |a| */
  if ((res = mp_mod (a, b, &y)) != MP_OKAY) {
    goto LBL_ERR;
  }

  /* 3. u=x, v=y, A=1, B=0, C=0,D=1 */
  if ((res = mp_copy (&x, &u)) != MP_OKAY) {
    goto LBL_ERR;
  }
  if ((res = mp_copy (&y, &v)) != MP_OKAY) {
    goto LBL_ERR;
  }
  mp_set (&D, 1);

top:
  /* 4.  while u is even do */
  while (mp_iseven (&u) == 1) {
    /* 4.1 u = u/2 */
    if ((res = mp_div_2 (&u, &u)) != MP_OKAY) {
      goto LBL_ERR;
    }
    /* 4.2 if B is odd then */
    if (mp_isodd (&B) == 1) {
      if ((res = mp_sub (&B, &x, &B)) != MP_OKAY) {
        goto LBL_ERR;
      }
    }
    /* B = B/2 */
    if ((res = mp_div_2 (&B, &B)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }

  /* 5.  while v is even do */
  while (mp_iseven (&v) == 1) {
    /* 5.1 v = v/2 */
    if ((res = mp_div_2 (&v, &v)) != MP_OKAY) {
      goto LBL_ERR;
    }
    /* 5.2 if D is odd then */
    if (mp_isodd (&D) == 1) {
      /* D = (D-x)/2 */
      if ((res = mp_sub (&D, &x, &D)) != MP_OKAY) {
        goto LBL_ERR;
      }
    }
    /* D = D/2 */
    if ((res = mp_div_2 (&D, &D)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }

  /* 6.  if u >= v then */
  if (mp_cmp (&u, &v) != MP_LT) {
    /* u = u - v, B = B - D */
    if ((res = mp_sub (&u, &v, &u)) != MP_OKAY) {
      goto LBL_ERR;
    }

    if ((res = mp_sub (&B, &D, &B)) != MP_OKAY) {
      goto LBL_ERR;
    }
  } else {
    /* v - v - u, D = D - B */
    if ((res = mp_sub (&v, &u, &v)) != MP_OKAY) {
      goto LBL_ERR;
    }

    if ((res = mp_sub (&D, &B, &D)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }

  /* if not zero goto step 4 */
  if (mp_iszero (&u) == 0) {
    goto top;
  }

  /* now a = C, b = D, gcd == g*v */

  /* if v != 1 then there is no inverse */
  if (mp_cmp_d (&v, 1) != MP_EQ) {
    res = MP_VAL;
    goto LBL_ERR;
  }

  /* b is now the inverse */
  neg = a->sign;
  while (D.sign == MP_NEG) {
    if ((res = mp_add (&D, b, &D)) != MP_OKAY) {
      goto LBL_ERR;
    }
  }
  mp_exch (&D, c);
  c->sign = neg;
  res = MP_OKAY;

LBL_ERR:mp_clear_multi (&x, &y, &u, &v, &B, &D, NULL);
  return res;
}
#endif

#ifdef BN_MP_TO_SIGNED_BIN_C

/* store in signed [big endian] format */
int mp_to_signed_bin (mp_int * a, unsigned char *b)
{
  int     res;

  if ((res = mp_to_unsigned_bin (a, b + 1)) != MP_OKAY) {
    return res;
  }
  b[0] = (unsigned char) ((a->sign == MP_ZPOS) ? 0 : 1);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_MOD_C

/* c = a mod b, 0 <= c < b */
int
mp_mod (mp_int * a, mp_int * b, mp_int * c)
{
  mp_int  t;
  int     res;

  if ((res = mp_init (&t)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_div (a, b, NULL, &t)) != MP_OKAY) {
    mp_clear (&t);
    return res;
  }

  if (t.sign != b->sign) {
    res = mp_add (b, &t, c);
  } else {
    res = MP_OKAY;
    mp_exch (&t, c);
  }

  mp_clear (&t);
  return res;
}
#endif

#ifdef BN_MP_DR_IS_MODULUS_C

/* determines if a number is a valid DR modulus */
int mp_dr_is_modulus(mp_int *a)
{
   int ix;

   /* must be at least two digits */
   if (a->used < 2) {
      return 0;
   }

   /* must be of the form b**k - a [a <= b] so all
    * but the first digit must be equal to -1 (mod b).
    */
   for (ix = 1; ix < a->used; ix++) {
       if (a->dp[ix] != MP_MASK) {
          return 0;
       }
   }
   return 1;
}

#endif

#ifdef BN_MP_IS_SQUARE_C

/* Check if remainders are possible squares - fast exclude non-squares */
static const char rem_128[128] = {
 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1
};

static const char rem_105[105] = {
 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1,
 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1,
 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1,
 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1
};

/* Store non-zero to ret if arg is square, and zero if not */
int mp_is_square(mp_int *arg,int *ret) 
{
  int           res;
  mp_digit      c;
  mp_int        t;
  unsigned long r;

  /* Default to Non-square :) */
  *ret = MP_NO; 

  if (arg->sign == MP_NEG) {
    return MP_VAL;
  }

  /* digits used?  (TSD) */
  if (arg->used == 0) {
     return MP_OKAY;
  }

  /* First check mod 128 (suppose that DIGIT_BIT is at least 7) */
  if (rem_128[127 & DIGIT(arg,0)] == 1) {
     return MP_OKAY;
  }

  /* Next check mod 105 (3*5*7) */
  if ((res = mp_mod_d(arg,105,&c)) != MP_OKAY) {
     return res;
  }
  if (rem_105[c] == 1) {
     return MP_OKAY;
  }


  if ((res = mp_init_set_int(&t,11L*13L*17L*19L*23L*29L*31L)) != MP_OKAY) {
     return res;
  }
  if ((res = mp_mod(arg,&t,&t)) != MP_OKAY) {
     goto ERR;
  }
  r = mp_get_int(&t);
  /* Check for other prime modules, note it's not an ERROR but we must
   * free "t" so the easiest way is to goto ERR.  We know that res
   * is already equal to MP_OKAY from the mp_mod call 
   */ 
  if ( (1L<<(r%11)) & 0x5C4L )             goto ERR;
  if ( (1L<<(r%13)) & 0x9E4L )             goto ERR;
  if ( (1L<<(r%17)) & 0x5CE8L )            goto ERR;
  if ( (1L<<(r%19)) & 0x4F50CL )           goto ERR;
  if ( (1L<<(r%23)) & 0x7ACCA0L )          goto ERR;
  if ( (1L<<(r%29)) & 0xC2EDD0CL )         goto ERR;
  if ( (1L<<(r%31)) & 0x6DE2B848L )        goto ERR;

  /* Final check - is sqr(sqrt(arg)) == arg ? */
  if ((res = mp_sqrt(arg,&t)) != MP_OKAY) {
     goto ERR;
  }
  if ((res = mp_sqr(&t,&t)) != MP_OKAY) {
     goto ERR;
  }

  *ret = (mp_cmp_mag(&t,arg) == MP_EQ) ? MP_YES : MP_NO;
ERR:mp_clear(&t);
  return res;
}
#endif

#ifdef BN_MP_SUBMOD_C

/* d = a - b (mod c) */
int
mp_submod (mp_int * a, mp_int * b, mp_int * c, mp_int * d)
{
  int     res;
  mp_int  t;


  if ((res = mp_init (&t)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_sub (a, b, &t)) != MP_OKAY) {
    mp_clear (&t);
    return res;
  }
  res = mp_mod (&t, c, d);
  mp_clear (&t);
  return res;
}
#endif

#ifdef BN_MP_RAND_C

/* makes a pseudo-random int of a given size */
int
mp_rand (mp_int * a, int digits)
{
  int     res;
  mp_digit d;

  mp_zero (a);
  if (digits <= 0) {
    return MP_OKAY;
  }

  /* first place a random non-zero digit */
  do {
    d = ((mp_digit) abs (rand ())) & MP_MASK;
  } while (d == 0);

  if ((res = mp_add_d (a, d, a)) != MP_OKAY) {
    return res;
  }

  while (--digits > 0) {
    if ((res = mp_lshd (a, 1)) != MP_OKAY) {
      return res;
    }

    if ((res = mp_add_d (a, ((mp_digit) abs (rand ())), a)) != MP_OKAY) {
      return res;
    }
  }

  return MP_OKAY;
}
#endif

#ifdef BN_MP_READ_RADIX_C

/* read a string [ASCII] in a given radix */
int mp_read_radix (mp_int * a, const char *str, int radix)
{
  int     y, res, neg;
  char    ch;

  /* zero the digit bignum */
  mp_zero(a);

  /* make sure the radix is ok */
  if (radix < 2 || radix > 64) {
    return MP_VAL;
  }

  /* if the leading digit is a 
   * minus set the sign to negative. 
   */
  if (*str == '-') {
    ++str;
    neg = MP_NEG;
  } else {
    neg = MP_ZPOS;
  }

  /* set the integer to the default of zero */
  mp_zero (a);
  
  /* process each digit of the string */
  while (*str) {
    /* if the radix < 36 the conversion is case insensitive
     * this allows numbers like 1AB and 1ab to represent the same  value
     * [e.g. in hex]
     */
    ch = (char) ((radix < 36) ? toupper (*str) : *str);
    for (y = 0; y < 64; y++) {
      if (ch == mp_s_rmap[y]) {
         break;
      }
    }

    /* if the char was found in the map 
     * and is less than the given radix add it
     * to the number, otherwise exit the loop. 
     */
    if (y < radix) {
      if ((res = mp_mul_d (a, (mp_digit) radix, a)) != MP_OKAY) {
         return res;
      }
      if ((res = mp_add_d (a, (mp_digit) y, a)) != MP_OKAY) {
         return res;
      }
    } else {
      break;
    }
    ++str;
  }
  
  /* set the sign only if a != 0 */
  if (mp_iszero(a) != 1) {
     a->sign = neg;
  }
  return MP_OKAY;
}
#endif

#ifdef BN_MP_CLEAR_MULTI_C

#include <stdarg.h>

void mp_clear_multi(mp_int *mp, ...) 
{
    mp_int* next_mp = mp;
    va_list args;
    va_start(args, mp);
    while (next_mp != NULL) {
        mp_clear(next_mp);
        next_mp = va_arg(args, mp_int*);
    }
    va_end(args);
}
#endif

#ifdef BN_MP_ADDMOD_C

/* d = a + b (mod c) */
int
mp_addmod (mp_int * a, mp_int * b, mp_int * c, mp_int * d)
{
  int     res;
  mp_int  t;

  if ((res = mp_init (&t)) != MP_OKAY) {
    return res;
  }

  if ((res = mp_add (a, b, &t)) != MP_OKAY) {
    mp_clear (&t);
    return res;
  }
  res = mp_mod (&t, c, d);
  mp_clear (&t);
  return res;
}
#endif

#ifdef BN_S_MP_MUL_HIGH_DIGS_C

/* multiplies |a| * |b| and does not compute the lower digs digits
 * [meant to get the higher part of the product]
 */
int
s_mp_mul_high_digs (mp_int * a, mp_int * b, mp_int * c, int digs)
{
  mp_int  t;
  int     res, pa, pb, ix, iy;
  mp_digit u;
  mp_word r;
  mp_digit tmpx, *tmpt, *tmpy;

  /* can we use the fast multiplier? */
#ifdef BN_FAST_S_MP_MUL_HIGH_DIGS_C
  if (((a->used + b->used + 1) < MP_WARRAY)
      && MIN (a->used, b->used) < (1 << ((CHAR_BIT * sizeof (mp_word)) - (2 * DIGIT_BIT)))) {
    return fast_s_mp_mul_high_digs (a, b, c, digs);
  }
#endif

  if ((res = mp_init_size (&t, a->used + b->used + 1)) != MP_OKAY) {
    return res;
  }
  t.used = a->used + b->used + 1;

  pa = a->used;
  pb = b->used;
  for (ix = 0; ix < pa; ix++) {
    /* clear the carry */
    u = 0;

    /* left hand side of A[ix] * B[iy] */
    tmpx = a->dp[ix];

    /* alias to the address of where the digits will be stored */
    tmpt = &(t.dp[digs]);

    /* alias for where to read the right hand side from */
    tmpy = b->dp + (digs - ix);

    for (iy = digs - ix; iy < pb; iy++) {
      /* calculate the double precision result */
      r       = ((mp_word)*tmpt) +
                ((mp_word)tmpx) * ((mp_word)*tmpy++) +
                ((mp_word) u);

      /* get the lower part */
      *tmpt++ = (mp_digit) (r & ((mp_word) MP_MASK));

      /* carry the carry */
      u       = (mp_digit) (r >> ((mp_word) DIGIT_BIT));
    }
    *tmpt = u;
  }
  mp_clamp (&t);
  mp_exch (&t, c);
  mp_clear (&t);
  return MP_OKAY;
}
#endif

#ifdef BN_MP_UNSIGNED_BIN_SIZE_C

/* get the size for an unsigned equivalent */
int mp_unsigned_bin_size (mp_int * a)
{
  int     size = mp_count_bits (a);
  return (size / 8 + ((size & 7) != 0 ? 1 : 0));
}
#endif