<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

$dbFile = __DIR__ . '/data.db';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec("
  CREATE TABLE IF NOT EXISTS seatingplan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refId INTEGER NOT NULL,
    jsonContent TEXT NOT NULL,
    creatorName TEXT NOT NULL,
    isPublic INTEGER NOT NULL DEFAULT 0,
    created TEXT NOT NULL
  )
");

// TODO: load single entry if ID given, else all entries as list