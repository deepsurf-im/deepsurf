import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deepsurf</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #000000;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-box {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 40px;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 24px;
      filter: brightness(0);
    }
    h1 {
      color: #000000;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 16px;
      letter-spacing: -0.5px;
    }
    p {
      color: #000000;
      font-size: 16px;
      margin: 0 0 16px;
      opacity: 0.8;
    }
    .highlight {
      color: #000000;
      font-weight: 600;
      opacity: 1;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #000000;
      color: #000000;
      font-size: 14px;
      opacity: 0.6;
    }
    .gradient-text {
      color: #000000;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-box">
      <img src="https://deepsurf.ai/favicon.svg" alt="Deepsurf Logo" class="logo">
      ${content}
      <div class="footer">
        <p>This is an automated message from Deepsurf</p>
        <p>© ${new Date().getFullYear()} Deepsurf. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Send email to admin
    await resend.emails.send({
      from: 'Deepsurf Waitlist <onboarding@resend.dev>',
      to: 'sagirisharris@gmail.com',
      subject: 'New Waitlist Signup',
      html: emailTemplate(`
        <h1>New Waitlist Signup</h1>
        <p>A new user has joined the Deepsurf waitlist:</p>
        <p class="highlight">${email}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `),
    });
    // Send confirmation email to user
    await resend.emails.send({
      from: 'Deepsurf Waitlist <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to the Deepsurf Waitlist!',
      html: emailTemplate(`
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 36px; margin-bottom: 20px; color: #000000;">Welcome to Deepsurf</h1>
          <p style="font-size: 20px; line-height: 1.6; margin-bottom: 24px; color: #000000;">Thank you for joining our waitlist. We're thrilled to have you on board! 🚀</p>
        </div>

        <div style="background: #ffffff; padding: 32px; border-radius: 16px; margin-bottom: 40px; border: 1px solid #000000;">
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 24px; margin-bottom: 16px; color: #000000;">What's Next?</h2>
            <p style="font-size: 16px; line-height: 1.7; margin-bottom: 16px; color: #000000;">We're building something revolutionary - an AI-powered web search experience that will change how you interact with the internet.</p>
            <p style="font-size: 16px; line-height: 1.7; color: #000000;">You'll be among the first to experience it when we launch.</p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 40px;">
          <a href="https://x.com/deepsurfapp" style="display: inline-block; background: #000000; color: #ffffff; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 18px; margin-right: 16px;">Follow on X</a>
          <a href="https://deepsurf.im" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 18px; border: 1px solid #000000;">Visit Deepsurf</a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #000000;">
          <p style="font-size: 14px; color: #000000; margin-bottom: 8px;">Questions? Just reply to this email!</p>
          <p style="font-size: 14px; color: #000000;">We're here to help and excited to have you join our journey.</p>
        </div>
      `),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to process waitlist signup' },
      { status: 500 }
    );
  }
} 