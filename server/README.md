# Portfolio Backend

This directory contains the backend code for my personal portfolio website. It is a Node.js application built with Express, responsible for handling the contact form, serving profile data, and managing project information.

## Stack

- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose for object data modeling.
- **Email**: Nodemailer for sending contact form confirmation emails.

## Project Structure

The backend handles contact form submissions from the portfolio's frontend. It stores the messages in a MongoDB Atlas database and sends a confirmation email to the visitor. It also provides several API endpoints to serve portfolio content like profile information, project details, and the resume.

## Setup

1. Copy `.env.example` to `.env`.
2. Replace `<db_password>` in `MONGODB_URI` with the password for the MongoDB Atlas database user.
3. Make sure your MongoDB Atlas Network Access allows the machine running the backend to connect.
4. Install dependencies:

```bash
npm install
```

5. Start the API:

```bash
npm run server
```

The API runs on `http://localhost:5000` by default.

## Endpoints

- `GET /api/health` - API/database health
- `GET /api/profile` - portfolio profile data
- `GET /api/projects` - project data
- `POST /api/contact` - stores a contact message in MongoDB
- `GET /api/resume` - serves `public/resume.pdf`

Contact messages are stored in the `portfolio` database in the `contactmessages` collection.

## Confirmation emails

When someone submits the contact form, the backend first stores the message in MongoDB and then sends a confirmation email to the email address submitted by the visitor.

Configure these variables in `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password-or-app-password
MAIL_FROM="Your Name <your-email@example.com>"
```

For Gmail, enable 2-Step Verification and create a Google App Password. Use the App Password as `SMTP_PASS`; do not use your normal Google account password.

If the SMTP service is unavailable, the contact message is still saved in MongoDB and the API returns `confirmationEmailSent: false` instead of losing the contact submission.
