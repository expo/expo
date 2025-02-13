#ifndef LIBSQL_EXPERIMENTAL_H
#define LIBSQL_EXPERIMENTAL_H

#include <stdint.h>

#define LIBSQL_INT 1

#define LIBSQL_FLOAT 2

#define LIBSQL_TEXT 3

#define LIBSQL_BLOB 4

#define LIBSQL_NULL 5

typedef struct libsql_connection libsql_connection;

typedef struct libsql_database libsql_database;

typedef struct libsql_row libsql_row;

typedef struct libsql_rows libsql_rows;

typedef struct libsql_rows_future libsql_rows_future;

typedef struct libsql_stmt libsql_stmt;

typedef const libsql_database *libsql_database_t;

typedef struct {
  int frame_no;
  int frames_synced;
} replicated;

typedef struct {
  const char *db_path;
  const char *primary_url;
  const char *auth_token;
  char read_your_writes;
  const char *encryption_key;
  int sync_interval;
  char with_webpki;
  char offline;
} libsql_config;

typedef const libsql_connection *libsql_connection_t;

typedef const libsql_stmt *libsql_stmt_t;

typedef const libsql_rows *libsql_rows_t;

typedef const libsql_rows_future *libsql_rows_future_t;

typedef const libsql_row *libsql_row_t;

typedef struct {
  const char *ptr;
  int len;
} blob;

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus

int libsql_enable_internal_tracing(void);

int libsql_sync(libsql_database_t db, const char **out_err_msg);

int libsql_sync2(libsql_database_t db, replicated *out_replicated, const char **out_err_msg);

int libsql_open_sync(const char *db_path,
                     const char *primary_url,
                     const char *auth_token,
                     char read_your_writes,
                     const char *encryption_key,
                     libsql_database_t *out_db,
                     const char **out_err_msg);

int libsql_open_sync_with_webpki(const char *db_path,
                                 const char *primary_url,
                                 const char *auth_token,
                                 char read_your_writes,
                                 const char *encryption_key,
                                 libsql_database_t *out_db,
                                 const char **out_err_msg);

int libsql_open_sync_with_config(libsql_config config, libsql_database_t *out_db, const char **out_err_msg);

int libsql_open_ext(const char *url, libsql_database_t *out_db, const char **out_err_msg);

int libsql_open_file(const char *url, libsql_database_t *out_db, const char **out_err_msg);

int libsql_open_remote(const char *url, const char *auth_token, libsql_database_t *out_db, const char **out_err_msg);

int libsql_open_remote_with_webpki(const char *url,
                                   const char *auth_token,
                                   libsql_database_t *out_db,
                                   const char **out_err_msg);

void libsql_close(libsql_database_t db);

int libsql_connect(libsql_database_t db, libsql_connection_t *out_conn, const char **out_err_msg);

int libsql_load_extension(libsql_connection_t conn,
                          const char *path,
                          const char *entry_point,
                          const char **out_err_msg);

int libsql_reset(libsql_connection_t conn, const char **out_err_msg);

void libsql_disconnect(libsql_connection_t conn);

int libsql_prepare(libsql_connection_t conn, const char *sql, libsql_stmt_t *out_stmt, const char **out_err_msg);

int libsql_bind_int(libsql_stmt_t stmt, int idx, long long value, const char **out_err_msg);

int libsql_bind_float(libsql_stmt_t stmt, int idx, double value, const char **out_err_msg);

int libsql_bind_null(libsql_stmt_t stmt, int idx, const char **out_err_msg);

int libsql_bind_string(libsql_stmt_t stmt, int idx, const char *value, const char **out_err_msg);

int libsql_bind_blob(libsql_stmt_t stmt, int idx, const unsigned char *value, int value_len, const char **out_err_msg);

int libsql_query_stmt(libsql_stmt_t stmt, libsql_rows_t *out_rows, const char **out_err_msg);

int libsql_execute_stmt(libsql_stmt_t stmt, const char **out_err_msg);

int libsql_reset_stmt(libsql_stmt_t stmt, const char **out_err_msg);

void libsql_free_stmt(libsql_stmt_t stmt);

int libsql_query(libsql_connection_t conn, const char *sql, libsql_rows_t *out_rows, const char **out_err_msg);

int libsql_execute(libsql_connection_t conn, const char *sql, const char **out_err_msg);

void libsql_free_rows(libsql_rows_t res);

void libsql_free_rows_future(libsql_rows_future_t res);

void libsql_wait_result(libsql_rows_future_t res);

int libsql_column_count(libsql_rows_t res);

int libsql_column_name(libsql_rows_t res, int col, const char **out_name, const char **out_err_msg);

int libsql_column_type(libsql_rows_t res, libsql_row_t row, int col, int *out_type, const char **out_err_msg);

uint64_t libsql_changes(libsql_connection_t conn);

int64_t libsql_last_insert_rowid(libsql_connection_t conn);

int libsql_next_row(libsql_rows_t res, libsql_row_t *out_row, const char **out_err_msg);

void libsql_free_row(libsql_row_t res);

int libsql_get_string(libsql_row_t res, int col, const char **out_value, const char **out_err_msg);

void libsql_free_string(const char *ptr);

int libsql_get_int(libsql_row_t res, int col, long long *out_value, const char **out_err_msg);

int libsql_get_float(libsql_row_t res, int col, double *out_value, const char **out_err_msg);

int libsql_get_blob(libsql_row_t res, int col, blob *out_blob, const char **out_err_msg);

void libsql_free_blob(blob b);

#ifdef __cplusplus
} // extern "C"
#endif // __cplusplus

#endif /* LIBSQL_EXPERIMENTAL_H */
