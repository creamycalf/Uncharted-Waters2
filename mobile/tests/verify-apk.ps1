param([Parameter(Mandatory=$true)][string]$Apk,[Parameter(Mandatory=$true)][string]$Assets)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead((Resolve-Path $Apk).Path)
$sha=[Security.Cryptography.SHA256]::Create()
try {
 $names=New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
 foreach($entry in $archive.Entries){
  if($entry.FullName.Contains('\')){throw "Invalid Android ZIP path: $($entry.FullName)"}
  if(!$names.Add($entry.FullName)){throw "Duplicate ZIP path: $($entry.FullName)"}
 }
 foreach($name in @('AndroidManifest.xml','classes.dex','assets/web/index.html','assets/web/mobile-core.js','assets/web/mobile-fleet.js','assets/web/mobile-trainer-form.js','assets/release-docs/genishs-MIT.txt','assets/web/mobile-motion.js','assets/web/mobile-navigation.js','assets/web/mobile-ui.js','assets/web/game/bundle.zip','assets/web/jsdos/wdosbox-x.wasm')){
  if(!$archive.GetEntry($name)){throw "Missing required APK entry: $name"}
 }
 $root=(Resolve-Path $Assets).Path
 $count=0
 Get-ChildItem -LiteralPath $root -Recurse -File | ForEach-Object {
  $name='assets/'+$_.FullName.Substring($root.Length+1).Replace('\','/')
  $entry=$archive.GetEntry($name)
  if(!$entry){throw "AssetManager path cannot resolve: $name"}
  if($entry.Length -ne $_.Length){throw "Asset length mismatch: $name"}
  $stream=$entry.Open()
  try{$packed=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','')}finally{$stream.Dispose()}
  $source=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
  if($packed -ne $source){throw "Asset content mismatch: $name"}
  $count++
 }
 $assetCount=@($archive.Entries | Where-Object {$_.FullName.StartsWith('assets/','Ordinal') -and !$_.FullName.EndsWith('/')}).Count
 if($assetCount -ne $count){throw 'Unexpected extra assets in APK'}
 Write-Output "APK asset validation PASS: $count files, exact Android paths, lengths and SHA-256 contents."
} finally {$sha.Dispose();$archive.Dispose()}
