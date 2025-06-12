<?php
// --- Konfigurasi ---

// Path absolut ke folder dimana index.php ini berada
$scriptFolder = str_replace('\\', '/', __DIR__); // contoh: E:/NITIP/js/2025/MULTIMEDIA/mp3_player

// DocumentRoot dari server web Anda.
// Untuk XAMPP biasanya C:/xampp/htdocs atau /opt/lampp/htdocs
// Untuk server PHP bawaan (php -S localhost:port -t public_html), ini adalah folder yang Anda tentukan dengan -t
// Jika tidak ada -t, maka itu adalah direktori tempat Anda menjalankan perintah.
$documentRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);

// Path relatif dari DocumentRoot ke folder skrip ini.
// Contoh:
// Jika DocumentRoot adalah /var/www/html dan skrip ada di /var/www/html/mp3_player, maka ini akan jadi /mp3_player
// Jika DocumentRoot adalah /var/www/html dan skrip ada di /var/www/html, maka ini akan jadi string kosong
$pathFromDocRootToScript = str_replace($documentRoot, '', $scriptFolder);

// Normalisasi $pathFromDocRootToScript:
// - Hapus slash ganda
// - Pastikan diawali dengan / jika tidak kosong, atau biarkan kosong jika memang root
$pathFromDocRootToScript = preg_replace('#/+#', '/', $pathFromDocRootToScript);
if ($pathFromDocRootToScript === '/') {
    $pathFromDocRootToScript = ''; // Jika skrip ada di root DocumentRoot
}
// Jika Anda menjalankan dari subfolder yang tidak langsung di bawah DocumentRoot,
// atau jika $_SERVER['DOCUMENT_ROOT'] tidak merefleksikan struktur URL Anda,
// Anda mungkin perlu hardcode $pathFromDocRootToScript.
// Misalnya, jika URL Anda http://localhost:8090/my_projects/mp3_player/
// dan DocumentRoot adalah E:/www/, maka $pathFromDocRootToScript harus '/my_projects/mp3_player'
// $pathFromDocRootToScript = '/mp3-player'; // CONTOH HARDCODE JIKA PERLU


// Folder musik utama (path absolut di sistem file)
$baseMusicDirSystem = $scriptFolder . '/music/';

// --- Aset relatif terhadap URL basis skrip ---
// Jika $pathFromDocRootToScript adalah '/mp3_player', maka $baseUrl akan '/mp3_player/'
// Jika $pathFromDocRootToScript kosong, maka $baseUrl akan '/'
$baseUrl = rtrim($pathFromDocRootToScript, '/') . '/';

$defaultAlbumArt = $baseUrl . 'assets/images/default-album-art.png';
$dancingGif = $baseUrl . 'assets/gifs/dancing.gif';


$predefinedFolders = [
    'Pop' => $baseMusicDirSystem . 'Pop',
    'Rock' => $baseMusicDirSystem . 'Rock',
    'Classical' => $baseMusicDirSystem . 'Classical',
    // Tambahkan folder lain di sini
];

$currentFolderSystem = isset($_GET['folder']) && isset($predefinedFolders[$_GET['folder']])
    ? $predefinedFolders[$_GET['folder']]
    : ($predefinedFolders[array_key_first($predefinedFolders)] ?? $baseMusicDirSystem);

$currentFolderName = array_search($currentFolderSystem, $predefinedFolders);
if ($currentFolderName === false) {
    if (strpos($currentFolderSystem, $baseMusicDirSystem) === 0) {
        $relativeSubFolder = str_replace($baseMusicDirSystem, '', $currentFolderSystem);
        $currentFolderName = trim($relativeSubFolder, '/\\');
        if (empty($currentFolderName) && $currentFolderSystem === $baseMusicDirSystem) {
             $currentFolderName = "Base Music Folder";
        }
    } else {
        $currentFolderName = "Folder Saat Ini";
    }
}

$musicFiles = [];
if (is_dir($currentFolderSystem)) {
    $filesIterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($currentFolderSystem, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($filesIterator as $fileinfo) {
        if ($fileinfo->isFile() && strtolower($fileinfo->getExtension()) === 'mp3') {
            $fileRealPathSystem = str_replace('\\', '/', $fileinfo->getRealPath());

            // Ini akan menjadi path di dalam folder 'music', misal 'Pop/song1.mp3'
            $subPathInMusicFolder = str_replace($baseMusicDirSystem, '', $fileRealPathSystem);

            // Path HTTP final. $baseUrl sudah menghandle jika proyek ada di subfolder.
            // Hasilnya akan seperti: '/mp3_player/music/Pop/song1.mp3' atau 'music/Pop/song1.mp3'
            $httpPath = $baseUrl . 'music/' . $subPathInMusicFolder;
            // Normalisasi slash ganda (meskipun $baseUrl seharusnya sudah benar)
            $httpPath = preg_replace('#/+#', '/', $httpPath);
            // Jika $baseUrl adalah '/', hasilnya akan '/music/...', jika proyek di root web, ini perlu diltrim
            if ($baseUrl === '/') {
                $httpPath = ltrim($httpPath, '/');
            }


            // --- DEBUGGING PHP PATH (Uncomment untuk melihat output) ---
            /*
            echo "--- DEBUG START ---<br>";
            echo "Script Folder (System): " . htmlspecialchars($scriptFolder) . "<br>";
            echo "Document Root (System): " . htmlspecialchars($documentRoot) . "<br>";
            echo "Path From Doc Root to Script (URL base): " . htmlspecialchars($pathFromDocRootToScript) . "<br>";
            echo "Base URL for assets/music: " . htmlspecialchars($baseUrl) . "<br>";
            echo "Base Music Dir (System): " . htmlspecialchars($baseMusicDirSystem) . "<br>";
            echo "Current Iterated File (System): " . htmlspecialchars($fileRealPathSystem) . "<br>";
            echo "Sub Path In Music Folder: " . htmlspecialchars($subPathInMusicFolder) . "<br>";
            echo "Generated HTTP Path for data-src: <strong>" . htmlspecialchars($httpPath) . "</strong><hr>";
            // --- DEBUG END ---
            */

            $musicFiles[] = [
                'name' => $fileinfo->getBasename('.mp3'),
                'path' => $httpPath,
            ];
        }
    }
    // if (!empty($musicFiles)) { die(); } // Hentikan setelah file pertama untuk debug
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pemutar MP3 Offline Keren</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Path ke style.css juga perlu relatif terhadap URL basis skrip -->
    <link rel="stylesheet" href="<?php echo htmlspecialchars($baseUrl . 'style.css'); ?>">
</head>
<body>
    <div class="player-container">
        <aside class="sidebar">
            <h2><i class="fas fa-music"></i> Pustaka Musik</h2>
            <div class="folder-selector">
                <label for="folder-choice">Pilih Folder Tersedia:</label>
                <select id="folder-choice">
                    <?php foreach ($predefinedFolders as $name => $path) : ?>
                        <option value="<?php echo htmlspecialchars($name); ?>" <?php echo ($currentFolderSystem === $path) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <label for="custom-folder-input" class="custom-folder-button">
                    <i class="fas fa-folder-open"></i> Pilih Folder Dari Komputer
                </label>
                <input type="file" id="custom-folder-input" webkitdirectory directory multiple style="display: none;">
<!-- Di index.php, di tempat yang sesuai (misalnya di sidebar) -->
<div class="gif-selector" style="margin-top: 15px; text-align: center;">
    <!--label for="gif-choice" style="display: block; margin-bottom: 5px; color: var(--text-muted-color);">Pilih Animasi:</label-->
    <select id="gif-choice" style="padding: 8px; background-color: var(--secondary-color); color: var(--text-color); border: 1px solid #333; border-radius: var(--border-radius);">
        <!-- Pastikan $baseUrl sudah didefinisikan dengan benar di PHP Anda -->
        <option value="<?php echo htmlspecialchars($baseUrl . 'assets/gifs/dancing.gif'); ?>">Joget 1 (Default)</option>
        <option value="<?php echo htmlspecialchars($baseUrl . 'assets/gifs/joget2.gif'); ?>">Joget 2</option>
        <option value="<?php echo htmlspecialchars($baseUrl . 'assets/gifs/joget3.gif'); ?>">Joget 3</option>
        <option value="<?php echo htmlspecialchars($baseUrl . 'assets/gifs/joget4.gif'); ?>">Joget 4</option>
    </select>
</div>
            </div>
            <div id="playlist" class="playlist-container">
                <h3>Playlist: <?php echo htmlspecialchars($currentFolderName); ?></h3>
                <ul id="playlist-ul">
                    <?php if (empty($musicFiles)) : ?>
                        <li class="no-files">Tidak ada file MP3 di folder ini.</li>
                    <?php else : ?>
                        <?php foreach ($musicFiles as $index => $file) : ?>
                            <li data-src="<?php echo htmlspecialchars($file['path']); ?>">
                                <span class="song-title"><?php echo htmlspecialchars($file['name']); ?></span>
                            </li>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </ul>
            </div>
        </aside>

        <main class="main-content">
            <div class="album-art-section">
                <img src="<?php echo htmlspecialchars($defaultAlbumArt); ?>" alt="Album Art" id="album-art" class="album-art-img">
                <div id="dancing-gif-container">
                    <img src="<?php echo htmlspecialchars($dancingGif); ?>" alt="Dancing Animation" id="dancing-gif">
                </div>
            </div>

            <div class="track-info">
                <h3 id="current-song-title">Pilih lagu dari playlist</h3>
                <p id="current-song-artist">Artis Tidak Diketahui</p>
            </div>

            <canvas id="visualizer"></canvas>

            <div class="controls">
                <input type="range" id="progress-bar" value="0" max="100">
                <div class="time-display">
                    <span id="current-time">0:00</span> / <span id="duration">0:00</span>
                </div>
                <div class="buttons">
                    <button id="prev-btn" title="Sebelumnya"><i class="fas fa-backward-step"></i></button>
                    <button id="play-pause-btn" title="Putar/Jeda"><i class="fas fa-play"></i></button>
                    <button id="next-btn" title="Berikutnya"><i class="fas fa-forward-step"></i></button>
                    <button id="shuffle-btn" title="Acak"><i class="fas fa-shuffle"></i></button>
                    <button id="repeat-btn" title="Ulangi"><i class="fas fa-repeat"></i></button>
                </div>
                <div class="volume-control">
                    <i class="fas fa-volume-down"></i>
                    <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="1">
                    <i class="fas fa-volume-up"></i>
                </div>
            </div>
        </main>
    </div>

    <audio id="audio-player" preload="metadata"></audio>

    <!-- Pastikan jsmediatags dari CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js"></script>
    <!-- Path ke script.js juga perlu relatif terhadap URL basis skrip -->
    <script src="<?php echo htmlspecialchars($baseUrl . 'script.js'); ?>"></script>
</body>
</html>