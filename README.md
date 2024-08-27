# MapLocationTracker
Map Tracking Web App 

Overview
This project is a web-based map tracking application that allows users to log locations on a map with additional details. The application utilizes Leaflet for interactive mapping, Bootstrap for UI components, and PHP for server-side processing. Users can view and manage markers on the map, which are stored in a MySQL database.

Features
Interactive Map: Displays a map with various layers (Streets, Satellite, Dark Mode) that users can toggle between.
Geolocation Support: Centers the map on the user's current location and adds a marker there.
Location Logging: Users can click on the map to log a new location with a description and category.
Custom Markers: Uses a custom icon (poo emoji) for markers.
Data Storage: Locations and details are stored in a MySQL database.
Modal Form: A Bootstrap modal form collects additional details when a user clicks on the map to log a location.
Error Handling: Handles geolocation errors and prompts users to enable location services or use a secure connection.


Usage
Map Interaction: Click on the map to open a form where you can log a new location.
Form Submission: Fill out the details in the modal form and submit. The marker will be added to the map and stored in the database.
Viewing Reports: Existing reports are fetched from the database and displayed on the map with details.
Contributing
Feel free to submit pull requests, open issues, or suggest improvements. For major changes, please open an issue to discuss it first.

License
This project is licensed under the MIT License. See the LICENSE file for details.

Contact
For questions or comments, you can reach out to your-email@example.com.

