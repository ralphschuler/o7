#!/bin/bash

# turn on bash's job control
set -m
/startup/docker-entrypoint.sh neo4j &
/wait-for-neo4j.sh

if [ ! -f "/data/.initialized" ]; then
  echo "Initializing database..."

  cypher-shell -f /init.cypher

  if [ $? -ne 0 ]; then
    echo "Error: cypher-shell failed"
    exit 1
  fi

  touch /data/.initialized

  echo "Database initialized"
fi

fg %1