// Initialize the map
var map = L.map('map').setView([51.4401790, 0.3148198], 14);

// Define base layers
var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var satellite = L.tileLayer('https://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© Stamen Design'
});

var darkMode = L.tileLayer('https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© Stamen Design'
});

// Add a layer control to toggle between base layers
var baseLayers = {
    "Streets": streets,
    "Satellite": satellite,
    "Dark Mode": darkMode
};

L.control.layers(baseLayers).addTo(map);

// Define the custom icon using the poo emoji
var pooIcon = L.divIcon({
    className: 'custom-icon',
    html: '💩', // Poo emoji
    iconSize: [32, 32] // Adjust size as needed
});

// Function to handle successful geolocation
function onLocationSuccess(position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;

    // Set map view to the user's location
    map.setView([lat, lng], 14);

    // Optionally, add a marker at the user's location
    L.marker([lat, lng], { icon: pooIcon }).addTo(map)
        .bindPopup("You are here!")
        .openPopup();

    // Load existing reports from PHP
    loadReports();
}

// Function to handle geolocation errors
function onLocationError(error) {
    console.error("Geolocation error:", error);

    if (error.code === 1) {
        alert("Geolocation failed: Please allow location access or use a secure (HTTPS) connection.");
    } else {
        alert("Geolocation error: " + error.message);
    }

    // Default to a specific location if geolocation fails
    map.setView([51.4401790, 0.3148198], 14); // Center map on the restricted area
    loadReports();
}

// Check if geolocation is supported and get the user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
} else {
    console.error("Geolocation is not supported by this browser.");
    // Default to a specific location if geolocation is not supported
    map.setView([51.4371398,0.3082948], 14); // Center map on the restricted area
    loadReports();
}

// Handle map clicks
map.on('click', function(e) {
    var latlng = e.latlng;

    // Set latlng in the form
    document.getElementById('lat').value = latlng.lat;
    document.getElementById('lng').value = latlng.lng;

    // Show the modal
    $('#reportModal').modal('show');
});

// Handle form submission
document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    var lat = document.getElementById('lat').value;
    var lng = document.getElementById('lng').value;
    var description = document.getElementById('description').value;
    var category = document.getElementById('category').value;

    var formData = new FormData();
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    formData.append('description', description);
    formData.append('category', category);

    fetch('add_report.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        $('#reportModal').modal('hide'); // Hide the modal
        loadReports(); // Reload markers after submission
    })
    .catch(error => console.error('Error:', error));
});

// Load existing reports from PHP
function loadReports() {
    fetch('get_reports.php')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log("Loaded reports: ", data); // Debugging output

        // Clear existing markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        data.forEach(report => {
            var markerLatLng = [report.latitude, report.longitude];
            L.marker(markerLatLng, { icon: pooIcon }).addTo(map)
                .bindPopup(`<b>Category:</b> ${report.category}<br/><b>Description:</b> ${report.description}`)
                .openPopup();
        });
    })
    .catch(error => {
        console.error("Failed to load reports:", error);
    });
}
