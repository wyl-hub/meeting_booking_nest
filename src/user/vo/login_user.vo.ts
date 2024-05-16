import { ApiProperty } from "@nestjs/swagger"
import { Permission } from "../entities/permission.entity"

class UserInfo {
  @ApiProperty()
  id: number
  @ApiProperty({ example: 'zhangsan' })
  username: string
  @ApiProperty({ example: 'xx@xx.com' })
  email: string
  @ApiProperty({ example: '张三' })
  nickName: string
  @ApiProperty({ example: '152xxxxxxxx' })
  phoneNumber: string
  @ApiProperty()
  headPic: string
  @ApiProperty()
  isFrozen: boolean
  @ApiProperty()
  isAdmin: boolean
  @ApiProperty()
  createTime: Date
  @ApiProperty({ example: ['管理员'] })
  roles: string[]
  @ApiProperty({ example: 'query_aaa' })
  permissions: Permission[]
}

export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo
  @ApiProperty()
  accessToken: string
  @ApiProperty()
  refreshToken: string
}