let map;
let selectedLocation;
window.mapMarkers = []; // Global array to hold markers so we can clear them when needed.

function initMap() {
    // Create the map and center it at a default location (in case geolocation fails)
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 51.436, lng: 0.308 }, // Default location
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT
        },
        streetViewControl: false // Disable Street View control

    });

    // Try to get the user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            // Center the map at the user's location
            map.setCenter(userLocation);
            // Optionally, place a marker at the user's location
            new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "You are here"
            });
        }, function () {
            console.error("Geolocation failed");
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }

    loadMarkers(30); // Load markers for the last 30 days by default.

    // Listen for map clicks to open the category selection modal.
    map.addListener('click', function (e) {
        selectedLocation = e.latLng;
        $('#categoryModal').modal('show');
    });
}

// Handle category form submission to save the marker.
$('#categoryForm').on('submit', function (e) {
    e.preventDefault();
    const category = $('#categorySelect').val();
    if (category) {
        placeMarkerAndSave(selectedLocation, category);
        $('#categoryModal').modal('hide');
    }
});

// Function to get emoji based on category.
function getEmojiForCategory(category) {
    switch (category) {
        case 'Poop': return '💩';
        case 'Litter': return '🚯';
        case 'Fly Tipping': return '🪰';
        case 'Construction': return '🚧';
        case 'Water Pressure': return '🚰';
        case 'No Internet': return '🌐';
        case 'Parking': return '🏎️';
        case 'Water Leak': return '💦';
        default: return '❓'
    }
}

// Function to place a marker and save its data to the server.
function placeMarkerAndSave(location, category) {
    const emoji = getEmojiForCategory(category);
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        icon: {
            url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text y="20" font-size="20">${emoji}</text></svg>`,
            scaledSize: new google.maps.Size(32, 32)
        }
    });

    // Save marker to server.
    $.ajax({
        url: 'save_marker.php',
        method: 'POST',
        data: {
            latitude: location.lat(),
            longitude: location.lng(),
            category: category
        }
    });
}

// Event listener for the range slider to filter markers based on days.
document.getElementById('dayRange').addEventListener('input', function () {
    const daysAgo = this.value;
    document.getElementById('dayRangeLabel').textContent = daysAgo;
    loadMarkers(daysAgo); // Call loadMarkers function with the selected number of days.
});

// Function to load markers based on the selected number of days ago.
function loadMarkers(daysAgo) {
    $.ajax({
        url: 'get_markers.php',
        method: 'GET',
        success: function (data) {
            const markers = JSON.parse(data);
            const today = new Date();
            const cutoffDate = new Date(today);
            cutoffDate.setDate(today.getDate() - daysAgo);

            // Clear existing markers from the map.
            if (window.mapMarkers) {
                window.mapMarkers.forEach(marker => marker.setMap(null));
            }
            window.mapMarkers = [];

            markers.forEach(function (markerData) {
                const markerDate = new Date(markerData.created_at);

                // Only show markers created after the cutoff date.
                if (markerDate >= cutoffDate) {
                    const emoji = getEmojiForCategory(markerData.category);
                    const marker = new google.maps.Marker({
                        position: { lat: parseFloat(markerData.latitude), lng: parseFloat(markerData.longitude) },
                        map: map,
                        icon: {
                            url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text y="20" font-size="20">${emoji}</text></svg>`,
                            scaledSize: new google.maps.Size(32, 32)
                        }
                    });

                    // Store marker in the array to manage clearing them later.
                    window.mapMarkers.push(marker);

                    // Create InfoWindow to display information on marker hover.
                    const infoWindow = new google.maps.InfoWindow({
                        content: `Category: ${markerData.category}<br>Date & Time: ${markerData.created_at}`
                    });

                    marker.addListener('mouseover', function () {
                        infoWindow.open(map, marker);
                    });

                    marker.addListener('mouseout', function () {
                        infoWindow.close();
                    });
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error loading markers:', error);
        }
    });
}


// Modal Charts
$('#statisticsModal').on('shown.bs.modal', function () {
    $.getJSON('get_marker_counts.php', function (data) {
        const categories = data.map(item => item.category);
        const counts = data.map(item => item.count);
        const timestamps = data.map(item => item.created_at); // Ensure this is in a valid date format

        // Bar Chart: Reports by Category
        const barCtx = document.getElementById('barChart').getContext('2d');
        if (window.barChart instanceof Chart) {
            window.barChart.destroy();
        }
        window.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Reports by Category',
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        formatter: (value) => value,
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            },
            plugins: [ChartDataLabels] // Add the plugin here
        });
    });
});


// Function to display a message and hide it after 5 seconds
function showMessage(message, type) {
    const messageBox = $('#messageBox');
    const messageContent = $('#messageContent');

    messageContent.text(message);

    // Apply different styles for success or error messages
    if (type === 'success') {
        messageBox.css({
            'background-color': '#d4edda',
            'color': '#155724',
            'border': '1px solid #c3e6cb'
        });
    } else {
        messageBox.css({
            'background-color': '#f8d7da',
            'color': '#721c24',
            'border': '1px solid #f5c6cb'
        });
    }

    messageBox.fadeIn();

    // Hide the message after 2 seconds
    setTimeout(function () {
        messageBox.fadeOut();
    }, 2000);
}

// Handle report problem form submission.
$('#reportProblemForm').on('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission behavior

    // Get form values
    const problemCategory = $('#problemCategory').val();
    const problemDescription = $('#problemDescription').val();

    // Validate form input
    if (problemCategory && problemDescription) {
        // Send the form data to the server using AJAX
        $.ajax({
            url: 'report_issue.php',  // PHP script to handle the report submission
            method: 'POST',
            data: {
                category: problemCategory,  
                description: problemDescription
            },
            success: function (response) {
                const jsonResponse = JSON.parse(response);
                if (jsonResponse.status === 'success') {
                    // Show a success message
                    showMessage('Thank you for your report! We appreciate your feedback.', 'success');

                    // Automatically dismiss the modal after 2 seconds
                    setTimeout(function () {
                        $('#reportProblemModal').modal('hide');  // Hide the modal
                    }, 100);  // 1000 milliseconds = 1 seconds

                    // Clear the form after successful submission
                    $('#reportProblemForm')[0].reset();  
                } else {
                    showMessage('Sorry, something went wrong. Please try again.', 'error');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                showMessage('Sorry, something went wrong. Please try again.', 'error');
            }
        });
    } else {
        showMessage('Please fill in all fields before submitting.', 'error');
    }
});

// Function to display a message and hide it after 2 seconds
function showMessage(message, type) {
    const messageBox = $('#messageBox');
    const messageContent = $('#messageContent');

    messageContent.text(message);

    // Apply different styles for success or error messages
    if (type === 'success') {
        messageBox.css({
            'background-color': '#d4edda',
            'color': '#155724',
            'border': '1px solid #c3e6cb'
        });
    } else {
        messageBox.css({
            'background-color': '#f8d7da',
            'color': '#721c24',
            'border': '1px solid #f5c6cb'
        });
    }

    messageBox.fadeIn();

    // Hide the message after 3 seconds
    setTimeout(function () {
        messageBox.fadeOut();
    }, 3000);
}

