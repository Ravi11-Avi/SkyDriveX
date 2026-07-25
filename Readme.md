**SkyDriveX** 
A secure, scalable, and user-friendly cloud-based platform that allows users to store, organize, access, and manage their digital files online — built with the MERN Stack and integrated with AWS S3.

**Team Members**
Name	               UID
Ravi Ranjan Bhakt	   25MCC20020
Monika Agarwal	     25MCC20032

**About the Project**
SkyDriveX is a secure cloud-based file storage and management platform developed using the MERN Stack (MongoDB, Express.js, React.js, and Node.js) and integrated with Amazon Web Services (AWS).

The application provides every registered user with a private and secure personal account where they can store and manage their digital files. Users can upload various types of content, including documents, images, videos, audio files, PDFs, and other supported file formats.

The actual uploaded files are securely stored in Amazon S3, which provides scalable, durable, and highly available cloud storage. Information related to users, file names, folder structures, upload dates, file types, and S3 storage references is maintained in MongoDB Atlas.

The system follows a modern cloud-based architecture in which the React.js frontend, Node.js/Express.js backend, MongoDB Atlas database, and AWS S3 cloud storage work together as separate components — making the application scalable, maintainable, and suitable for real-world cloud deployment.

**Objectives**
Provide each user with a secure and private personal account.
Implement secure user registration and login using JWT authentication and Bcrypt password hashing.
Allow users to upload and manage different types of files such as documents, images, videos, audio files, and PDFs.
Store uploaded files securely on Amazon S3 cloud storage instead of the local server.
Provide file management features such as upload, download, preview, rename, move, search, and delete.
Allow users to create, rename, and delete folders for better organization of files.
Store user information, file metadata, folder details, and storage references in MongoDB Atlas.
Ensure that each user's files and folders remain private and isolated from other users.
Develop a responsive and user-friendly interface using React.js.
Apply modern cloud computing and full-stack development concepts in a real-world application.

**Feature**
Secure user registration and login (JWT + Bcrypt)
Upload documents, images, videos, audio, and PDFs
Create, rename, and delete folders
Search, preview, rename, move, and delete files
 Files stored securely on Amazon S3
File metadata and user info managed in MongoDB Atlas
User-specific authorization — access only to your own files/folders
Responsive and interactive UI built with React.js


**Tech Stack**
Frontend

React.js
Vite
HTML5, CSS3, JavaScript

Backend

Node.js
Express.js

Database

MongoDB Atlas

Cloud Storage

Amazon S3 (Simple Storage Service)

Authentication & Security

JWT (JSON Web Token)
Bcrypt (Password Hashing)

Tools

Git & GitHub — Version Control
Postman — API Testin


**Architecture**
React.js (Frontend)  <-->  Node.js / Express.js (Backend)  <-->  MongoDB Atlas (Database)
                                        |
                                        v
                                  Amazon S3 (File Storage)


                                  Getting Started
**Prerequisites**
Node.js and npm installed
MongoDB Atlas account
AWS account with an S3 bucket configured


**Installation**
# Clone the repository
git clone https://github.com/<your-username>/SkyDriveX.git
cd SkyDriveX

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install


Running the Application
# Start backend server
cd backend
npm start

# Start frontend (in a new terminal)
cd frontend
npm run dev


**Future Enhancements**
File sharing between users
File versioning
Drag-and-drop upload support
Dark mode UI
Mobile application


**License***
This project is developed for academic purposes.


**Acknowledgements**
Developed as part of the academic curriculum, applying modern cloud computing and full-stack development concepts in a real-world application.
