#!/usr/bin/env bash
# stop-mysql.sh - Gracefully shuts down the local MySQL daemon

SOCKET="/tmp/college_mysql/mysql.sock"

if [ -S "$SOCKET" ]; then
  echo "Shutting down MySQL daemon via socket..."
  mysqladmin --socket="$SOCKET" -u root shutdown 2>/dev/null || pkill -f "/usr/sbin/mysqld.*college_mysql" 2>/dev/null || true
  rm -f "$SOCKET" "${SOCKET}.lock"
  echo "MySQL daemon stopped."
else
  pkill -f "/usr/sbin/mysqld.*college_mysql" 2>/dev/null && echo "MySQL process terminated." || echo "MySQL daemon is not running."
fi

