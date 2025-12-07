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
            state.currentPhotos.push(photoData);
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
    
    // Save photos to localStorage and navigate to selection page
    localStorage.setItem('currentPhotos', JSON.stringify(state.currentPhotos));
    window.location.href = 'selection.html';
}

function goToHome() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    window.location.href = 'home.html';
}

