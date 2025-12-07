// Permissions Management
const permissions = {
    camera: { granted: false, requested: false },
    location: { granted: false, requested: false },
    orientation: { granted: false, requested: false }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkExistingPermissions();
});

function setupEventListeners() {
    document.getElementById('request-camera-btn').addEventListener('click', requestCameraPermission);
    document.getElementById('request-location-btn').addEventListener('click', requestLocationPermission);
    document.getElementById('request-orientation-btn').addEventListener('click', requestOrientationPermission);
    document.getElementById('continue-btn').addEventListener('click', continueToApp);
}

function checkExistingPermissions() {
    // Check camera permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
                permissions.camera.granted = true;
                updateCameraStatus('granted');
            })
            .catch(() => {
                updateCameraStatus('denied');
            });
    }

    // Check location permission
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            () => {
                permissions.location.granted = true;
                updateLocationStatus('granted');
            },
            () => {
                updateLocationStatus('denied');
            },
            { timeout: 1000 }
        );
    }

    // Check orientation permission (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Need to request permission
            updateOrientationStatus('pending');
        } else {
            // Permission not needed or already granted
            permissions.orientation.granted = true;
            updateOrientationStatus('granted');
        }
    } else {
        updateOrientationStatus('denied');
    }

    updateContinueButton();
}

async function requestCameraPermission() {
    if (permissions.camera.requested) return;
    
    permissions.camera.requested = true;
    updateCameraStatus('pending');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        permissions.camera.granted = true;
        updateCameraStatus('granted');
    } catch (error) {
        permissions.camera.granted = false;
        updateCameraStatus('denied');
    }
    
    updateContinueButton();
}

function requestLocationPermission() {
    if (permissions.location.requested) return;
    
    permissions.location.requested = true;
    updateLocationStatus('pending');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            () => {
                permissions.location.granted = true;
                updateLocationStatus('granted');
                updateContinueButton();
            },
            () => {
                permissions.location.granted = false;
                updateLocationStatus('denied');
                updateContinueButton();
            }
        );
    } else {
        permissions.location.granted = false;
        updateLocationStatus('denied');
        updateContinueButton();
    }
}

function requestOrientationPermission() {
    if (permissions.orientation.requested) return;
    
    permissions.orientation.requested = true;
    
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    permissions.orientation.granted = true;
                    updateOrientationStatus('granted');
                } else {
                    permissions.orientation.granted = false;
                    updateOrientationStatus('denied');
                }
                updateContinueButton();
            })
            .catch(error => {
                console.error('Orientation permission error:', error);
                permissions.orientation.granted = false;
                updateOrientationStatus('denied');
                updateContinueButton();
            });
    } else {
        // Permission not needed
        permissions.orientation.granted = true;
        updateOrientationStatus('granted');
        updateContinueButton();
    }
}

function updateCameraStatus(status) {
    const statusEl = document.getElementById('camera-status');
    const btn = document.getElementById('request-camera-btn');
    
    statusEl.className = 'status-badge ' + status;
    
    if (status === 'granted') {
        statusEl.textContent = 'Gewährt';
        btn.disabled = true;
        btn.textContent = '✓';
    } else if (status === 'denied') {
        statusEl.textContent = 'Abgelehnt';
        btn.disabled = false;
        btn.textContent = 'Erneut anfragen';
    } else {
        statusEl.textContent = 'Ausstehend';
        btn.disabled = false;
        btn.textContent = 'Anfragen';
    }
}

function updateLocationStatus(status) {
    const statusEl = document.getElementById('location-status');
    const btn = document.getElementById('request-location-btn');
    
    statusEl.className = 'status-badge ' + status;
    
    if (status === 'granted') {
        statusEl.textContent = 'Gewährt';
        btn.disabled = true;
        btn.textContent = '✓';
    } else if (status === 'denied') {
        statusEl.textContent = 'Abgelehnt';
        btn.disabled = false;
        btn.textContent = 'Erneut anfragen';
    } else {
        statusEl.textContent = 'Ausstehend';
        btn.disabled = false;
        btn.textContent = 'Anfragen';
    }
}

function updateOrientationStatus(status) {
    const statusEl = document.getElementById('orientation-status');
    const btn = document.getElementById('request-orientation-btn');
    
    statusEl.className = 'status-badge ' + status;
    
    if (status === 'granted') {
        statusEl.textContent = 'Gewährt';
        btn.disabled = true;
        btn.textContent = '✓';
    } else if (status === 'denied') {
        statusEl.textContent = 'Abgelehnt';
        btn.disabled = false;
        btn.textContent = 'Erneut anfragen';
    } else {
        statusEl.textContent = 'Ausstehend';
        btn.disabled = false;
        btn.textContent = 'Anfragen';
    }
}

function updateContinueButton() {
    const btn = document.getElementById('continue-btn');
    
    // Camera is required, others are optional
    if (permissions.camera.granted) {
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
}

function continueToApp() {
    // Save permission status
    localStorage.setItem('permissionsRequested', 'true');
    localStorage.setItem('cameraPermission', permissions.camera.granted ? 'granted' : 'denied');
    localStorage.setItem('locationPermission', permissions.location.granted ? 'granted' : 'denied');
    localStorage.setItem('orientationPermission', permissions.orientation.granted ? 'granted' : 'denied');
    
    // Navigate to home
    window.location.href = 'home.html';
}

