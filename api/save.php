<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

$dbFile = __DIR__ . '/data.db';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Lazy creation of table only for dummy purposes
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

$stmt = $pdo->prepare("
  INSERT INTO seatingplan 
  (refId, jsonContent, creatorName, isPublic, created)
  VALUES
  (:refId, :jsonContent, :creatorName, :isPublic, :created);
");

$refId = $_POST["refId"];
$jsonContent = $_POST["jsonContent"];
$creatorName = $_POST["creatorName"];
$isPublic = $_POST["isPublic"] || 0;
$created = date('c');

// Check access rights first for authed user on referenced entities!!

$stmt->execute([
  ":refId" => $refId,
  ":jsonContent" => $jsonContent,
  ":creatorName" => $creatorName,
  ":isPublic" => $isPublic,
  ":created" => $created
]);