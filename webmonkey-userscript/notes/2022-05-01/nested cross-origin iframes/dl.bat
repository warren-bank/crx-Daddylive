@echo off

curl "https://eplayer.click/premiumtv/daddylive.php?id=371" -H "Referer: https://daddylive.eu/stream/stream-371.php" --insecure --compressed -o "%~dp0.\iframe_1.html"

curl "https://player.licenses4.me/player.php?id=premium371&test=true" -H "Referer: https://eplayer.click/premiumtv/daddylive.php?id=371" --insecure --compressed -o "%~dp0.\iframe_2.html"
