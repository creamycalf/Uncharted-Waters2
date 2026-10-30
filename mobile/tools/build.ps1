param([string]$SdkRoot=$env:ANDROID_HOME,[string]$JdkRoot=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
$project=Split-Path $PSScriptRoot -Parent
if(!$SdkRoot){$SdkRoot=$env:ANDROID_SDK_ROOT}
if(!$SdkRoot -or !$JdkRoot){throw 'Pass -SdkRoot and -JdkRoot, or set ANDROID_HOME and JAVA_HOME (JDK 21).'}
$sdk=$SdkRoot
$jdk=$JdkRoot
$bt=Join-Path $sdk 'build-tools\36.0.0'
$platform=Join-Path $sdk 'platforms\android-36\android.jar'
$out=Join-Path $project 'build'
New-Item -ItemType Directory -Force $out,(Join-Path $out 'classes'),(Join-Path $out 'dex') | Out-Null
& (Join-Path $PSScriptRoot 'bootstrap.ps1')
function Run-Checked($exe,$arguments){ & $exe @arguments; if($LASTEXITCODE -ne 0){throw "Build command failed: $exe"} }
Run-Checked 'node' @((Join-Path $PSScriptRoot 'prepare.cjs'))
# Some Windows aapt2 builds preserve backslashes in nested asset entry names.
# Android AssetManager resolves slash-delimited names, so add assets explicitly below.
Run-Checked (Join-Path $bt 'aapt2.exe') @('compile','--dir',"$project\android\res",'-o',"$out\compiled-res.zip")
Run-Checked (Join-Path $bt 'aapt2.exe') @('link','-o',"$out\unsigned.apk",'--manifest',"$project\android\AndroidManifest.xml",'-I',$platform,"$out\compiled-res.zip")
Run-Checked (Join-Path $jdk 'bin\javac.exe') @('-encoding','UTF-8','-source','8','-target','8','-classpath',$platform,'-d',"$out\classes", "$project\android\MainActivity.java")
Run-Checked (Join-Path $jdk 'bin\jar.exe') @('cf',"$out\classes.jar",'-C',"$out\classes",'.')
Run-Checked (Join-Path $jdk 'bin\java.exe') @('-cp',"$bt\lib\d8.jar",'com.android.tools.r8.D8','--lib',$platform,'--min-api','26','--output',"$out\dex", "$out\classes.jar")
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::Open("$out\unsigned.apk",'Update')
try{
 [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,"$out\dex\classes.dex",'classes.dex') | Out-Null
 $assetRoot=(Resolve-Path "$project\assets").Path
 Get-ChildItem -LiteralPath $assetRoot -File -Recurse | ForEach-Object {
  $entryName='assets/'+$_.FullName.Substring($assetRoot.Length+1).Replace('\','/')
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$_.FullName,$entryName) | Out-Null
 }
}finally{$archive.Dispose()}
Run-Checked (Join-Path $bt 'zipalign.exe') @('-f','4',"$out\unsigned.apk","$out\aligned.apk")
$key=Join-Path $out 'local-test.jks'
if(!(Test-Path $key)){Run-Checked (Join-Path $jdk 'bin\keytool.exe') @('-genkeypair','-keystore',$key,'-storepass','android','-keypass','android','-alias','local-test','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=UW2 Local Test')}
[xml]$manifest=Get-Content "$project\android\AndroidManifest.xml" -Raw -Encoding UTF8
$version=$manifest.manifest.GetAttribute('versionName','http://schemas.android.com/apk/res/android').Replace('-mobile','')
$apk=Join-Path (Split-Path $project -Parent) "dist\Uncharted-Waters-2-Mobile-$version.apk"
Run-Checked (Join-Path $jdk 'bin\java.exe') @('-jar',"$bt\lib\apksigner.jar",'sign','--ks',$key,'--ks-pass','pass:android','--key-pass','pass:android','--out',$apk,"$out\aligned.apk")
Run-Checked (Join-Path $jdk 'bin\java.exe') @('-jar',"$bt\lib\apksigner.jar",'verify','--verbose',$apk)
& (Join-Path $project 'tests\verify-apk.ps1') -Apk $apk -Assets "$project\assets"
Get-FileHash $apk -Algorithm SHA256 | Format-List
