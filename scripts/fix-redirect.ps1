$files = Get-ChildItem -Path "C:\Users\PaoloDona\prj\Other\estebike\crawled-site" -Recurse -Filter "*.html"
$pattern = '<script>if \(document\.location\.protocol != "https:"\) \{document\.location = document\.URL\.replace\(/\^http:/i, "https:"\);\}</script>'
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match $pattern) {
        $newContent = $content -replace $pattern, ''
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $count++
        Write-Host "Fixed: $($file.FullName)"
    }
}
Write-Host "Total files fixed: $count"
