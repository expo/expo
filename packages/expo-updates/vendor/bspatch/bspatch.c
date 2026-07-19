/*-
 * SPDX-License-Identifier: BSD-2-Clause
 *
 * Copyright 2003-2005 Colin Percival
 * All rights reserved
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted providing that the following conditions 
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

#include <sys/types.h>

#include <bzlib.h>

#include <fcntl.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#ifndef O_BINARY
#define O_BINARY 0
#endif

#ifndef SSIZE_MAX
#define SSIZE_MAX ((ssize_t)(((size_t)-1) >> 1))
#endif

#ifndef OFF_MAX
#define OFF_MAX ((off_t)(((unsigned long long)1 << (sizeof(off_t) * CHAR_BIT - 1)) - 1))
#endif

#ifndef OFF_MIN
#define OFF_MIN (-OFF_MAX - (off_t)1)
#endif

#define HEADER_SIZE 32

struct bspatch_context {
	FILE *cpf, *dpf, *epf;
	BZFILE *cpfbz2, *dpfbz2, *epfbz2;
	int cbz2err, dbz2err, ebz2err;
	u_char *old_buf;
	u_char *new_buf;
	off_t old_size;
};

static void
cleanup_context(struct bspatch_context *ctx)
{
	if (ctx->cpfbz2 != NULL)
		BZ2_bzReadClose(&ctx->cbz2err, ctx->cpfbz2);
	if (ctx->dpfbz2 != NULL)
		BZ2_bzReadClose(&ctx->dbz2err, ctx->dpfbz2);
	if (ctx->epfbz2 != NULL)
		BZ2_bzReadClose(&ctx->ebz2err, ctx->epfbz2);
	if (ctx->cpf != NULL)
		fclose(ctx->cpf);
	if (ctx->dpf != NULL)
		fclose(ctx->dpf);
	if (ctx->epf != NULL)
		fclose(ctx->epf);
	free(ctx->old_buf);
	free(ctx->new_buf);
	ctx->cpfbz2 = NULL;
	ctx->dpfbz2 = NULL;
	ctx->epfbz2 = NULL;
	ctx->cpf = NULL;
	ctx->dpf = NULL;
	ctx->epf = NULL;
	ctx->old_buf = NULL;
	ctx->new_buf = NULL;
}

static int
add_off_t(off_t a, off_t b, off_t *result)
{
	if ((b > 0 && a > OFF_MAX - b) ||
	    (b < 0 && a < OFF_MIN - b)) {
		return -1;
	}
	*result = a + b;
	return 0;
}

static off_t
offtin(const u_char *buf)
{
	off_t y;

	y = buf[7] & 0x7F;
	y = y * 256; y += buf[6];
	y = y * 256; y += buf[5];
	y = y * 256; y += buf[4];
	y = y * 256; y += buf[3];
	y = y * 256; y += buf[2];
	y = y * 256; y += buf[1];
	y = y * 256; y += buf[0];

	if (buf[7] & 0x80)
		y = -y;

	return y;
}

static int
read_fully(int fd, u_char *buffer, off_t length)
{
	off_t total = 0;
	while (total < length) {
		size_t chunk = (size_t)(length - total);
		ssize_t bytes_read = read(fd, buffer + total, chunk);
		if (bytes_read <= 0)
			return -1;
		total += bytes_read;
	}
	return 0;
}

static int
write_fully(int fd, const u_char *buffer, off_t length)
{
	off_t total = 0;
	while (total < length) {
		size_t chunk = (size_t)(length - total);
		ssize_t bytes_written = write(fd, buffer + total, chunk);
		if (bytes_written <= 0)
			return -1;
		total += bytes_written;
	}
	return 0;
}

static int
prepare_patch_streams(const char *patch_path, off_t bzctrllen, off_t bzdatalen,
	struct bspatch_context *ctx)
{
	off_t offset;

	ctx->cpf = fopen(patch_path, "rb");
	if (ctx->cpf == NULL)
		return -1;
	if (fseeko(ctx->cpf, HEADER_SIZE, SEEK_SET) != 0)
		return -1;
	ctx->cpfbz2 = BZ2_bzReadOpen(&ctx->cbz2err, ctx->cpf, 0, 0, NULL, 0);
	if (ctx->cpfbz2 == NULL)
		return -1;

	ctx->dpf = fopen(patch_path, "rb");
	if (ctx->dpf == NULL)
		return -1;
	if (add_off_t(HEADER_SIZE, bzctrllen, &offset) != 0)
		return -1;
	if (fseeko(ctx->dpf, offset, SEEK_SET) != 0)
		return -1;
	ctx->dpfbz2 = BZ2_bzReadOpen(&ctx->dbz2err, ctx->dpf, 0, 0, NULL, 0);
	if (ctx->dpfbz2 == NULL)
		return -1;

	ctx->epf = fopen(patch_path, "rb");
	if (ctx->epf == NULL)
		return -1;
	if (add_off_t(offset, bzdatalen, &offset) != 0)
		return -1;
	if (fseeko(ctx->epf, offset, SEEK_SET) != 0)
		return -1;
	ctx->epfbz2 = BZ2_bzReadOpen(&ctx->ebz2err, ctx->epf, 0, 0, NULL, 0);
	if (ctx->epfbz2 == NULL)
		return -1;

	return 0;
}

static int
load_old_file(const char *path, struct bspatch_context *ctx)
{
	int fd = -1;

	fd = open(path, O_RDONLY | O_BINARY, 0);
	if (fd < 0)
		return -1;

	ctx->old_size = lseek(fd, 0, SEEK_END);
	if (ctx->old_size == (off_t)-1 || ctx->old_size > SSIZE_MAX) {
		close(fd);
		return -1;
	}
	if (ctx->old_size > 0) {
		if (lseek(fd, 0, SEEK_SET) != 0) {
			close(fd);
			return -1;
		}
		ctx->old_buf = (u_char *)malloc((size_t)ctx->old_size);
		if (ctx->old_buf == NULL) {
			close(fd);
			return -1;
		}
		if (read_fully(fd, ctx->old_buf, ctx->old_size) != 0) {
			close(fd);
			return -1;
		}
	}

	if (close(fd) != 0)
		return -1;

	return 0;
}

static int
allocate_new_buffer(ssize_t newsize, struct bspatch_context *ctx)
{
	if (newsize <= 0)
		return 0;
	ctx->new_buf = (u_char *)malloc((size_t)newsize);
	if (ctx->new_buf == NULL)
		return -1;
	return 0;
}

static int
write_new_file(const char *path, const struct bspatch_context *ctx, ssize_t newsize)
{
	int fd;
	int result = 0;
	int need_unlink = 0;

	fd = open(path, O_CREAT | O_TRUNC | O_WRONLY | O_BINARY, 0666);
	if (fd < 0)
		return -1;
	need_unlink = 1;

	if (newsize > 0 && write_fully(fd, ctx->new_buf, newsize) != 0)
		result = -1;

	if (close(fd) != 0)
		result = -1;

	if (result != 0 && need_unlink)
		unlink(path);

	return result;
}

int
bspatch_main(int argc, char *argv[])
{
	struct bspatch_context ctx = {0};
	FILE *header = NULL;
	int result = 1;
	ssize_t newsize;
	off_t bzctrllen, bzdatalen;
	u_char header_bytes[HEADER_SIZE];
	u_char buf[8];
	off_t oldpos = 0;
	off_t newpos = 0;
	off_t ctrl[3];
	int lenread;
	int ok = 0;

	if (argc != 4)
		return 1;

	if ((header = fopen(argv[3], "rb")) == NULL)
		goto done;

	if (fread(header_bytes, 1, HEADER_SIZE, header) < HEADER_SIZE)
		goto done;

	if (memcmp(header_bytes, "BSDIFF40", 8) != 0)
		goto done;

	bzctrllen = offtin(header_bytes + 8);
	bzdatalen = offtin(header_bytes + 16);
	newsize = (ssize_t)offtin(header_bytes + 24);
	if (bzctrllen < 0 ||
	    bzctrllen > OFF_MAX - HEADER_SIZE ||
	    bzdatalen < 0 ||
	    bzctrllen + HEADER_SIZE > OFF_MAX - bzdatalen ||
	    newsize < 0 ||
	    newsize > SSIZE_MAX)
		goto done;

	if (fclose(header) != 0)
		goto done;
	header = NULL;

	if (prepare_patch_streams(argv[3], bzctrllen, bzdatalen, &ctx) != 0)
		goto done;

	if (load_old_file(argv[1], &ctx) != 0)
		goto done;

	if (allocate_new_buffer(newsize, &ctx) != 0)
		goto done;

	ok = 1;
	while (ok && newpos < newsize) {
		for (int i = 0; i <= 2; i++) {
			lenread = BZ2_bzRead(&ctx.cbz2err, ctx.cpfbz2, buf, (int)sizeof(buf));
			if ((off_t)lenread < (off_t)sizeof(buf) ||
			    (ctx.cbz2err != BZ_OK && ctx.cbz2err != BZ_STREAM_END)) {
				ok = 0;
				break;
			}
			ctrl[i] = offtin(buf);
		}
		if (!ok)
			break;

		if (ctrl[0] < 0 || ctrl[0] > INT_MAX ||
		    ctrl[1] < 0 || ctrl[1] > INT_MAX) {
			ok = 0;
			break;
		}

		off_t new_limit;
		if (add_off_t(newpos, ctrl[0], &new_limit) != 0 ||
		    new_limit > newsize) {
			ok = 0;
			break;
		}

		lenread = BZ2_bzRead(&ctx.dbz2err, ctx.dpfbz2,
		    ctx.new_buf + newpos, (int)ctrl[0]);
		if ((off_t)lenread < ctrl[0] ||
		    (ctx.dbz2err != BZ_OK && ctx.dbz2err != BZ_STREAM_END)) {
			ok = 0;
			break;
		}

		for (off_t i = 0; i < ctrl[0]; i++) {
			off_t old_index;
			if (add_off_t(oldpos, i, &old_index) != 0) {
				ok = 0;
				break;
			}
			if (old_index >= 0 && old_index < ctx.old_size)
				ctx.new_buf[newpos + i] += ctx.old_buf[old_index];
		}
		if (!ok)
			break;

		if (add_off_t(newpos, ctrl[0], &newpos) != 0 ||
		    add_off_t(oldpos, ctrl[0], &oldpos) != 0) {
			ok = 0;
			break;
		}

		if (add_off_t(newpos, ctrl[1], &new_limit) != 0 ||
		    new_limit > newsize) {
			ok = 0;
			break;
		}

		lenread = BZ2_bzRead(&ctx.ebz2err, ctx.epfbz2,
		    ctx.new_buf + newpos, (int)ctrl[1]);
		if ((off_t)lenread < ctrl[1] ||
		    (ctx.ebz2err != BZ_OK && ctx.ebz2err != BZ_STREAM_END)) {
			ok = 0;
			break;
		}

		if (add_off_t(newpos, ctrl[1], &newpos) != 0 ||
		    add_off_t(oldpos, ctrl[2], &oldpos) != 0) {
			ok = 0;
			break;
		}
	}

	if (!ok)
		goto done;

	BZ2_bzReadClose(&ctx.cbz2err, ctx.cpfbz2);
	BZ2_bzReadClose(&ctx.dbz2err, ctx.dpfbz2);
	BZ2_bzReadClose(&ctx.ebz2err, ctx.epfbz2);
	ctx.cpfbz2 = NULL;
	ctx.dpfbz2 = NULL;
	ctx.epfbz2 = NULL;

	if (ctx.cpf != NULL && fclose(ctx.cpf) != 0)
		goto done;
	ctx.cpf = NULL;
	if (ctx.dpf != NULL && fclose(ctx.dpf) != 0)
		goto done;
	ctx.dpf = NULL;
	if (ctx.epf != NULL && fclose(ctx.epf) != 0)
		goto done;
	ctx.epf = NULL;

	if (write_new_file(argv[2], &ctx, newsize) != 0)
		goto done;

	result = 0;

done:
	if (header != NULL)
		fclose(header);
	cleanup_context(&ctx);
	return result;
}