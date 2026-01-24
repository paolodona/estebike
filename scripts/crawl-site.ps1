# Full website crawler for estebike.it (PowerShell version)
# Creates a complete mirror of the site for reference and asset reuse

$SITE_URL = "https://www.estebike.it/"
$OUTPUT_DIR = ".\crawled-site"
$LOG_FILE = ".\crawl.log"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Estebike.it Website Crawler" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target: $SITE_URL"
Write-Host "Output: $OUTPUT_DIR"
Write-Host "Log:    $LOG_FILE"
Write-Host ""

# Create output directory
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

Write-Host "Starting crawl at $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Find GNU wget (not PowerShell's alias to Invoke-WebRequest)
$wgetExe = $null

# Check common locations for GNU wget
$wgetLocations = @(
    "C:\Program Files\Git\mingw64\bin\wget.exe"
    "C:\Program Files (x86)\GnuWin32\bin\wget.exe"
    "C:\ProgramData\chocolatey\bin\wget.exe"
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\wget.exe"
    "$env:USERPROFILE\scoop\shims\wget.exe"
)

foreach ($loc in $wgetLocations) {
    if (Test-Path $loc) {
        $wgetExe = $loc
        Write-Host "Found GNU wget at: $loc" -ForegroundColor Green
        break
    }
}

# Also check if wget.exe is in PATH (but verify it's not the PS alias)
if (-not $wgetExe) {
    $wgetInPath = Get-Command wget.exe -ErrorAction SilentlyContinue
    if ($wgetInPath -and $wgetInPath.Source -notmatch "System32") {
        $wgetExe = $wgetInPath.Source
        Write-Host "Found GNU wget in PATH: $wgetExe" -ForegroundColor Green
    }
}

if ($wgetExe) {
    Write-Host "Using wget for crawling..." -ForegroundColor Green

    # Build command as a single string to avoid PowerShell parsing issues
    $cmd = @"
"$wgetExe" --mirror --convert-links --adjust-extension --page-requisites --no-parent --no-check-certificate --wait=1 --random-wait --limit-rate=500k --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --execute robots=off --directory-prefix="$OUTPUT_DIR" --no-verbose --show-progress "$SITE_URL"
"@

    Write-Host "Running: $cmd" -ForegroundColor DarkGray
    cmd /c $cmd 2>&1 | Tee-Object -FilePath $LOG_FILE
}
else {
    Write-Host "GNU wget not found. Please install it using one of these methods:" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Option 1 - Chocolatey (recommended):" -ForegroundColor Yellow
    Write-Host "    choco install wget" -ForegroundColor White
    Write-Host ""
    Write-Host "  Option 2 - Scoop:" -ForegroundColor Yellow
    Write-Host "    scoop install wget" -ForegroundColor White
    Write-Host ""
    Write-Host "  Option 3 - Use the Python script instead:" -ForegroundColor Yellow
    Write-Host "    pip install requests beautifulsoup4 lxml" -ForegroundColor White
    Write-Host "    python scripts\crawl-site.py" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Crawl completed at $(Get-Date)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$crawledDir = Join-Path $OUTPUT_DIR "www.estebike.it"
if (Test-Path $crawledDir) {
    Write-Host "Files saved to: $crawledDir" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "--------"

    $allFiles = Get-ChildItem -Path $crawledDir -Recurse -File
    $htmlFiles = $allFiles | Where-Object { $_.Extension -match '\.(html?|htm)$' }
    $imageFiles = $allFiles | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|webp|svg)$' }
    $cssFiles = $allFiles | Where-Object { $_.Extension -eq '.css' }
    $jsFiles = $allFiles | Where-Object { $_.Extension -eq '.js' }
    $pdfFiles = $allFiles | Where-Object { $_.Extension -eq '.pdf' }

    Write-Host "Total files: $($allFiles.Count)"
    Write-Host "HTML files:  $($htmlFiles.Count)"
    Write-Host "Images:      $($imageFiles.Count)"
    Write-Host "CSS files:   $($cssFiles.Count)"
    Write-Host "JS files:    $($jsFiles.Count)"
    Write-Host "PDF files:   $($pdfFiles.Count)"
    Write-Host ""

    $totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum
    $sizeInMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host "Total size:  $sizeInMB MB"
}
