document.addEventListener('DOMContentLoaded', () => {
    // --- Bagian Deklarasi Variabel & Konstanta Utama (dari kode Anda) ---
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const playlistUl = document.getElementById('playlist-ul');
    const albumArtImg = document.getElementById('album-art');
    const defaultAlbumArtSrc = albumArtImg ? albumArtImg.src : ''; // Ambil src awal jika elemen ada
    const currentSongTitleDisplay = document.getElementById('current-song-title');
    const currentSongArtistDisplay = document.getElementById('current-song-artist');
    const dancingGifContainer = document.getElementById('dancing-gif-container');
    const folderChoiceSelect = document.getElementById('folder-choice');
    const customFolderInput = document.getElementById('custom-folder-input');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const playlistTitleElement = document.querySelector('#playlist h3');

    // --- Variabel & Konstanta untuk Fitur Ganti GIF ---
    const dancingGifImage = document.getElementById('dancing-gif'); // Pastikan ID ini ada di img GIF Anda
    const gifChoiceSelect = document.getElementById('gif-choice');   // Pastikan ID ini ada di select GIF Anda

    // --- Inisialisasi Web Audio API untuk Visualizer (dari kode Anda) ---
    const visualizerCanvas = document.getElementById('visualizer');
    let canvasCtx = null;
    if (visualizerCanvas) { // Hanya dapatkan context jika canvas ada
        canvasCtx = visualizerCanvas.getContext('2d');
    }
    let audioCtx, analyser, sourceNode, bufferLength, dataArray;

    // --- State Aplikasi (dari kode Anda) ---
    let playlistItems = Array.from(playlistUl.querySelectorAll('li[data-src]'));
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0;

    // --- Fungsi Inisialisasi Web Audio API (dari kode Anda) ---
    function initAudioVisualizer() {
        if (!visualizerCanvas) return; // Jangan lanjutkan jika canvas tidak ada
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                if (!sourceNode || sourceNode.mediaElement !== audioPlayer) {
                     if (sourceNode) sourceNode.disconnect();
                    sourceNode = audioCtx.createMediaElementSource(audioPlayer);
                }
                sourceNode.connect(analyser);
                analyser.connect(audioCtx.destination);
                analyser.fftSize = 256;
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                drawVisualizer();
            } catch (e) {
                console.error("Error initializing Web Audio API for visualizer:", e);
                visualizerCanvas.style.display = 'none';
            }
        } else if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn("Could not resume AudioContext:", e));
        }
    }

    // --- Fungsi Menggambar Visualizer (dari kode Anda) ---
    function drawVisualizer() {
        if (!visualizerCanvas || !canvasCtx) {
             requestAnimationFrame(drawVisualizer);
            return;
        }
        if (!analyser || !isPlaying || !audioCtx || audioCtx.state !== 'running') {
            canvasCtx.fillStyle = 'rgba(40, 40, 40, 0.5)';
            canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            requestAnimationFrame(drawVisualizer);
            return;
        }
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = 'rgba(40, 40, 40, 0.5)';
        canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        const barWidth = (visualizerCanvas.width / bufferLength) * 2.0;
        let barHeight;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2.5;
            const gradient = canvasCtx.createLinearGradient(0, visualizerCanvas.height - barHeight, 0, visualizerCanvas.height);
            gradient.addColorStop(0, 'rgb(29, 185, 84)');
            gradient.addColorStop(0.7, 'rgb(39, 205, 104)');
            gradient.addColorStop(1, 'rgb(50, 40, 40)');
            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        requestAnimationFrame(drawVisualizer);
    }

    // --- Fungsi Memuat Lagu (dari kode Anda, jsmediatags dikomentari) ---
    function loadTrack(trackIndex, playImmediately = true) {
        if (trackIndex < 0 || trackIndex >= playlistItems.length) {
            if (playlistItems.length === 0) {
                if(currentSongTitleDisplay) currentSongTitleDisplay.textContent = "Playlist Kosong";
                if(currentSongArtistDisplay) currentSongArtistDisplay.textContent = "";
                if(albumArtImg) albumArtImg.src = defaultAlbumArtSrc;
                if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                if(dancingGifContainer) dancingGifContainer.classList.remove('visible');
                if(albumArtImg) albumArtImg.classList.remove('playing');
                if(durationDisplay) durationDisplay.textContent = "0:00";
                if(currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
                if(progressBar) progressBar.value = 0;
            }
            return;
        }
        currentTrackIndex = trackIndex;
        const trackElement = playlistItems[currentTrackIndex];
        const trackSrc = trackElement.dataset.src;
        const trackName = trackElement.querySelector('.song-title')?.textContent || 'Judul Tidak Diketahui';

        console.log("Loading track. Path untuk audioPlayer.src:", trackSrc);
        if(audioPlayer) audioPlayer.src = trackSrc;
        if(currentSongTitleDisplay) currentSongTitleDisplay.textContent = trackName;
        if(currentSongArtistDisplay) currentSongArtistDisplay.textContent = "Artis Tidak Diketahui";

        if(albumArtImg) {
            albumArtImg.src = defaultAlbumArtSrc;
            albumArtImg.classList.remove('playing');
        }

        /*
        // --- BLOK JSMEDIATAGS (DIKOMENTARI SESUAI KODE "NORMAL" ANDA) ---
        if (window.jsmediatags && trackSrc) {
            console.log("Path untuk jsmediatags.read:", trackSrc);
            window.jsmediatags.read(trackSrc, {
                onSuccess: function(tag) { // ... kode jsmediatags ... },
                onError: function(error) { // ... kode jsmediatags ... }
            });
        } else {
             if (trackSrc && albumArtImg) {
                const songDir = trackSrc.substring(0, trackSrc.lastIndexOf('/'));
                const potentialCoverPath1 = `${songDir}/cover.jpg`;
                const potentialCoverPath2 = trackSrc.replace(/\.[^/.]+$/, ".jpg");
                checkPredefinedAlbumArt([potentialCoverPath1, potentialCoverPath2]);
             } else if (albumArtImg) {
                albumArtImg.src = defaultAlbumArtSrc;
             }
        }
        */

        // Fallback album art jika jsmediatags dikomentari atau gagal:
        if (trackSrc && albumArtImg) {
            const songDir = trackSrc.substring(0, trackSrc.lastIndexOf('/'));
            const potentialCoverPath1 = `${songDir}/cover.jpg`;
            const potentialCoverPath2 = trackSrc.replace(/\.[^/.]+$/, ".jpg");
            checkPredefinedAlbumArt([potentialCoverPath1, potentialCoverPath2]);
        } else if (albumArtImg) {
            albumArtImg.src = defaultAlbumArtSrc;
        }

        playlistItems.forEach(item => item.classList.remove('active'));
        if (trackElement) trackElement.classList.add('active');

        if (playImmediately) {
            playTrack();
        } else {
            if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            if(dancingGifContainer) dancingGifContainer.classList.remove('visible');
            if(albumArtImg) albumArtImg.classList.remove('playing');
        }
    }

    // --- Fungsi Cek Album Art (dari kode Anda) ---
    function checkPredefinedAlbumArt(artPathsArray) {
        if (!albumArtImg) return;
        let pathFound = false;
        function tryLoad(index) {
            if (index >= artPathsArray.length || pathFound) {
                if (!pathFound) albumArtImg.src = defaultAlbumArtSrc;
                return;
            }
            const artPath = artPathsArray[index];
            if (!artPath) { tryLoad(index + 1); return; }
            const imgTest = new Image();
            imgTest.onload = () => { albumArtImg.src = artPath; pathFound = true; };
            imgTest.onerror = () => tryLoad(index + 1);
            imgTest.src = artPath;
        }
        tryLoad(0);
    }

    // --- Fungsi Kontrol Playback (dari kode Anda) ---
    function playTrack() {
        if (!audioPlayer || !audioPlayer.src || playlistItems.length === 0) {
            if (playlistItems.length > 0) loadTrack(currentTrackIndex, true);
            return;
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn("Error resuming AudioContext:", e));
        }
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if(albumArtImg) albumArtImg.classList.add('playing');
                if(dancingGifContainer) dancingGifContainer.classList.add('visible');
                initAudioVisualizer();
            })
            .catch(error => {
                console.error("Error saat mencoba play audio:", error);
                if(currentSongTitleDisplay) currentSongTitleDisplay.textContent = "Gagal memutar lagu";
                if(currentSongArtistDisplay) currentSongArtistDisplay.textContent = "Periksa file atau path";
                isPlaying = false;
                if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                if(albumArtImg) albumArtImg.classList.remove('playing');
                if(dancingGifContainer) dancingGifContainer.classList.remove('visible');
            });
    }

    function pauseTrack() {
        isPlaying = false;
        if(audioPlayer) audioPlayer.pause();
        if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if(albumArtImg) albumArtImg.classList.remove('playing');
        if(dancingGifContainer) dancingGifContainer.classList.remove('visible');
    }

    function togglePlayPause() {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    }

    // --- Fungsi Navigasi Lagu (dari kode Anda) ---
    function prevTrack() { /* ... kode Anda ... */ if (playlistItems.length === 0) return; let newIndex = currentTrackIndex - 1; if (newIndex < 0) newIndex = playlistItems.length - 1; loadTrack(newIndex); }
    function nextTrackLogic() { /* ... kode Anda ... */ if (playlistItems.length === 0) return 0; let newIndex = currentTrackIndex + 1; if (newIndex >= playlistItems.length) newIndex = 0; return newIndex; }
    function shuffleNextTrack() { /* ... kode Anda ... */ if (playlistItems.length <= 1) return currentTrackIndex; let randomIndex; do { randomIndex = Math.floor(Math.random() * playlistItems.length); } while (randomIndex === currentTrackIndex && playlistItems.length > 1); return randomIndex; }
    function nextTrack() { /* ... kode Anda ... */  if (playlistItems.length === 0) return; const newIndex = isShuffle ? shuffleNextTrack() : nextTrackLogic(); loadTrack(newIndex); }

    // --- Fungsi Update UI (dari kode Anda) ---
    function updateProgressBar() { /* ... kode Anda ... */ if (audioPlayer && audioPlayer.duration && isFinite(audioPlayer.duration)) { const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100; if(progressBar) progressBar.value = percentage; if(currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime); } else { if(progressBar) progressBar.value = 0; if(currentTimeDisplay) currentTimeDisplay.textContent = "0:00"; } }
    function formatTime(seconds) { /* ... kode Anda ... */ const flooredSeconds = Math.floor(seconds); const minutes = Math.floor(flooredSeconds / 60); const secs = flooredSeconds % 60; return `${minutes}:${secs < 10 ? '0' : ''}${secs}`; }

    // --- Logika untuk Fitur Ganti GIF ---
    function loadAndSetSelectedGif() {
        if (!dancingGifImage || !gifChoiceSelect) {
            // console.warn("Elemen untuk GIF atau pilihan GIF tidak ditemukan.");
            return;
        }

        const savedGifPath = localStorage.getItem('selectedGifPath');
        const defaultGifPath = gifChoiceSelect.options.length > 0 ? gifChoiceSelect.options[0].value : (dancingGifImage.src || '');

        if (savedGifPath) {
            let pathExistsInSelect = false;
            for (let i = 0; i < gifChoiceSelect.options.length; i++) {
                if (gifChoiceSelect.options[i].value === savedGifPath) {
                    gifChoiceSelect.selectedIndex = i;
                    pathExistsInSelect = true;
                    break;
                }
            }
            if (pathExistsInSelect) {
                dancingGifImage.src = savedGifPath;
            } else {
                console.warn(`Path GIF tersimpan '${savedGifPath}' tidak valid. Kembali ke default.`);
                dancingGifImage.src = defaultGifPath;
                if (gifChoiceSelect.options.length > 0) gifChoiceSelect.selectedIndex = 0;
                localStorage.setItem('selectedGifPath', defaultGifPath);
            }
        } else if (defaultGifPath) {
            dancingGifImage.src = defaultGifPath;
            if (gifChoiceSelect.options.length > 0) gifChoiceSelect.selectedIndex = 0;
            localStorage.setItem('selectedGifPath', defaultGifPath);
        }
    }
    // --- Akhir Logika Fitur Ganti GIF ---


    // --- Event Listeners Utama (dari kode Anda, dengan pengecekan elemen) ---
    if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if(prevBtn) prevBtn.addEventListener('click', prevTrack);
    if(nextBtn) nextBtn.addEventListener('click', nextTrack);

    if(audioPlayer) {
        audioPlayer.addEventListener('loadedmetadata', () => { /* ... kode Anda ... */ if (audioPlayer.duration && isFinite(audioPlayer.duration)) { if(durationDisplay) durationDisplay.textContent = formatTime(audioPlayer.duration); } else { if(durationDisplay) durationDisplay.textContent = "0:00"; } updateProgressBar(); });
        audioPlayer.addEventListener('error', (e) => { /* ... kode Anda ... */ console.error("Audio Player Error Event:", e); let message = "Gagal memuat media."; if (audioPlayer.error) { console.error("Audio Player Error Details:", audioPlayer.error); switch (audioPlayer.error.code) { case MediaError.MEDIA_ERR_ABORTED: message = 'Pemutaran media dibatalkan.'; break; case MediaError.MEDIA_ERR_NETWORK: message = 'Kesalahan jaringan.'; break; case MediaError.MEDIA_ERR_DECODE: message = 'Gagal mendekode (file rusak?).'; break; case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: message = 'Sumber tidak didukung/ditemukan.'; break; default: message = 'Kesalahan media tidak diketahui.'; } } if(currentSongTitleDisplay) currentSongTitleDisplay.textContent = message; if(currentSongArtistDisplay) currentSongArtistDisplay.textContent = "Periksa file atau path"; isPlaying = false; if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; if(albumArtImg) albumArtImg.classList.remove('playing'); if(dancingGifContainer) dancingGifContainer.classList.remove('visible'); });
        audioPlayer.addEventListener('timeupdate', updateProgressBar);
        audioPlayer.addEventListener('ended', () => { /* ... kode Anda ... */ if(albumArtImg) albumArtImg.classList.remove('playing'); if(dancingGifContainer) dancingGifContainer.classList.remove('visible'); if (repeatMode === 2) { loadTrack(currentTrackIndex, true); } else if (repeatMode === 1 || (currentTrackIndex < playlistItems.length - 1 || isShuffle)) { nextTrack(); } else { pauseTrack(); } });
    }

    if(progressBar) progressBar.addEventListener('input', () => { /* ... kode Anda ... */ if (audioPlayer && audioPlayer.duration && isFinite(audioPlayer.duration)) { const seekTime = (progressBar.value / 100) * audioPlayer.duration; audioPlayer.currentTime = seekTime; } });
    if(volumeSlider) volumeSlider.addEventListener('input', () => { /* ... kode Anda ... */ if(audioPlayer) audioPlayer.volume = volumeSlider.value; });
    if(playlistUl) playlistUl.addEventListener('click', (e) => { /* ... kode Anda ... */ const listItem = e.target.closest('li[data-src]'); if (listItem) { const trackIndex = playlistItems.indexOf(listItem); if (trackIndex !== -1) { loadTrack(trackIndex); } } });
    if(folderChoiceSelect) folderChoiceSelect.addEventListener('change', (e) => { /* ... kode Anda ... */ window.location.href = `index.php?folder=${encodeURIComponent(e.target.value)}`; });
    if(shuffleBtn) shuffleBtn.addEventListener('click', () => { /* ... kode Anda ... */ isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); console.log("Shuffle mode:", isShuffle ? "ON" : "OFF"); });
    if(repeatBtn) repeatBtn.addEventListener('click', () => { /* ... kode Anda ... */ repeatMode = (repeatMode + 1) % 3; const iconElement = repeatBtn.querySelector('i'); if(iconElement) iconElement.className = 'fas fa-repeat'; switch (repeatMode) { case 0: repeatBtn.classList.remove('active'); repeatBtn.title = "Ulangi: Tidak Aktif"; break; case 1: repeatBtn.classList.add('active'); repeatBtn.title = "Ulangi: Semua"; break; case 2: repeatBtn.classList.add('active'); if(iconElement) iconElement.className = 'fas fa-redo-alt'; repeatBtn.title = "Ulangi: Satu Lagu"; break; } });
    if(customFolderInput) customFolderInput.addEventListener('change', (e) => { /* ... kode Anda ... */ const files = Array.from(e.target.files).filter(file => file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')); if(playlistUl) playlistUl.innerHTML = ''; playlistItems = []; let newPlaylistName = "Folder Pilihan Anda"; if (files.length > 0 && files[0].webkitRelativePath) { const firstFilePathParts = files[0].webkitRelativePath.split('/'); if (firstFilePathParts.length > 1) newPlaylistName = firstFilePathParts[0]; } if (playlistTitleElement) playlistTitleElement.textContent = `Playlist: ${newPlaylistName}`; if (files.length > 0) { files.forEach(file => { const listItem = document.createElement('li'); const songTitle = document.createElement('span'); songTitle.className = 'song-title'; songTitle.textContent = file.name.replace(/\.[^/.]+$/, ""); listItem.appendChild(songTitle); const objectURL = URL.createObjectURL(file); listItem.dataset.src = objectURL; playlistItems.push(listItem); if(playlistUl) playlistUl.appendChild(listItem); }); loadTrack(0, false); } else { if(playlistUl) playlistUl.innerHTML = '<li class="no-files">Tidak ada file MP3 di folder yang dipilih.</li>'; loadTrack(-1); } customFolderInput.value = null; });
    
    // Event listener untuk pilihan GIF
    if (gifChoiceSelect && dancingGifImage) { // Pastikan kedua elemen ada
        gifChoiceSelect.addEventListener('change', function() {
            dancingGifImage.src = this.value;
            localStorage.setItem('selectedGifPath', this.value);
        });
    }

    // --- Fungsi Inisialisasi Utama Player ---
    function initializePlayer() {
        loadAndSetSelectedGif(); // PANGGIL FUNGSI UNTUK MEMUAT GIF YANG DIPILIH/TERSIMPAN

        if (playlistItems.length > 0) {
            loadTrack(0, false);
        } else {
            loadTrack(-1);
        }
        resizeCanvas();
        if (visualizerCanvas && canvasCtx) {
             requestAnimationFrame(drawVisualizer);
        }
    }

    // --- Fungsi Atur Ulang Ukuran Canvas (dari kode Anda) ---
    function resizeCanvas() { /* ... kode Anda ... */ if (visualizerCanvas && visualizerCanvas.clientWidth > 0 && visualizerCanvas.clientHeight > 0) { visualizerCanvas.width = visualizerCanvas.clientWidth; visualizerCanvas.height = visualizerCanvas.clientHeight; } else if (visualizerCanvas) { visualizerCanvas.width = 300; visualizerCanvas.height = 80; } }
    window.addEventListener('resize', resizeCanvas);
    
    // Panggil inisialisasi utama
    initializePlayer();

    // --- Kode untuk Drag GIF (dari kode Anda, dengan pengecekan elemen) ---
    let isDraggingGif = false;
    let gifOffsetX, gifOffsetY;
    if (dancingGifContainer && dancingGifImage) { // Pastikan kontainer dan gambar GIF ada
        dancingGifContainer.addEventListener('mousedown', (e) => { /* ... kode Anda ... */ if (e.target === dancingGifContainer || e.target === dancingGifImage) { isDraggingGif = true; dancingGifContainer.style.cursor = 'grabbing'; const rect = dancingGifContainer.getBoundingClientRect(); gifOffsetX = e.clientX - rect.left; gifOffsetY = e.clientY - rect.top; e.preventDefault(); } });
        document.addEventListener('mousemove', (e) => { /* ... kode Anda ... */ if (!isDraggingGif) return; if (!dancingGifContainer.parentElement) return; const parentRect = dancingGifContainer.parentElement.getBoundingClientRect(); let newX = e.clientX - parentRect.left - gifOffsetX; let newY = e.clientY - parentRect.top - gifOffsetY; newX = Math.max(0, Math.min(newX, parentRect.width - dancingGifContainer.offsetWidth)); newY = Math.max(0, Math.min(newY, parentRect.height - dancingGifContainer.offsetHeight)); dancingGifContainer.style.left = `${newX}px`; dancingGifContainer.style.top = `${newY}px`; dancingGifContainer.style.bottom = 'auto'; dancingGifContainer.style.right = 'auto'; });
        document.addEventListener('mouseup', () => { /* ... kode Anda ... */ if (isDraggingGif) { isDraggingGif = false; dancingGifContainer.style.cursor = 'grab'; } });
    }
});