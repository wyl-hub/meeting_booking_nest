import { Body, Controller, DefaultValuePipe, Get, Post } from '@nestjs/common';
import { BookingService } from './booking.service';
import { generateParseIntPipe } from 'src/utils';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('list')
  async list(
    @Body('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Body(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Body('username') username: string,
    @Body('roomName') roomName: string,
    @Body('roomPosition') roomPosition: string,
    @Body('bookingStartTime') bookingStartTime: number,
    @Body('bookingEndTime') bookingEndTime: number,
  ) {
    return this.bookingService.find(
      pageNo,
      pageSize,
      username,
      roomName,
      roomPosition,
      bookingStartTime,
      bookingEndTime,
    );
  }

  @Get('initData')
  async initData() {
    await this.bookingService.initData();
    return '初始化成功';
  }
}
