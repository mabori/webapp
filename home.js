// State Management
let state = {
    selectedPhotos: [],
    currentAlbum: null,
    albums: [],
    location: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if permissions were requested
    const permissionsRequested = localStorage.getItem('permissionsRequested');
    if (permissionsRequested !== 'true') {
        window.location.href = 'permissions.html';
        return;
    }
    
    loadAlbums();
    setupEventListeners();
    requestLocation();
    checkForOverview();
});

// Check if we should show overview screen
function checkForOverview() {
    // Overview screen should not be shown on home page anymore
    // It's now a separate page (overview.html)
    // Hide overview screen if it exists
    const overviewScreen = document.getElementById('overview-screen');
    if (overviewScreen) {
        overviewScreen.classList.remove('active');
    }
}

// Event Listeners
function setupEventListeners() {
    // Home screen
    const newSessionBtn = document.getElementById('new-session-btn');
    if (newSessionBtn) {
        newSessionBtn.addEventListener('click', () => {
            window.location.href = 'camera.html';
        });
    }
    
    // Overview screen
    const backOverviewBtn = document.getElementById('back-overview-btn');
    if (backOverviewBtn) {
        backOverviewBtn.addEventListener('click', goToHome);
    }
    
    const createAlbumBtn = document.getElementById('create-album-btn');
    if (createAlbumBtn) {
        createAlbumBtn.addEventListener('click', () => {
            if (!state.currentAlbum) {
                showNamePopup();
            } else {
                createAlbum();
            }
        });
    }
    
    // Name popup
    const cancelNameBtn = document.getElementById('cancel-name-btn');
    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', hideNamePopup);
    }
    
    const confirmNameBtn = document.getElementById('confirm-name-btn');
    if (confirmNameBtn) {
        confirmNameBtn.addEventListener('click', () => {
            const name = document.getElementById('album-name-input').value.trim();
            if (!name) {
                alert('Bitte einen Namen eingeben!');
                return;
            }
            
            state.currentAlbum = {
                name: name,
                photos: [...state.selectedPhotos],
                location: state.location,
                date: new Date().toISOString()
            };
            
            hideNamePopup();
            createAlbum();
        });
    }
    
    // Slideshow screen
    const backSlideshowBtn = document.getElementById('back-slideshow-btn');
    if (backSlideshowBtn) {
        backSlideshowBtn.addEventListener('click', goToHome);
    }
    
    const prevSlideBtn = document.getElementById('prev-slide-btn');
    if (prevSlideBtn) {
        prevSlideBtn.addEventListener('click', () => navigateSlide(-1));
    }
    
    const nextSlideBtn = document.getElementById('next-slide-btn');
    if (nextSlideBtn) {
        nextSlideBtn.addEventListener('click', () => navigateSlide(1));
    }
}

// Overview Screen
function showOverviewScreen() {
    showScreen('overview-screen');
    const grid = document.getElementById('overview-grid');
    grid.innerHTML = '';
    
    state.selectedPhotos.forEach((photo) => {
        const img = document.createElement('img');
        img.src = photo;
        img.className = 'overview-thumbnail';
        grid.appendChild(img);
    });
}

// Name Popup
function showNamePopup() {
    if (state.selectedPhotos.length === 0) {
        alert('Keine Fotos ausgewählt!');
        return;
    }
    
    document.getElementById('album-name-input').value = '';
    updateLocationDisplay();
    document.getElementById('name-popup').classList.add('active');
    document.getElementById('album-name-input').focus();
}

function hideNamePopup() {
    document.getElementById('name-popup').classList.remove('active');
}

// Album Management
function createAlbum() {
    if (!state.currentAlbum) {
        showNamePopup();
        return;
    }
    
    state.albums.push(state.currentAlbum);
    saveAlbums();
    loadAlbums();
    
    state.currentAlbum = null;
    state.selectedPhotos = [];
    localStorage.removeItem('selectedPhotos');
    
    goToHome();
}

function loadAlbums() {
    const saved = localStorage.getItem('albums');
    if (saved) {
        state.albums = JSON.parse(saved);
    }
    
    const container = document.getElementById('albums-container');
    const emptyState = document.getElementById('empty-state');
    if (!container || !emptyState) return;
    
    container.innerHTML = '';
    
    if (state.albums.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        
        state.albums.forEach((album, index) => {
            const card = document.createElement('div');
            card.className = 'album-card';
            
            const img = document.createElement('img');
            img.src = album.photos[0] || '';
            img.className = 'album-thumbnail';
            img.alt = album.name;
            
            const name = document.createElement('div');
            name.className = 'album-name';
            name.textContent = album.name;
            
            card.appendChild(img);
            card.appendChild(name);
            
            card.addEventListener('click', () => {
                showSlideshow(index);
            });
            
            container.appendChild(card);
        });
    }
}

function saveAlbums() {
    localStorage.setItem('albums', JSON.stringify(state.albums));
}

// Slideshow
let currentSlideIndex = 0;

function showSlideshow(albumIndex) {
    const album = state.albums[albumIndex];
    if (!album || !album.photos || album.photos.length === 0) return;
    
    state.currentAlbum = album;
    currentSlideIndex = 0;
    
    document.getElementById('slideshow-title').textContent = album.name;
    showScreen('slideshow-screen');
    displaySlide();
    
    setupSlideshowSwipe();
}

function displaySlide() {
    const album = state.currentAlbum;
    if (!album || !album.photos) return;
    
    const img = document.getElementById('slideshow-image');
    const counter = document.getElementById('slide-counter');
    
    img.src = album.photos[currentSlideIndex];
    counter.textContent = `${currentSlideIndex + 1} / ${album.photos.length}`;
}

function navigateSlide(direction) {
    const album = state.currentAlbum;
    if (!album || !album.photos) return;
    
    currentSlideIndex += direction;
    
    if (currentSlideIndex < 0) {
        currentSlideIndex = album.photos.length - 1;
    } else if (currentSlideIndex >= album.photos.length) {
        currentSlideIndex = 0;
    }
    
    displaySlide();
}

function setupSlideshowSwipe() {
    const container = document.getElementById('slideshow-container');
    let startX = 0;
    let isSwipe = false;
    
    const touchStart = (e) => {
        startX = e.touches[0].clientX;
        isSwipe = true;
    };
    
    const touchEnd = (e) => {
        if (!isSwipe) return;
        isSwipe = false;
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                navigateSlide(1);
            } else {
                navigateSlide(-1);
            }
        }
    };
    
    container.addEventListener('touchstart', touchStart);
    container.addEventListener('touchend', touchEnd);
    
    // Keyboard navigation
    const keyHandler = (e) => {
        if (document.getElementById('slideshow-screen').classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                navigateSlide(-1);
            } else if (e.key === 'ArrowRight') {
                navigateSlide(1);
            }
        }
    };
    
    document.addEventListener('keydown', keyHandler);
}

// Location
function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                state.location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                updateLocationDisplay();
                
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.address) {
                            const address = data.address;
                            let locationStr = '';
                            if (address.city || address.town || address.village) {
                                locationStr = address.city || address.town || address.village;
                            } else if (address.county) {
                                locationStr = address.county;
                            } else if (address.country) {
                                locationStr = address.country;
                            }
                            if (locationStr) {
                                state.location = locationStr;
                                updateLocationDisplay();
                            }
                        }
                    })
                    .catch(err => console.log('Geocoding error:', err));
            },
            (error) => {
                state.location = 'Ort nicht verfügbar';
                updateLocationDisplay();
                console.error('Geolocation error:', error);
            }
        );
    } else {
        state.location = 'Geolocation nicht unterstützt';
        updateLocationDisplay();
    }
}

function updateLocationDisplay() {
    const display = document.getElementById('location-display');
    if (display) {
        display.textContent = state.location || 'Wird ermittelt...';
    }
}

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

function goToHome() {
    showScreen('home-screen');
    // Clear URL params
    window.history.replaceState({}, document.title, 'home.html');
}

