// Camera Functions
let state = {
    currentPhotos: [],
    stream: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    startCamera();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('back-btn').addEventListener('click', goToHome);
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('finish-session-btn').addEventListener('click', finishSession);
}

async function startCamera() {
    state.currentPhotos = [];
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        
        state.stream = stream;
        const video = document.getElementById('video');
        video.srcObject = stream;
        
        updatePhotoPreview();
    } catch (error) {
        alert('Kamera konnte nicht geöffnet werden. Bitte Berechtigung erteilen.');
        console.error('Camera error:', error);
        goToHome();
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
            const photoInfo = {
                data: photoData,
                width: canvas.width,
                height: canvas.height,
                aspectRatio: canvas.width / canvas.height
            };
            state.currentPhotos.push(photoInfo);
            updatePhotoPreview();
            
            if (state.currentPhotos.length > 0) {
                document.getElementById('finish-session-btn').style.display = 'flex';
            }
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
}

function updatePhotoPreview() {
    const container = document.getElementById('photo-preview-container');
    container.innerHTML = '';
    
    state.currentPhotos.forEach((photoInfo, index) => {
        const img = document.createElement('img');
        // Handle both old format (string) and new format (object)
        img.src = typeof photoInfo === 'string' ? photoInfo : photoInfo.data;
        img.className = 'photo-preview';
        
        // Set aspect ratio if available
        if (typeof photoInfo === 'object' && photoInfo.aspectRatio) {
            const previewHeight = 60;
            const previewWidth = previewHeight * photoInfo.aspectRatio;
            img.style.width = previewWidth + 'px';
            img.style.height = previewHeight + 'px';
        } else if (typeof photoInfo === 'string') {
            // For old format, load image to get aspect ratio
            const tempImg = new Image();
            tempImg.onload = function() {
                const aspectRatio = this.width / this.height;
                const previewHeight = 60;
                const previewWidth = previewHeight * aspectRatio;
                img.style.width = previewWidth + 'px';
                img.style.height = previewHeight + 'px';
                scrollToLatest();
            };
            tempImg.src = photoInfo;
        }
        
        container.appendChild(img);
    });
    
    // Auto-scroll to the newest photo
    scrollToLatest();
}

function scrollToLatest() {
    const container = document.getElementById('photo-preview-container');
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
        if (container.scrollWidth > container.clientWidth) {
            container.scrollTo({
                left: container.scrollWidth - container.clientWidth,
                behavior: 'smooth'
            });
        }
    }, 50);
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
    
    // Convert photo objects to data strings for storage
    const photosForStorage = state.currentPhotos.map(photoInfo => {
        return typeof photoInfo === 'string' ? photoInfo : photoInfo.data;
    });
    
    // Save photos to localStorage and navigate to selection page
    localStorage.setItem('currentPhotos', JSON.stringify(photosForStorage));
    window.location.href = 'selection.html';
}

function goToHome() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    window.location.href = 'home.html';
}

