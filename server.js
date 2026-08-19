const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API Proxy endpoint for the chatbot
app.post('/api/chat', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "API key not configured on server" } });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        res.status(500).json({ error: { message: "Internal server error connecting to AI provider." } });
    }
});

// API endpoint for contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: { message: "Name, email, and message are required fields." } });
        }

        console.log(`[Contact Form Message Received] From: ${name} <${email}> - Message: ${message}`);

        // If SMTP credentials are configured in environment variables, dispatch via Nodemailer
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                await transporter.sendMail({
                    from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
                    to: process.env.CONTACT_RECEIVER_EMAIL || 'kelvenhwong@gmail.com',
                    replyTo: email,
                    subject: `New Portfolio Message from ${name}`,
                    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
                    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`,
                });
                return res.json({ success: true, message: "Email dispatched via SMTP successfully." });
            } catch (smtpErr) {
                console.error("SMTP dispatch error:", smtpErr);
            }
        }

        // Return success response (with log output) if no SMTP credentials set
        res.json({ success: true, message: "Contact form message received successfully." });
    } catch (error) {
        console.error("Error processing contact form message:", error);
        res.status(500).json({ error: { message: "Internal server error processing contact message." } });
    }
});

// For any other route, send the index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
