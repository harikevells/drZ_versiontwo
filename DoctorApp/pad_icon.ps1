Add-Type -AssemblyName System.Drawing
$sourcePath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo.png'
$destPath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo_padded.png'

$img = [System.Drawing.Image]::FromFile($sourcePath)
$bmp = New-Object System.Drawing.Bitmap 1024, 1024
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)

# Scale down to 65% to leave safe padding
$newWidth = [int](1024 * 0.65)
$newHeight = [int](1024 * 0.65)
$x = (1024 - $newWidth) / 2
$y = (1024 - $newHeight) / 2

$g.DrawImage($img, $x, $y, $newWidth, $newHeight)
$g.Dispose()
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Host "Padded image created at $destPath"
