// Overview Screen
let state = {
    selectedPhotos: [],
    currentAlbum: null,
    location: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSelectedPhotos();
    setupEventListeners();
    requestLocation();
});

function loadSelectedPhotos() {
    const saved = localStorage.getItem('selectedPhotos');
    if (saved) {
        state.selectedPhotos = JSON.parse(saved);
        displayOverview();
    } else {
        // No photos, go back to home
        window.location.href = 'home.html';
    }
}

function displayOverview() {
    const grid = document.getElementById('overview-grid');
    grid.innerHTML = '';
    
    state.selectedPhotos.forEach((photo) => {
        const img = document.createElement('img');
        img.src = photo;
        img.className = 'overview-thumbnail';
        grid.appendChild(img);
    });
}

// Event Listeners
function setupEventListeners() {
    // Overview screen
    document.getElementById('back-overview-btn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });
    
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
    
    // Load existing albums
    let albums = [];
    const saved = localStorage.getItem('albums');
    if (saved) {
        albums = JSON.parse(saved);
    }
    
    // Add new album
    albums.push(state.currentAlbum);
    localStorage.setItem('albums', JSON.stringify(albums));
    
    // Clear temporary data
    localStorage.removeItem('selectedPhotos');
    localStorage.removeItem('currentPhotos');
    
    // Navigate to home
    window.location.href = 'home.html';
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

