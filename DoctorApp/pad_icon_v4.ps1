Add-Type -AssemblyName System.Drawing
$sourcePath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo.png'
$destPath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo_padded.png'

$img = [System.Drawing.Image]::FromFile($sourcePath)
$canvasSize = 512
$bmp = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Transparent background
$g.Clear([System.Drawing.Color]::Transparent)

# The user wants it more zoomed out.
# Android circular mask cuts off about 17% from each side.
# 17% of 512 is ~87 pixels.
# The user asked for "padding 20px varanum" but also "zoom out aaganum". 
# Let's give it a 60px padding (approx 12%) so it's noticeably smaller and zoomed out.
$padding = 60
$newWidth = $canvasSize - ($padding * 2)
$newHeight = $canvasSize - ($padding * 2)

$g.DrawImage($img, $padding, $padding, $newWidth, $newHeight)
$g.Dispose()
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Host "Padded transparent image created at $destPath with 60px padding for more zoom out."
