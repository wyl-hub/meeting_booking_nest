import { ApiProperty } from "@nestjs/swagger"


export class UserDetailVo {
  @ApiProperty()
  id: number
  @ApiProperty()
  username: string
  @ApiProperty()
  email: string
  @ApiProperty()
  nickName: string
  @ApiProperty()
  phoneNumber: string
  @ApiProperty()
  headPic: string
  @ApiProperty()
  isFrozen: boolean
  @ApiProperty()
  createTime: Date
}