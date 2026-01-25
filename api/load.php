<?php

error_reporting(E_ALL);

// Make sure they are displayed on the page
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
echo "Received " . $_POST["plan"];

$dbFile = __DIR__ . '/data.db';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec("
  CREATE TABLE IF NOT EXISTS seatingplan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refId INTEGER NOT NULL,
    refEntityName TEXT NOT NULL,
    jsonContent TEXT NOT NULL,
    created TEXT NOT NULL
  )
");


$stmt = $pdo->prepare("
  INSERT INTO seatingplan 
  (refId, refEntity, jsonContent, created)
  VALUES
  (:refId, :refEntity, :jsonContent, :created);
");

$refId = $_POST["refId"];
$refEntityName = $_POST["refEntityName"];
$jsonContent = $_POST["jsonContent"];
$created = date('c');

// Check access rights first for authed user on referenced entities!!

$stmt->execute([
  ":refId" => $refId,
  ":refEntityName" => $refEntityName,
  ":jsonContent" => $jsonContent,
  ":created" => $created
]);