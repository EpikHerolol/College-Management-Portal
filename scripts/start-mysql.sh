#!/usr/bin/env bash
# start-mysql.sh - Ensures local MySQL daemon is initialized and running for development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATADIR="/tmp/college_mysql/data"
SOCKET="/tmp/college_mysql/mysql.sock"
PORT=3307
LOGFILE="/tmp/college_mysql/error.log"

mkdir -p /tmp/college_mysql

# Check if MySQL is already responding on socket
if mysql --socket="$SOCKET" -u root -e "SELECT 1;" >/dev/null 2>&1; then
    echo "MySQL server is already running and accessible via $SOCKET."
    exit 0
fi

# Remove stale socket files if MySQL is not responding
rm -f "$SOCKET" "${SOCKET}.lock"

NEEDS_SEED=false
# Initialize if data dir does not exist or was wiped on reboot
if [ ! -d "$DATADIR/mysql" ]; then
    echo "Initializing new MySQL data directory at $DATADIR..."
    rm -rf "$DATADIR"
    mkdir -p "$DATADIR"
    /usr/sbin/mysqld --no-defaults --initialize-insecure --datadir="$DATADIR" > /dev/null 2>&1
    echo "MySQL data directory initialized."
    NEEDS_SEED=true
fi

echo "Starting mysqld on port $PORT with socket $SOCKET..."
nohup /usr/sbin/mysqld \
  --no-defaults \
  --datadir="$DATADIR" \
  --socket="$SOCKET" \
  --port="$PORT" \
  --bind-address=127.0.0.1 \
  --disable-log-bin \
  --mysqlx=OFF >> "$LOGFILE" 2>&1 &

# Wait for socket to become ready
for i in {1..30}; do
    if mysql --socket="$SOCKET" -u root -e "SELECT 1;" >/dev/null 2>&1; then
        echo "MySQL server started successfully!"
        
        # If this was initialized freshly after a system restart, auto-seed schema and demo data
        if [ "$NEEDS_SEED" = true ]; then
            echo "Fresh startup detected: automatically applying database schema and demo seeds..."
            node "${PROJECT_ROOT}/scripts/init-db.js"
            node "${PROJECT_ROOT}/scripts/seed-db.js"
            echo "Auto-setup complete! Database is fully populated and ready."
        fi
        
        exit 0
    fi
    sleep 0.5
done

echo "Error: MySQL did not start within 15 seconds. Check $LOGFILE"
exit 1
