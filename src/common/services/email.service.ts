import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { IBooking } from '@interface/references/reference';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

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
   * Send an onboarding email to a newly created user
   * @param userEmail The email of the user
   * @param tempPassword The temporary password generated for the user
   * @param resetToken The token for password reset
   */
  async sendOnboardingEmail(
    userEmail: string,
    tempPassword: string,
    resetToken: string,
    resetMethod: string,
  ): Promise<boolean> {
    try {
      const appUrl = this.configService.get<string>(
        'APP_URL',
        'http://localhost:3000',
      );
      const resetLink = `${appUrl}/register-account?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(userEmail)}&method=${encodeURIComponent(resetMethod)}`;

      const mailOptions = {
        from: `"${this.configService.get<string>('EMAIL_FROM_NAME', 'System Admin')}" <${this.configService.get<string>('EMAIL_FROM')}>`,
        to: userEmail,
        subject: 'Welcome to RingHD - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to RingHD!</h2>
            <p>Your account has been created successfully. Please find your login details below:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            
            <p>To register and create your own password, click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #38b2ac; color: white; padding: 12px 20px; text-decoration: none; border-radius: 20px; font-weight: bold;">
                Register your account
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>If you did not request this account, please ignore this email or contact our support team.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Onboarding email sent to ${userEmail}: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send onboarding email to ${userEmail}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Send a booking confirmation email to the customer
   * @param bookingData The booking information
   * @returns boolean Success/failure of the email sending
   */
  async sendBookingEmail(bookingData: IBooking): Promise<boolean> {
    try {
      const {
        customer_name,
        mobile_number,
        clock_in,
        clock_out,
        status,
        room,
        note,
      } = bookingData;

      // Format dates for better readability
      const checkInDate = new Date(clock_in).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const checkInTime = new Date(clock_in).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const checkOutDate = new Date(clock_out).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const checkOutTime = new Date(clock_out).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Calculate number of nights
      const nights = Math.ceil(
        (new Date(clock_out).getTime() - new Date(clock_in).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Calculate total price if room information is available
      const totalPrice = room?.price_per_night
        ? room.price_per_night * nights
        : null;

      // Get the hotel name from config
      const hotelName = this.configService.get<string>(
        'HOTEL_NAME',
        'INNFUSION',
      );

      // Get customer email - you might need to add this to your booking interface
      // For now, we'll construct an email from the mobile number as a fallback if there's no email in the data
      const customerEmail =
        bookingData.email ||
        `${customer_name.replace(/\s+/g, '').toLowerCase()}@example.com`;

      // Status color and text
      let statusColor = '#FFC107'; // Default yellow for pending
      let statusText = 'Booking Pending';

      switch (status) {
        case 'confirmed':
          statusColor = '#4CAF50'; // Green
          statusText = 'Booking Confirmed';
          break;
        case 'completed':
          statusColor = '#2196F3'; // Blue
          statusText = 'Stay Completed';
          break;
        case 'canceled':
          statusColor = '#F44336'; // Red
          statusText = 'Booking Canceled';
          break;
      }

      const mailOptions = {
        from: `"${this.configService.get<string>('EMAIL_FROM_NAME', hotelName)}" <${this.configService.get<string>('EMAIL_FROM')}>`,
        to: customerEmail,
        subject: `${statusText} - ${hotelName} Booking #${bookingData._id?.toString().slice(-8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 5px; overflow: hidden;">
            <!-- Header -->
            <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
              <h2 style="margin: 0;">${statusText}</h2>
            </div>
            
            <!-- Booking information -->
            <div style="padding: 20px;">
              <p>Dear ${customer_name},</p>
              <p>Thank you for choosing ${hotelName}. Here are your booking details:</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Booking Reference:</strong> #${bookingData._id?.toString().slice(-8) || 'New Booking'}</p>
                <p style="margin: 5px 0;"><strong>Guest Name:</strong> ${customer_name}</p>
                <p style="margin: 5px 0;"><strong>Contact Number:</strong> ${mobile_number}</p>
                <p style="margin: 5px 0;"><strong>Check-in:</strong> ${checkInDate} at ${checkInTime}</p>
                <p style="margin: 5px 0;"><strong>Check-out:</strong> ${checkOutDate} at ${checkOutTime}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${nights} night${nights > 1 ? 's' : ''}</p>
                ${
                  room
                    ? `
                  <p style="margin: 5px 0;"><strong>Room:</strong> ${room.name} (${room.room_number})</p>
                  <p style="margin: 5px 0;"><strong>Room Type:</strong> ${room.room_type}</p>
                  <p style="margin: 5px 0;"><strong>Rate per Night:</strong> $${room.price_per_night.toFixed(2)}</p>
                  ${totalPrice ? `<p style="margin: 5px 0;"><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>` : ''}
                `
                    : ''
                }
                ${note ? `<p style="margin: 5px 0;"><strong>Special Notes:</strong> ${note}</p>` : ''}
              </div>
              
              ${
                status === 'confirmed'
                  ? `
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                  <p style="margin: 5px 0;"><strong>Your booking is confirmed!</strong></p>
                  <p style="margin: 5px 0;">We're looking forward to welcoming you on ${checkInDate}.</p>
                </div>
              `
                  : ''
              }
              
              ${
                status === 'pending'
                  ? `
                <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FFC107;">
                  <p style="margin: 5px 0;"><strong>Your booking is pending confirmation.</strong></p>
                  <p style="margin: 5px 0;">We're processing your request and will update you shortly.</p>
                </div>
              `
                  : ''
              }
              
              ${
                status === 'canceled'
                  ? `
                <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F44336;">
                  <p style="margin: 5px 0;"><strong>Your booking has been canceled.</strong></p>
                  <p style="margin: 5px 0;">If you did not request this cancellation, please contact us immediately.</p>
                </div>
              `
                  : ''
              }
              
              <p>If you have any questions or need to modify your booking, please contact us:</p>
              <p>
                <strong>Phone:</strong> ${this.configService.get<string>('HOTEL_PHONE', '+1 234 567 8900')}<br>
                <strong>Email:</strong> ${this.configService.get<string>('HOTEL_EMAIL', 'reservations@hotel.com')}
              </p>
              
              <p style="margin-top: 20px;">We hope you enjoy your stay with us!</p>
              <p>Warm regards,<br>The ${hotelName} Team</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} ${hotelName}. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Booking email sent to ${customerEmail}: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send booking email:`, error);
      return false;
    }
  }
}
