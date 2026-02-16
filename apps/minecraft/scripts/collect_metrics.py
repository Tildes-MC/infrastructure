#!/usr/bin/env python3
import re
import sqlite3
import time
import os

from rcon import MCRcon, MCRconException


def init_sqlite(db: sqlite3.Connection):
    cursor = db.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stats (
            timestamp INTEGER PRIMARY KEY,
            player_count INTEGER NOT NULL,
            mspt_60s_min REAL NOT NULL,
            mspt_60s_avg REAL NOT NULL,
            mspt_60s_max REAL NOT NULL
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS stats_mspt_60s_avg_idx
        ON stats (mspt_60s_avg)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS stats_timestamp_idx
        ON stats (timestamp)
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS players (
            timestamp INTEGER NOT NULL,
            name TEXT NOT NULL,
            PRIMARY KEY (timestamp, name)
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS players_timestamp_idx
        ON players (timestamp)
    """)
    db.commit()


def insert_stats(
    db: sqlite3.Connection,
    timestamp: int,
    players: list[str],
    mspt: tuple[float, ...],
):
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO stats (timestamp, player_count, mspt_60s_avg, mspt_60s_min, mspt_60s_max)
        VALUES (?, ?, ?, ?, ?)
    """, (timestamp, len(players), *mspt))
    cursor.executemany(
        "INSERT INTO players (timestamp, name) VALUES (?, ?)",
        [(timestamp, player) for player in players])

    db.commit()


def strip_color_codes(text: str) -> str:
    return re.sub("\xa7[0-9a-f]", "", text, flags=re.IGNORECASE)


def mspt(rcon: MCRcon) -> dict[str, tuple[float, ...]] | None:
    response = strip_color_codes(rcon.command("mspt"))

    lines = response.split("\n")
    if lines[0] != "Server tick times (avg/min/max) from last 5s, 10s, 1m:":
        print("Unexpected response from server:", response)
        return None

    # Remove the leading "◴ "
    stats_line = lines[1][len("◴ "):]
    return {
        label: tuple(float(x) for x in section.split("/"))
        for label, section in zip(("5s", "10s", "1m"), stats_line.split(", "))
    }


def players_online(rcon: MCRcon) -> list[str] | None:
    response = rcon.command("list")

    match = re.match(
        r"There are (\d+) of a max of (\d+) players online: (.*)", response)
    if match is None:
        print("Unexpected response from server:", response)
        return None

    return [name for name in match.group(3).split(", ") if len(name) > 0]


RCON_HOST = os.environ.get("RCON_HOST", "localhost")
RCON_PASSWORD = os.environ.get("RCON_PASSWORD", "password")
RCON_PORT = int(os.environ.get("RCON_PORT", 25575))


def main():
    base_path = os.path.dirname(os.path.realpath(__file__))
    database = os.path.join(base_path, "stats.db")

    with sqlite3.connect(database) as db:
        init_sqlite(db)

        stats: dict[str, tuple[float, ...]] | None = None

        try:
            with MCRcon(RCON_HOST, RCON_PASSWORD, RCON_PORT) as rcon:
                stats = mspt(rcon)
                if stats is None:
                    return

                players = players_online(rcon)
                if players is None:
                    return

        except MCRconException as e:
            print("Error:", e)
            stats = {
                "5s": (0.0, 0.0, 0.0),
                "10s": (0.0, 0.0, 0.0),
                "1m": (0.0, 0.0, 0.0),
            }
            players = []

        utc_timestamp = int(time.mktime(time.gmtime()))
        insert_stats(db, utc_timestamp, players, stats["1m"])


if __name__ == "__main__":
    main()
