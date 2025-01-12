Express.js REST API Service with JWT Authentication
This project is a REST API service built with Express.js that provides secure user authentication, file management, and user session handling using JWT tokens. The service is designed to be scalable, secure, and easy to integrate into client applications.

Features
Authentication
JWT-based authentication: Access tokens are issued for 10 minutes and can be renewed using a refresh token.
User authorization: Only authenticated users can access protected routes.
Logout functionality: Tokens are invalidated after logout.
File Management
Upload files with metadata (name, extension, MIME type, size, upload date) stored in a MySQL database.
Paginated file listing with customizable page size.
Update and delete files both in the database and local storage.
Download files and retrieve metadata for specific files.
Security
CORS configuration: Supports access from any domain.
Token invalidation: Ensures tokens cannot be reused after logout.
Refresh token mechanism: Secure renewal of expired access tokens.
Endpoints
Authentication Endpoints
POST /signin: Logs in a user and returns a JWT token pair (access and refresh tokens).
POST /signin/new-token: Renews the access token using a refresh token.
POST /signup: Registers a new user and returns a JWT token pair (access and refresh tokens).
GET /info: Returns the ID of the authenticated user.
GET /logout: Logs out the user and invalidates their tokens.
File Management Endpoints
POST /file/upload: Uploads a file, stores it locally, and saves its metadata to the database.
GET /file/list: Retrieves a paginated list of files with their metadata. Supports list_size (default: 10) and page (default: 1) query parameters.
DELETE /file/delete/:id: Deletes a file from local storage and the database.
GET /file/:id: Retrieves metadata for a specific file.
GET /file/download/:id: Downloads a specific file.
PUT /file/update/:id: Updates an existing file both in the database and local storage.
Database
The application uses MySQL as its database. The schema includes:

Users table: Stores user credentials (ID and password).
Files table: Stores file metadata, including name, extension, MIME type, size, and upload date.
Token Management
Access Token: Valid for 10 minutes.
Refresh Token: Used to renew the access token.
Tokens are securely managed, and user tokens are invalidated upon logout.
