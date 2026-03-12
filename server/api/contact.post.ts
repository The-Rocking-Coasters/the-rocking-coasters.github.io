import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, email, message, _honeypot } = body;

  // Basic spam protection: Honeypot field must be empty
  if (_honeypot) {
    // Silently reject by returning a success-like response to the bot
    // but without actually processing anything.
    return {
      success: true,
      message: 'Message received (bot filtered)'
    };
  }

  // Simple validation
  if (!name || !email || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name, email, and message are all required.'
    });
  }

  // In a real application, you would send an email here using a library like nodemailer
  // or a service like Mailgun, SendGrid, Postmark, or Formspree.
  // 
  // Example with a placeholder log:
  console.log('--- NEW CONTACT FORM SUBMISSION ---');
  console.log(`From: ${name} <${email}>`);
  console.log(`Message: ${message}`);
  console.log('------------------------------------');

  // Since this is a static site project, the user should provide their own
  // mail sending logic or use a third-party service.
  // We'll return a success response to indicate the submission was received by the API.

  return {
    success: true,
    message: 'Thank you! Your message has been received and we will get back to you soon.'
  };
});
