import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: any;
  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '125207180@qq.com',
        pass: 'eufkrqmkohlqbjia',
      },
    });
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: 'meeting_booking',
        address: '125207180@qq.com',
      },
      to,
      subject,
      html,
    });
  }
}
