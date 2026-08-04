Add-Type -AssemblyName System.Drawing
$sourcePath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo.png'
$destPath = 'd:\drZ_deployment\DoctorApp\src\assets\Dclogo_padded.png'

$img = [System.Drawing.Image]::FromFile($sourcePath)
$bmp = New-Object System.Drawing.Bitmap 1024, 1024
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Use transparent background instead of white
$g.Clear([System.Drawing.Color]::Transparent)

# They want "kammi ya varanum" (a little less) and "padding 15px space irutha podhum" (15px padding is enough).
# If the final icon on screen is ~192x192, 15px padding is about 8%.
# Let's scale the image to 85% of the canvas size.
$newWidth = [int](1024 * 0.85)
$newHeight = [int](1024 * 0.85)
$x = (1024 - $newWidth) / 2
$y = (1024 - $newHeight) / 2

$g.DrawImage($img, $x, $y, $newWidth, $newHeight)
$g.Dispose()
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Host "Padded transparent image created at $destPath"
