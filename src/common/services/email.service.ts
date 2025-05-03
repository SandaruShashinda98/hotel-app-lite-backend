import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IBooking } from '@interface/references/reference';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    // Initialize the nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  /**
   * Send booking confirmation email when a new booking is created
   */
  async sendBookingConfirmationEmail(booking: IBooking): Promise<boolean> {
    try {
      const hotelName = this.configService.get<string>('EMAIL_FROM_NAME');
      const hotelEmail = this.configService.get<string>('EMAIL_FROM');

      const mailOptions = {
        from: `"${hotelName}" <${hotelEmail}>`,
        to: booking.email,
        subject: `Booking Confirmation - ${hotelName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #3b82f6;">Booking Confirmation</h1>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear ${booking.customer_name},</p>
              <p>Thank you for your booking. We're excited to welcome you to ${hotelName}!</p>
              <p>Your booking has been confirmed with the following details:</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Check-in Date:</strong> ${new Date(booking.clock_in).toLocaleDateString()}</p>
              <p><strong>Check-out Date:</strong> ${new Date(booking.clock_out).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              ${booking.note ? `<p><strong>Special Notes:</strong> ${booking.note}</p>` : ''}
            </div>
            
            <div>
              <p>If you have any questions or need to make changes to your reservation, please contact us at ${hotelEmail} or call our reception desk.</p>
              <p>We look forward to making your stay memorable!</p>
              <p>Best regards,</p>
              <p>The ${hotelName} Team</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking confirmation email sent to ${booking.email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation email: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send booking update email when a booking is modified
   */
  async sendBookingUpdateEmail(booking: IBooking): Promise<boolean> {
    try {
      const hotelName = this.configService.get<string>('EMAIL_FROM_NAME');
      const hotelEmail = this.configService.get<string>('EMAIL_FROM');

      const mailOptions = {
        from: `"${hotelName}" <${hotelEmail}>`,
        to: booking.email,
        subject: `Booking Update - ${hotelName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #3b82f6;">Booking Update</h1>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear ${booking.customer_name},</p>
              <p>Your booking with ${hotelName} has been updated with the following details:</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Check-in Date:</strong> ${new Date(booking.clock_in).toLocaleDateString()}</p>
              <p><strong>Check-out Date:</strong> ${new Date(booking.clock_out).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              ${booking.note ? `<p><strong>Special Notes:</strong> ${booking.note}</p>` : ''}
            </div>
            
            <div>
              <p>If these changes do not match your expectations or if you have any questions, please contact us immediately at ${hotelEmail} or call our reception desk.</p>
              <p>We look forward to making your stay memorable!</p>
              <p>Best regards,</p>
              <p>The ${hotelName} Team</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking update email sent to ${booking.email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send booking update email: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send check-in/check-out notification email
   */
  async sendCheckInCheckoutEmail(booking: IBooking): Promise<boolean> {
    try {
      const hotelName = this.configService.get<string>('EMAIL_FROM_NAME');
      const hotelEmail = this.configService.get<string>('EMAIL_FROM');

      const isCheckIn = booking.is_checked_in && !booking.is_checked_out;
      const emailSubject = isCheckIn
        ? `Check-In Confirmation - ${hotelName}`
        : `Check-Out Confirmation - ${hotelName}`;
      const emailHeading = isCheckIn
        ? 'Check-In Confirmation'
        : 'Check-Out Confirmation';
      const messageContent = isCheckIn
        ? `We're pleased to confirm that you have successfully checked in to ${hotelName}. We hope you have a wonderful stay with us!`
        : `We're confirming that you have checked out from ${hotelName}. Thank you for choosing to stay with us, and we hope to welcome you back soon!`;

      const mailOptions = {
        from: `"${hotelName}" <${hotelEmail}>`,
        to: booking.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #3b82f6;">${emailHeading}</h1>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear ${booking.customer_name},</p>
              <p>${messageContent}</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Check-in Date:</strong> ${new Date(booking.clock_in).toLocaleDateString()}</p>
              <p><strong>Check-out Date:</strong> ${new Date(booking.clock_out).toLocaleDateString()}</p>
            </div>
            
            <div>
              ${
                isCheckIn
                  ? `<p>If you need any assistance during your stay, please don't hesitate to contact our reception desk.</p>`
                  : `<p>We hope you enjoyed your stay! If you have a moment, we would appreciate your feedback or a review of your experience.</p>`
              }
              <p>Best regards,</p>
              <p>The ${hotelName} Team</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `${isCheckIn ? 'Check-in' : 'Check-out'} email sent to ${booking.email}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send check-in/check-out email: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellationEmail(booking: IBooking): Promise<boolean> {
    try {
      const hotelName = this.configService.get<string>('EMAIL_FROM_NAME');
      const hotelEmail = this.configService.get<string>('EMAIL_FROM');

      const mailOptions = {
        from: `"${hotelName}" <${hotelEmail}>`,
        to: booking.email,
        subject: `Booking Cancellation - ${hotelName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #e11d48;">Booking Cancellation</h1>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear ${booking.customer_name},</p>
              <p>We're confirming that your booking with ${hotelName} has been cancelled as requested.</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p><strong>Original Check-in Date:</strong> ${new Date(booking.clock_in).toLocaleDateString()}</p>
              <p><strong>Original Check-out Date:</strong> ${new Date(booking.clock_out).toLocaleDateString()}</p>
              <p><strong>Status:</strong> Cancelled</p>
            </div>
            
            <div>
              <p>If you did not request this cancellation or if you have any questions, please contact us immediately at ${hotelEmail} or call our reception desk.</p>
              <p>We hope to have the opportunity to welcome you to ${hotelName} in the future.</p>
              <p>Best regards,</p>
              <p>The ${hotelName} Team</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking cancellation email sent to ${booking.email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send booking cancellation email: ${error.message}`,
      );
      return false;
    }
  }
}
