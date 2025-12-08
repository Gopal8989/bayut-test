import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templatesPath: string;

  constructor(private configService: ConfigService) {
    // Set templates path - works in both dev and production
    this.templatesPath = path.join(process.cwd(), 'src', 'email', 'templates');

    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = parseInt(this.configService.get<string>('SMTP_PORT', '587').toString(), 10);
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const secure = port === 465;

    if (user && password) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 1,
        maxMessages: 3,
        rateDelta: 1000,
        rateLimit: 5,
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3',
        },
      });

      // Verify connection asynchronously without blocking startup
      this.transporter.verify((error, success) => {
        if (error) {
          const errorCode = (error as any).code;
          const errorCommand = (error as any).command;
          
          console.warn(`SMTP Connection Error: ${error.message}`, {
            context: 'EmailService',
            errorCode,
            errorCommand,
            host,
            port,
            secure,
            user: user ? `${user.substring(0, 3)}***` : 'not set',
          });
          
          console.warn('Email service may not work properly. Check SMTP configuration.', {
            context: 'EmailService',
          });
          
          // Don't throw error, just log warning - email sending will be attempted but may fail
          console.warn('Troubleshooting:');
          console.warn('  1. Verify SMTP_HOST and SMTP_PORT are correct');
          console.warn('  2. Check firewall/network settings');
          console.warn('  3. For Gmail: Use App Password (not regular password)');
          console.warn('  4. Check if SMTP port is blocked by firewall');
          console.warn('  5. Try using port 587 with secure: false for STARTTLS');
        } else {
          console.log(`SMTP Server is ready to send emails (${host}:${port})`, {
            context: 'EmailService',
          });
        }
      });
    } else {
      this.transporter = null;
      console.warn('SMTP credentials not configured. Email service disabled.');
      console.warn('Set SMTP_USER and SMTP_PASSWORD in .env file to enable email sending.');
    }
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);
    return ejs.renderFile(templatePath, data);
  }

  private sanitizeInput(input: any): string {
    if (input === null || input === undefined) return '';
    const str = String(input);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  private validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.warn(`Email not sent to ${to}: SMTP not configured`);
      return null;
    }

    if (!this.validateEmail(to)) {
      console.error(`Invalid email address: ${to}`);
      return null;
    }

    if (!subject || !html) {
      console.error('Subject and HTML content are required');
      return null;
    }

    try {
      const info = await Promise.race([
        this.transporter.sendMail({
          from: this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER')),
          to: this.sanitizeInput(to),
          subject: this.sanitizeInput(subject),
          html,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 60 seconds')), 60000)
        ),
      ]) as any;
      
      console.log(`Email sent successfully to ${to}`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });
      return info;
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      const errorDetails: any = {
        code: errorCode,
        command: error.command,
        response: error.response,
      };

      if (errorCode === 'ETIMEDOUT' || errorMessage?.includes('timeout')) {
        console.error(`SMTP Connection Timeout sending email to ${to}`, {
          errorCode,
          errorMessage,
          host: this.configService.get('SMTP_HOST'),
          port: this.configService.get('SMTP_PORT'),
        });
        console.error('Possible causes:');
        console.error('  - SMTP server is unreachable');
        console.error('  - Firewall blocking connection');
        console.error('  - Incorrect SMTP_HOST or SMTP_PORT');
        console.error('  - Network connectivity issues');
      } else if (errorCode === 'EAUTH') {
        console.error(`SMTP Authentication Failed sending email to ${to}`, {
          errorCode,
          errorMessage,
          user: this.configService.get('SMTP_USER') ? `${this.configService.get('SMTP_USER')?.substring(0, 3)}***` : 'not set',
        });
        console.error('Possible causes:');
        console.error('  - Incorrect SMTP_USER or SMTP_PASSWORD');
        console.error('  - For Gmail: Use App Password instead of regular password');
      } else {
        console.error(`Error sending email to ${to}:`, errorMessage, {
          errorCode,
          errorDetails,
        });
      }

      return null;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    if (!this.validateEmail(email)) {
      console.error(`Invalid email address: ${email}`);
      return null;
    }
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const html = await this.renderTemplate('welcome', {
      firstName: this.sanitizeInput(firstName || 'User'),
      frontendUrl: this.sanitizeInput(frontendUrl),
    });
    return this.sendEmail(email, 'Welcome to Bayut Clone', html);
  }

  async sendPropertyListingEmail(email: string, propertyTitle: string) {
    if (!this.validateEmail(email)) {
      console.error(`Invalid email address: ${email}`);
      return null;
    }
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const html = await this.renderTemplate('property-listing', {
      propertyTitle: this.sanitizeInput(propertyTitle || 'Your Property'),
      frontendUrl: this.sanitizeInput(frontendUrl),
    });
    return this.sendEmail(email, 'Property Listed Successfully', html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    if (!this.validateEmail(email)) {
      console.error(`Invalid email address: ${email}`);
      return null;
    }
    if (!resetToken || resetToken.length < 10) {
      console.error('Invalid reset token');
      return null;
    }
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${this.sanitizeInput(resetToken)}`;
    const html = await this.renderTemplate('password-reset', {
      resetUrl: this.sanitizeInput(resetUrl),
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
    if (!this.validateEmail(agentEmail)) {
      console.error(`Invalid agent email address: ${agentEmail}`);
      return null;
    }
    if (!this.validateEmail(inquirerEmail)) {
      console.error(`Invalid inquirer email address: ${inquirerEmail}`);
      return null;
    }
    const html = await this.renderTemplate('property-inquiry', {
      propertyTitle: this.sanitizeInput(propertyTitle || 'Property'),
      inquirerName: this.sanitizeInput(inquirerName || 'Guest'),
      inquirerEmail: this.sanitizeInput(inquirerEmail),
      inquirerPhone: this.sanitizeInput(inquirerPhone || ''),
      message: this.sanitizeInput(message || 'No message provided'),
    });
    return this.sendEmail(agentEmail, `New Inquiry: ${this.sanitizeInput(propertyTitle || 'Property')}`, html);
  }
}
