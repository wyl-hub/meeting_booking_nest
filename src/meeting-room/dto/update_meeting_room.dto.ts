import { PartialType } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";
import { CreateMeetingRoomDto } from "./create_meeting_room.dto";



export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {
  @IsNotEmpty({
    message: 'id 不能为空'
  })
  id: number
}