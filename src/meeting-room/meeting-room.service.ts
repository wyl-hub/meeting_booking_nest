import { BadRequestException, Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMeetingRoomDto } from './dto/create_meeting_room.dto';
import { UpdateMeetingRoomDto } from './dto/update_meeting_room.dto';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>;

  // 增
  async create(meetingRoomDto: CreateMeetingRoomDto) {
    const room = await this.repository.findOneBy({
      name: meetingRoomDto.name,
    });
    if (room) {
      throw new BadRequestException('会议室名称已存在');
    }

    await this.repository.insert(meetingRoomDto);
    return '创建成功';
  }

  // 删
  async deleteById(id: number) {
    await this.repository.delete({
      id,
    });
    return '删除成功';
  }

  // 改
  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    // 修改之前的 room 信息
    const room = await this.repository.findOneBy({
      id: meetingRoomDto.id,
    });

    if (!room) {
      throw new BadRequestException('会议室不存在');
    }
    const foundRoom = await this.repository.findOneBy({
      name: meetingRoomDto.name,
    });

    // 如果名字搜索没有结果 代表 名字唯一 可以直接修改
    // 如果名字搜索有结果
    // 1. 传入的名字和之前的是一样的  可以修改
    // 2. 传入的名字与其他会议室名称重复  不能修改 id判断
    if (foundRoom && foundRoom.id !== room.id) {
      throw new BadRequestException('会议室名称不能重复');
    }

    room.name = meetingRoomDto.name;
    room.capacity = meetingRoomDto.capacity;
    room.location = meetingRoomDto.location;
    room.equipment = meetingRoomDto.equipment;
    room.description = meetingRoomDto.description;

    await this.repository.update(
      {
        id: room.id,
      },
      room,
    );
    return '修改成功';
  }

  // 查
  async find(
    pageNo: number,
    pageSize: number,
    name: string,
    location: string,
    equipment: string,
    capacity: number,
  ) {
    if (pageNo < 1) {
      throw new BadRequestException('页码最小为1');
    }

    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {}
    if (name) condition.name = Like(`%${name}%`) 
    if (location) condition.location = Like(`%${location}%`)
    if (equipment) condition.equipment = Like(`%${equipment}%`)
    if (capacity) condition.capacity = Like(`%${capacity}%`)

    const [list, totalCount] = await this.repository.findAndCount({
      skip: skipCount,
      take: pageSize,
      where: condition
    });

    return {
      list,
      totalCount,
    };
  }

  async findById(id: number) {
    return await this.repository.findOneBy({
      id,
    });
  }
  async initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    await this.repository.insert([room1, room2, room3]);
  }
}
