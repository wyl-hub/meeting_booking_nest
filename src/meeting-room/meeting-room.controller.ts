import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { generateParseIntPipe } from 'src/utils';
import { CreateMeetingRoomDto } from './dto/create_meeting_room.dto';
import { UpdateMeetingRoomDto } from './dto/update_meeting_room.dto';

@Controller('meeting_room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  // 增
  @Post('create')
  async create(@Body() meetingRoomDto: CreateMeetingRoomDto) {
    return await this.meetingRoomService.create(meetingRoomDto);
  }

  // 删
  @Get('delete')
  async delete(@Query('id') id: number) {
    return await this.meetingRoomService.deleteById(id);
  }
  // 改
  @Post('update')
  async update(@Body() meetingRoomDto: UpdateMeetingRoomDto) {
    return await this.meetingRoomService.update(meetingRoomDto);
  }

  // 查
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('name') name: string,
    @Query('location') location: string,
    @Query('equipment') equipment: string,
    @Query('capacity') capacity: number,
  ) {
    return await this.meetingRoomService.find(
      pageNo,
      pageSize,
      name,
      location,
      equipment,
      capacity,
    );
  }

  // 回显
  @Get('find')
  async find(@Query('id') id: number) {
    return await this.meetingRoomService.findById(id);
  }
  @Get('initData')
  async initData() {
    await this.meetingRoomService.initData();
    return 'success';
  }
}
