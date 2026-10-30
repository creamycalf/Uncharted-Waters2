$ErrorActionPreference='Stop'
$project=Split-Path $PSScriptRoot -Parent
$root=Split-Path $project -Parent
$apk=Join-Path $root 'Uncharted-Waters-2-Android-v7.8.apk'
if(!(Test-Path $apk)){throw 'Place the original Uncharted-Waters-2-Android-v7.8.apk in the workspace root.'}
$inspection=Join-Path $root 'inspection'
New-Item -ItemType Directory -Force $inspection,(Join-Path $inspection 'game-check'),(Join-Path $root 'dist') | Out-Null
if(!(Test-Path "$inspection\assets\web\index.html")){& tar -xf $apk -C $inspection assets;if($LASTEXITCODE -ne 0){throw 'APK extraction failed'}}
if(!(Test-Path "$project\assets\web\index.html")){Copy-Item "$inspection\assets" "$project\assets" -Recurse}
& tar -xf "$inspection\assets\web\game\bundle.zip" -C "$inspection\game-check" MAIN.EXE KOUKAI2.DAT
if($LASTEXITCODE -ne 0){throw 'Game extraction failed'}
Copy-Item "$inspection\game-check\MAIN.EXE" "$project\assets\web\game\MAIN.original.EXE" -Force
Copy-Item "$project\licenses\JohanLi-MIT.txt" "$project\assets\release-docs\JohanLi-MIT.txt" -Force
Copy-Item "$project\licenses\genishs-MIT.txt" "$project\assets\release-docs\genishs-MIT.txt" -Force
