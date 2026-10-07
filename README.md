# BRAIN-NEST Course Portal

This is a static HTML/CSS/JavaScript website served by a small Express API. The API uses MongoDB Atlas for the course catalog, student accounts, login sessions, and course registrations. Keep the frontend and API on the same origin; opening the HTML files directly will not connect to the database.

## Set up MongoDB Atlas

1. Create an Atlas cluster and a database user with read/write access to the database you will use.
2. Allow this machine's IP address in Atlas Network Access.
3. Copy the Atlas connection string into `.env.local` and replace the placeholders with your own values:

   ```dotenv
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
   ```

   URL-encode special characters in the database username or password. Do not commit `.env.local`.
4. Install dependencies and start the site from this directory:

   ```sh
   npm install
   npm start
   ```

   Use Node.js 18.18 or newer.
5. Open `http://localhost:3000`. On first startup, the API imports the initial course catalog from `js/courses.json` only when the MongoDB courses collection is empty. Subsequent catalog reads and registrations come from MongoDB.
6. On the sign-in page, choose **New student? Create an account** to create a student account. Passwords are hashed on the server, and login state is held in an HTTP-only cookie backed by MongoDB.

Set `PORT` to change the local server port. In production, serve the site over HTTPS so session cookies can use the `Secure` attribute.
