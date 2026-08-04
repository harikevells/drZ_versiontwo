Add-Type -AssemblyName System.Drawing
$sourcePath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo.png'
$destPath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo_padded.png'

$img = [System.Drawing.Image]::FromFile($sourcePath)
$canvasSize = 512
$bmp = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Transparent background
$g.Clear([System.Drawing.Color]::Transparent)

# They requested EXACTLY 23px padding.
# On a 512x512 image, 23px padding means drawing at X=23, Y=23
$padding = 23
$newWidth = $canvasSize - ($padding * 2)
$newHeight = $canvasSize - ($padding * 2)

$g.DrawImage($img, $padding, $padding, $newWidth, $newHeight)
$g.Dispose()
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Host "Padded transparent image created at $destPath with exact 23px padding on a 512x512 canvas."
