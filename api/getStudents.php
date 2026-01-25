<?php


if (!isset($_GET["refId"])) {
  http_response_code(400);
  echo "Bad Request: Missing required parameters.";
  exit;
}

$refId = $_GET["refId"];

$students = [
  ["id" => 123, "name" => "Arnoldl", "firstname" => "Ella", "cls" => "2ES", "lang" => "de"],
  ["id" => 124, "name" => "Arnulf", "firstname" => "Ella", "cls" => "2ES", "lang" => "fr"],
  ["id" => 125, "name" => "Chapmanx", "firstname" => "Brandon", "cls" => "2ES", "lang" => "de"],
  ["id" => 126, "name" => "Colemans", "firstname" => "Carl", "cls" => "2ES", "lang" => "de"],
  ["id" => 127, "name" => "Cornishw", "firstname" => "Hilda", "cls" => "2ES", "lang" => "fr"],
  ["id" => 128, "name" => "Dowdy", "firstname" => "Emma", "cls" => "2ES", "lang" => "fr"],
  ["id" => 129, "name" => "Unhold", "firstname" => "Ella", "cls" => "2ES", "lang" => "fr"],
  ["id" => 130, "name" => "Grossartigh", "firstname" => "Arthur", "cls" => "2ES", "lang" => "de"],
  ["id" => 131, "name" => "Guintardt", "firstname" => "Gavin", "cls" => "2ES", "lang" => "fr"],
  ["id" => 132, "name" => "Herforderlichu", "firstname" => "Jacob", "cls" => "2ES", "lang" => "fr"],
  ["id" => 133, "name" => "Hilll", "firstname" => "Sophie", "cls" => "2ES", "lang" => "fr"],
  ["id" => 134, "name" => "Kremerlangi", "firstname" => "Jason", "cls" => "2ES", "lang" => "fr"],
  ["id" => 135, "name" => "Langdona", "firstname" => "Sam", "cls" => "2ES", "lang" => "fr"],
  ["id" => 136, "name" => "Manningr", "firstname" => "Christopherus-Maxime", "cls" => "2ES", "lang" => "fr"],
  ["id" => 137, "name" => "McLeanh", "firstname" => "Paul", "cls" => "2ES", "lang" => "fr"],
  ["id" => 138, "name" => "Perez", "firstname" => "Penelope", "cls" => "2ES", "lang" => "fr"],
  ["id" => 139, "name" => "Pooler", "firstname" => "Nicola", "cls" => "2ES", "lang" => "de"],
  ["id" => 140, "name" => "Randallw", "firstname" => "Fiona", "cls" => "2ES", "lang" => "fr"],
  ["id" => 141, "name" => "Parsonse", "firstname" => "Penelope", "cls" => "2ES", "lang" => "fr"],
  ["id" => 142, "name" => "Hausmann", "firstname" => "Jacob", "cls" => "2ES", "lang" => "fr"],
  ["id" => 143, "name" => "Maier", "firstname" => "Heinz", "cls" => "2ES", "lang" => "fr"],
  ["id" => 144, "name" => "Müller", "firstname" => "Bertram", "cls" => "2ES", "lang" => "fr"],
  ["id" => 145, "name" => "Gauß", "firstname" => "Carl Friedrich", "cls" => "2ES", "lang" => "fr"],
];

header('Content-Type: application/json');
echo json_encode($students);
