// Selection Screen
let state = {
    selectedPhotos: [],
    currentPhotoIndex: 0
};

// Selection listeners state
let selectionListenersSetup = false;
let selectionTouchHandler = null;
let selectionMouseHandler = null;
let selectionKeyHandler = null;
let selectionOrientationHandler = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    displaySelectionPhoto();
    setupSelectionListeners();
    
    // Check if permission was already granted in permissions page
    const orientationPermission = localStorage.getItem('orientationPermission');
    if (orientationPermission === 'granted' || typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
        // Permission already granted or not needed
        setupOrientationListener();
    } else {
        // Need to request permission
        requestOrientationPermission();
    }
});

function requestOrientationPermission() {
    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Show a message or button to request permission
        const container = document.getElementById('selection-image-container');
        if (container) {
            const permissionMsg = document.createElement('div');
            permissionMsg.id = 'orientation-permission-msg';
            permissionMsg.style.cssText = 'position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 20px; z-index: 20; text-align: center; font-size: 0.9rem; cursor: pointer;';
            permissionMsg.innerHTML = 'Tippen Sie hier, um Neigungssteuerung zu aktivieren';
            permissionMsg.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            permissionMsg.remove();
                            localStorage.setItem('orientationPermission', 'granted');
                            // Setup orientation listener after permission granted
                            setupOrientationListener();
                        } else {
                            permissionMsg.textContent = 'Neigungssteuerung nicht verfügbar';
                            localStorage.setItem('orientationPermission', 'denied');
                            setTimeout(() => permissionMsg.remove(), 2000);
                        }
                    })
                    .catch(err => {
                        console.error('Orientation permission error:', err);
                        permissionMsg.remove();
                        localStorage.setItem('orientationPermission', 'denied');
                    });
            });
            container.appendChild(permissionMsg);
            setTimeout(() => {
                if (permissionMsg.parentNode) {
                    permissionMsg.remove();
                }
            }, 5000);
        }
    } else {
        // Permission not needed, setup directly
        setupOrientationListener();
    }
}

function loadPhotos() {
    const saved = localStorage.getItem('currentPhotos');
    if (saved) {
        const photos = JSON.parse(saved);
        state.selectedPhotos = [...photos];
        state.currentPhotoIndex = 0;
    } else {
        // No photos, go back to home
        window.location.href = 'home.html';
    }
}

function displaySelectionPhoto() {
    if (state.selectedPhotos.length === 0) {
        alert('Alle Fotos wurden verworfen. Bitte neue Fotos aufnehmen.');
        window.location.href = 'home.html';
        return;
    }
    
    if (state.currentPhotoIndex >= state.selectedPhotos.length) {
        // All photos processed, go to overview
        localStorage.setItem('selectedPhotos', JSON.stringify(state.selectedPhotos));
        window.location.href = 'overview.html';
        return;
    }
    
    const img = document.getElementById('selection-image');
    const counter = document.getElementById('photo-counter');
    
    img.src = state.selectedPhotos[state.currentPhotoIndex];
    counter.textContent = `${state.currentPhotoIndex + 1} / ${state.selectedPhotos.length}`;
}

function setupSelectionListeners() {
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
            rejectPhoto();
        } else if (currentX > 100) {
            keepPhoto();
        } else {
            img.style.transform = '';
        }
        
        document.querySelector('.reject-indicator').classList.remove('show');
        document.querySelector('.keep-indicator').classList.remove('show');
    };
    
    container.addEventListener('touchstart', touchStart);
    container.addEventListener('touchmove', touchMove);
    container.addEventListener('touchend', touchEnd);
    
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
    
    // Keyboard events
    selectionKeyHandler = handleSelectionKey;
    document.addEventListener('keydown', selectionKeyHandler);
    
    // Device orientation will be set up by requestOrientationPermission
}

function setupOrientationListener() {
    if (typeof DeviceOrientationEvent === 'undefined') {
        console.log('DeviceOrientationEvent not supported');
        return;
    }
    
    // Remove existing listener if any
    if (selectionOrientationHandler) {
        window.removeEventListener('deviceorientation', selectionOrientationHandler);
    }
    
    let lastGamma = null;
    let tiltCooldown = false;
    let tiltThreshold = 20; // Degrees of tilt needed (reduced for better sensitivity)
    let lastUpdateTime = 0;
    
    selectionOrientationHandler = (e) => {
        const now = Date.now();
        
        // Throttle updates to every 100ms
        if (now - lastUpdateTime < 100) return;
        lastUpdateTime = now;
        
        if (lastGamma === null) {
            lastGamma = e.gamma || 0;
            return;
        }
        
        if (tiltCooldown) return;
        
        const gamma = e.gamma || 0;
        const gammaDiff = gamma - lastGamma;
        
        // Use gamma (left-right tilt) for selection
        // Gamma: negative = left tilt (reject), positive = right tilt (keep)
        if (Math.abs(gammaDiff) > tiltThreshold) {
            tiltCooldown = true;
            
            // Show visual feedback
            const img = document.getElementById('selection-image');
            const rejectIndicator = document.querySelector('.reject-indicator');
            const keepIndicator = document.querySelector('.keep-indicator');
            
            if (gammaDiff < -tiltThreshold) {
                // Tilt left = reject
                if (rejectIndicator) rejectIndicator.classList.add('show');
                if (keepIndicator) keepIndicator.classList.remove('show');
                if (img) img.style.transform = 'translateX(-50px) rotate(-5deg)';
                
                setTimeout(() => {
                    rejectPhoto();
                    if (img) img.style.transform = '';
                    if (rejectIndicator) rejectIndicator.classList.remove('show');
                }, 200);
            } else if (gammaDiff > tiltThreshold) {
                // Tilt right = keep
                if (keepIndicator) keepIndicator.classList.add('show');
                if (rejectIndicator) rejectIndicator.classList.remove('show');
                if (img) img.style.transform = 'translateX(50px) rotate(5deg)';
                
                setTimeout(() => {
                    keepPhoto();
                    if (img) img.style.transform = '';
                    if (keepIndicator) keepIndicator.classList.remove('show');
                }, 200);
            }
            
            // Cooldown to prevent multiple triggers
            setTimeout(() => {
                tiltCooldown = false;
                lastGamma = gamma;
            }, 600);
        } else {
            // Update lastGamma gradually to prevent drift
            lastGamma = lastGamma * 0.9 + gamma * 0.1;
        }
    };
    
    // Add event listener
    window.addEventListener('deviceorientation', selectionOrientationHandler);
    
    console.log('Orientation listener setup complete');
}

function handleSelectionKey(e) {
    if (e.key === 'ArrowLeft') {
        rejectPhoto();
    } else if (e.key === 'ArrowRight') {
        keepPhoto();
    }
}

function rejectPhoto() {
    const img = document.getElementById('selection-image');
    img.style.transform = '';
    
    state.selectedPhotos.splice(state.currentPhotoIndex, 1);
    if (state.currentPhotoIndex >= state.selectedPhotos.length && state.selectedPhotos.length > 0) {
        state.currentPhotoIndex = state.selectedPhotos.length - 1;
    }
    displaySelectionPhoto();
}

function keepPhoto() {
    const img = document.getElementById('selection-image');
    img.style.transform = '';
    
    state.currentPhotoIndex++;
    displaySelectionPhoto();
}

