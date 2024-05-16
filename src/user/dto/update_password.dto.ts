import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class UpdatePasswordDto {
  @IsNotEmpty({
    message: '密码不能为空'
  })
  @MinLength(6, {
    message: '密码不能少于6位'
  })
  @ApiProperty({
    minLength: 6
  })
  password: string

  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  @IsEmail({}, {
    message: '不是合法的邮箱格式'
  })
  @ApiProperty()
  email: string

  @IsNotEmpty({
    message: '验证码不能为空'
  })
  @ApiProperty()
  captcha: string
}