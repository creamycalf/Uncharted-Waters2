$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$project=Split-Path $PSScriptRoot -Parent
$source=[Drawing.Image]::FromFile((Join-Path $project 'artwork/launcher-icon.png'))
try {
 $targets=@{'mipmap-mdpi'=48;'mipmap-hdpi'=72;'mipmap-xhdpi'=96;'mipmap-xxhdpi'=144;'mipmap-xxxhdpi'=192;'drawable-nodpi'=768}
 foreach($entry in $targets.GetEnumerator()) {
  $dir=Join-Path $project ('android/res/'+$entry.Key)
  New-Item -ItemType Directory -Force $dir | Out-Null
  $size=$entry.Value
  $image=New-Object Drawing.Bitmap $size,$size
  $g=[Drawing.Graphics]::FromImage($image)
  try {
   $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $g.DrawImage($source,0,0,$size,$size)
   $name=if($entry.Key -eq 'drawable-nodpi'){'ic_launcher_art.png'}else{'ic_launcher.png'}
   $image.Save((Join-Path $dir $name),[Drawing.Imaging.ImageFormat]::Png)
  } finally {$g.Dispose();$image.Dispose()}
 }
} finally {$source.Dispose()}
