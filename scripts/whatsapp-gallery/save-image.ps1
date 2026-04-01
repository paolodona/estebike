param(
    [string]$InputFile,
    [string]$OutputDir
)

$content = Get-Content $InputFile -Raw
$json = $content | ConvertFrom-Json
$text = $json[0].text

# Extract base64 data between "base64," and the closing ```
if ($text -match 'base64,([A-Za-z0-9+/=]+)') {
    $base64 = $Matches[1]
} else {
    Write-Error "Could not find base64 data"
    exit 1
}

$bytes = [Convert]::FromBase64String($base64)
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$hashBytes = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$hash = [System.BitConverter]::ToString($hashBytes).Replace('-','').Substring(0,8).ToLower()
$filename = "${timestamp}_${hash}.jpg"
$fullPath = Join-Path $OutputDir $filename

[IO.File]::WriteAllBytes($fullPath, $bytes)
Write-Output @{
    filename = $filename
    path = $fullPath
    size = $bytes.Length
    hash = [System.BitConverter]::ToString($hashBytes).Replace('-','').ToLower()
} | ConvertTo-Json
