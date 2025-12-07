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
});

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
        window.location.href = 'home.html?showOverview=true';
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
                    rejectPhoto();
                } else if (betaDiff > 15) {
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

