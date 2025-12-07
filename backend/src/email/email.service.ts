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
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        pool: true,
        maxConnections: 1,
        maxMessages: 3,
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
      });

      this.transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP Connection Error:', error.message);
          console.error('SMTP Configuration:', {
            host,
            port,
            secure,
            user,
            // The 'code' and 'command' properties may not exist on generic Error, so cast to any
            errorCode: (error as any).code,
            errorCommand: (error as any).command,
          });
          console.warn('Email service may not work properly. Check SMTP configuration.');
          console.warn('Troubleshooting:');
          console.warn('  1. Verify SMTP_HOST and SMTP_PORT are correct');
          console.warn('  2. Check firewall/network settings');
          console.warn('  3. For Gmail: Use App Password (not regular password)');
          console.warn('  4. Ensure "Less secure app access" is enabled (if using Gmail)');
        } else {
          console.log(`SMTP Server is ready to send emails (${host}:${port})`);
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
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER')),
        to: this.sanitizeInput(to),
        subject: this.sanitizeInput(subject),
        html,
      });
      console.log(`Email sent successfully to ${to}`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });
      return info;
    } catch (error: any) {
      const errorDetails: any = {
        code: error.code,
        command: error.command,
        response: error.response,
      };

      if (error.code === 'ETIMEDOUT') {
        console.error(`SMTP Connection Timeout sending email to ${to}`);
        console.error('Possible causes:');
        console.error('  - SMTP server is unreachable');
        console.error('  - Firewall blocking connection');
        console.error('  - Incorrect SMTP_HOST or SMTP_PORT');
        console.error('  - Network connectivity issues');
      } else if (error.code === 'EAUTH') {
        console.error(`SMTP Authentication Failed sending email to ${to}`);
        console.error('Possible causes:');
        console.error('  - Incorrect SMTP_USER or SMTP_PASSWORD');
        console.error('  - For Gmail: Use App Password instead of regular password');
      } else {
        console.error(`Error sending email to ${to}:`, error.message);
      }

      console.error('SMTP Error Details:', errorDetails);
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
