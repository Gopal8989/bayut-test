import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter;
  private templatesPath: string;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get('SMTP_HOST', 'smtp.gmail.com');
    const smtpPort = this.configService.get('SMTP_PORT', 587);
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPassword = this.configService.get('SMTP_PASSWORD');

    // Only create transporter if credentials are provided
    if (smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort.toString(), 10),
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Retry configuration
        pool: true,
        maxConnections: 1,
        maxMessages: 3,
      });

      // Verify connection on startup
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP Connection Error:', error.message);
          console.warn('Email service may not work properly. Check SMTP configuration.');
        } else {
          console.log('SMTP Server is ready to send emails');
        }
      });
    } else {
      console.warn('SMTP credentials not configured. Email service disabled.');
      console.warn('Set SMTP_USER and SMTP_PASSWORD in .env file to enable email sending.');
    }
    
    // Set templates path - works in both dev and production
    this.templatesPath = path.join(process.cwd(), 'src', 'email', 'templates');
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);
    return ejs.renderFile(templatePath, data);
  }

  async sendEmail(to: string, subject: string, html: string) {
    // Check if transporter is configured
    if (!this.transporter) {
      console.warn(`Email not sent to ${to}: SMTP not configured`);
      return null;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER')),
        to,
        subject,
        html,
      });
      console.log(`Email sent successfully to ${to}`);
      return info;
    } catch (error: any) {
      console.error('Error sending email:', error.message);
      console.error('SMTP Error Details:', {
        code: error.code,
        command: error.command,
        response: error.response,
      });
      
      // Don't throw error - log it and return null to prevent app crash
      // In production, you might want to queue failed emails for retry
      return null;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const html = await this.renderTemplate('welcome', {
      firstName,
      frontendUrl,
    });
    return this.sendEmail(email, 'Welcome to Bayut Clone', html);
  }

  async sendPropertyListingEmail(email: string, propertyTitle: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const html = await this.renderTemplate('property-listing', {
      propertyTitle,
      frontendUrl,
    });
    return this.sendEmail(email, 'Property Listed Successfully', html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = await this.renderTemplate('password-reset', {
      resetUrl,
    });
    return this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendPropertyInquiryEmail(
    agentEmail: string,
    propertyTitle: string,
    inquirerName: string,
    inquirerEmail: string,
    inquirerPhone: string,
    message: string,
  ) {
    const html = await this.renderTemplate('property-inquiry', {
      propertyTitle,
      inquirerName,
      inquirerEmail,
      inquirerPhone,
      message,
    });
    return this.sendEmail(agentEmail, `New Inquiry: ${propertyTitle}`, html);
  }
}

