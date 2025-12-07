// State Management
let state = {
    currentPhotos: [],
    selectedPhotos: [],
    currentPhotoIndex: 0,
    currentAlbum: null,
    albums: [],
    stream: null,
    location: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAlbums();
    setupEventListeners();
    requestLocation();
});

// Event Listeners
function setupEventListeners() {
    // Home screen
    document.getElementById('new-session-btn').addEventListener('click', startNewSession);
    
    // Camera screen
    document.getElementById('back-btn').addEventListener('click', goToHome);
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('finish-session-btn').addEventListener('click', finishSession);
    
    // Selection screen listeners will be set up when screen is shown
    
    // Overview screen
    document.getElementById('back-overview-btn').addEventListener('click', goToHome);
    document.getElementById('create-album-btn').addEventListener('click', () => {
        if (!state.currentAlbum) {
            showNamePopup();
        } else {
            createAlbum();
        }
    });
    
    // Name popup
    document.getElementById('cancel-name-btn').addEventListener('click', hideNamePopup);
    document.getElementById('confirm-name-btn').addEventListener('click', () => {
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
    
    // Slideshow screen
    document.getElementById('back-slideshow-btn').addEventListener('click', goToHome);
    document.getElementById('prev-slide-btn').addEventListener('click', () => navigateSlide(-1));
    document.getElementById('next-slide-btn').addEventListener('click', () => navigateSlide(1));
}

// Camera Functions
async function startNewSession() {
    state.currentPhotos = [];
    state.selectedPhotos = [];
    state.currentPhotoIndex = 0;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        
        state.stream = stream;
        const video = document.getElementById('video');
        video.srcObject = stream;
        
        showScreen('camera-screen');
        updatePhotoPreview();
    } catch (error) {
        alert('Kamera konnte nicht geöffnet werden. Bitte Berechtigung erteilen.');
        console.error('Camera error:', error);
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoData = e.target.result;
            state.currentPhotos.push(photoData);
            updatePhotoPreview();
            
            if (state.currentPhotos.length > 0) {
                document.getElementById('finish-session-btn').style.display = 'block';
            }
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
}

function updatePhotoPreview() {
    const container = document.getElementById('photo-preview-container');
    container.innerHTML = '';
    
    state.currentPhotos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo;
        img.className = 'photo-preview';
        container.appendChild(img);
    });
}

function finishSession() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    
    if (state.currentPhotos.length === 0) {
        alert('Bitte mindestens ein Foto aufnehmen!');
        return;
    }
    
    state.selectedPhotos = [...state.currentPhotos];
    state.currentPhotoIndex = 0;
    showSelectionScreen();
}

// Selection Screen
function showSelectionScreen() {
    showScreen('selection-screen');
    displaySelectionPhoto();
    setupSelectionListeners();
}

function displaySelectionPhoto() {
    if (state.selectedPhotos.length === 0) {
        alert('Alle Fotos wurden verworfen. Bitte neue Fotos aufnehmen.');
        goToHome();
        return;
    }
    
    if (state.currentPhotoIndex >= state.selectedPhotos.length) {
        showOverviewScreen();
        return;
    }
    
    const img = document.getElementById('selection-image');
    const counter = document.getElementById('photo-counter');
    
    img.src = state.selectedPhotos[state.currentPhotoIndex];
    counter.textContent = `${state.currentPhotoIndex + 1} / ${state.selectedPhotos.length}`;
}

// Selection listeners state
let selectionListenersSetup = false;
let selectionTouchHandler = null;
let selectionMouseHandler = null;
let selectionKeyHandler = null;
let selectionOrientationHandler = null;

function setupSelectionListeners() {
    // Remove old listeners if they exist
    if (selectionListenersSetup) {
        const container = document.getElementById('selection-image-container');
        if (selectionTouchHandler) {
            container.removeEventListener('touchstart', selectionTouchHandler.start);
            container.removeEventListener('touchmove', selectionTouchHandler.move);
            container.removeEventListener('touchend', selectionTouchHandler.end);
        }
        if (selectionMouseHandler) {
            container.removeEventListener('mousedown', selectionMouseHandler.down);
            container.removeEventListener('mousemove', selectionMouseHandler.move);
            container.removeEventListener('mouseup', selectionMouseHandler.up);
            container.removeEventListener('mouseleave', selectionMouseHandler.leave);
        }
        if (selectionKeyHandler) {
            document.removeEventListener('keydown', selectionKeyHandler);
        }
        if (selectionOrientationHandler) {
            window.removeEventListener('deviceorientation', selectionOrientationHandler);
        }
    }
    
    const container = document.getElementById('selection-image-container');
    const img = document.getElementById('selection-image');
    
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    // Touch events
    const touchStart = (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    };
    
    const touchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        
        img.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`;
        
        // Show indicators
        const rejectIndicator = document.querySelector('.reject-indicator');
        const keepIndicator = document.querySelector('.keep-indicator');
        
        if (currentX < -50) {
            rejectIndicator.classList.add('show');
            keepIndicator.classList.remove('show');
        } else if (currentX > 50) {
            keepIndicator.classList.add('show');
            rejectIndicator.classList.remove('show');
        } else {
            rejectIndicator.classList.remove('show');
            keepIndicator.classList.remove('show');
        }
    };
    
    const touchEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        if (currentX < -100) {
            // Reject (left)
            rejectPhoto();
        } else if (currentX > 100) {
            // Keep (right)
            keepPhoto();
        } else {
            // Reset position
            img.style.transform = '';
        }
        
        document.querySelector('.reject-indicator').classList.remove('show');
        document.querySelector('.keep-indicator').classList.remove('show');
    };
    
    container.addEventListener('touchstart', touchStart);
    container.addEventListener('touchmove', touchMove);
    container.addEventListener('touchend', touchEnd);
    
    selectionTouchHandler = { start: touchStart, move: touchMove, end: touchEnd };
    
    // Mouse events for desktop
    let mouseDown = false;
    let mouseStartX = 0;
    
    const mouseDownHandler = (e) => {
        mouseDown = true;
        mouseStartX = e.clientX;
    };
    
    const mouseMoveHandler = (e) => {
        if (!mouseDown) return;
        currentX = e.clientX - mouseStartX;
        
        img.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`;
        
        const rejectIndicator = document.querySelector('.reject-indicator');
        const keepIndicator = document.querySelector('.keep-indicator');
        
        if (currentX < -50) {
            rejectIndicator.classList.add('show');
            keepIndicator.classList.remove('show');
        } else if (currentX > 50) {
            keepIndicator.classList.add('show');
            rejectIndicator.classList.remove('show');
        } else {
            rejectIndicator.classList.remove('show');
            keepIndicator.classList.remove('show');
        }
    };
    
    const mouseUpHandler = (e) => {
        if (!mouseDown) return;
        mouseDown = false;
        
        if (currentX < -100) {
            rejectPhoto();
        } else if (currentX > 100) {
            keepPhoto();
        } else {
            img.style.transform = '';
        }
        
        document.querySelector('.reject-indicator').classList.remove('show');
        document.querySelector('.keep-indicator').classList.remove('show');
    };
    
    const mouseLeaveHandler = () => {
        mouseDown = false;
        img.style.transform = '';
        document.querySelector('.reject-indicator').classList.remove('show');
        document.querySelector('.keep-indicator').classList.remove('show');
    };
    
    container.addEventListener('mousedown', mouseDownHandler);
    container.addEventListener('mousemove', mouseMoveHandler);
    container.addEventListener('mouseup', mouseUpHandler);
    container.addEventListener('mouseleave', mouseLeaveHandler);
    
    selectionMouseHandler = { down: mouseDownHandler, move: mouseMoveHandler, up: mouseUpHandler, leave: mouseLeaveHandler };
    
    // Keyboard events
    selectionKeyHandler = handleSelectionKey;
    document.addEventListener('keydown', selectionKeyHandler);
    
    // Device orientation (tilt sensor)
    if (window.DeviceOrientationEvent) {
        let lastBeta = null;
        selectionOrientationHandler = (e) => {
            if (lastBeta === null) {
                lastBeta = e.beta;
                return;
            }
            
            const betaDiff = e.beta - lastBeta;
            if (Math.abs(betaDiff) > 15) {
                if (betaDiff < -15) {
                    // Tilt left = reject
                    rejectPhoto();
                } else if (betaDiff > 15) {
                    // Tilt right = keep
                    keepPhoto();
                }
                lastBeta = e.beta;
            }
        };
        window.addEventListener('deviceorientation', selectionOrientationHandler);
    }
    
    selectionListenersSetup = true;
}

function handleSelectionKey(e) {
    if (document.getElementById('selection-screen').classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            rejectPhoto();
        } else if (e.key === 'ArrowRight') {
            keepPhoto();
        }
    }
}

function rejectPhoto() {
    // Reset image transform
    const img = document.getElementById('selection-image');
    img.style.transform = '';
    
    state.selectedPhotos.splice(state.currentPhotoIndex, 1);
    if (state.currentPhotoIndex >= state.selectedPhotos.length && state.selectedPhotos.length > 0) {
        state.currentPhotoIndex = state.selectedPhotos.length - 1;
    }
    displaySelectionPhoto();
}

function keepPhoto() {
    // Reset image transform
    const img = document.getElementById('selection-image');
    img.style.transform = '';
    
    state.currentPhotoIndex++;
    displaySelectionPhoto();
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

function confirmAlbumName() {
    // This function is now handled by the event listener above
    // Keeping it for backwards compatibility but it won't be called
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
    state.currentPhotos = [];
    state.selectedPhotos = [];
    
    goToHome();
}


function loadAlbums() {
    const saved = localStorage.getItem('albums');
    if (saved) {
        state.albums = JSON.parse(saved);
    }
    
    const container = document.getElementById('albums-container');
    const emptyState = document.getElementById('empty-state');
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
    
    // Touch swipe for slideshow
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
    
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwipe = true;
    });
    
    container.addEventListener('touchmove', (e) => {
        if (!isSwipe) return;
        e.preventDefault();
    });
    
    container.addEventListener('touchend', (e) => {
        if (!isSwipe) return;
        isSwipe = false;
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                navigateSlide(1); // Swipe left = next
            } else {
                navigateSlide(-1); // Swipe right = prev
            }
        }
    });
    
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
    
    document.removeEventListener('keydown', keyHandler);
    document.addEventListener('keydown', keyHandler);
}

// Location
function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Reverse geocoding would require an API, so we'll just show coordinates
                // or use a simple service
                state.location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                updateLocationDisplay();
                
                // Try to get address from OpenStreetMap Nominatim (free, no API key needed)
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
    document.getElementById(screenId).classList.add('active');
}

function goToHome() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    showScreen('home-screen');
}

