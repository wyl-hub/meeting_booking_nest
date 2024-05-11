import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Query, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register.dto';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt'
import { LoginUserVo } from './vo/login_user.vo';
import { ConfigService } from '@nestjs/config';
import { Permission } from './entities/permission.entity';


export interface TokenInfo {
  id: number
  username: string,
  roles: string[]
  permissions: Permission[]
  isAdmin: boolean
}

@Controller('user')
export class UserController {
  @Inject(ConfigService)
  private configService: ConfigService
  @Inject(JwtService)
  private jwtService: JwtService
  @Inject(EmailService)
  private emailService: EmailService;
  @Inject(RedisService)
  private redisService: RedisService;

  constructor(private readonly userService: UserService) {}

  private async disposeToken(userInfo: TokenInfo) {
    const accessToken = this.jwtService.sign({
      userId: userInfo.id,
      usernmae: userInfo.username,
      roles: userInfo.roles,
      permissions: userInfo.permissions
    }, {
      expiresIn: this.configService.get('jwt_access_token_expires_time') || '30m'
    })

    const refreshToken = this.jwtService.sign({
      userId: userInfo.id,
      isAdmin: userInfo.isAdmin
    }, {
      expiresIn: this.configService.get('jwt_refresh_token_expires_time') || '7d'
    })
    return {
      accessToken,
      refreshToken
    }
  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false)
    const { accessToken, refreshToken } = await this.disposeToken(vo.userInfo)
    vo.accessToken = accessToken
    vo.refreshToken = refreshToken
    return vo
  }
  
  @Post('admin_login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true)
    const { accessToken, refreshToken } = await this.disposeToken(vo.userInfo)
    vo.accessToken = accessToken
    vo.refreshToken = refreshToken
    return vo
  }

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  @Get('register_captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);
    function validateEmail(email: string) {
      var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      return emailRegex.test(email);
    }
    if (!validateEmail(address)) {
      throw new HttpException('错误的邮箱格式', HttpStatus.BAD_REQUEST)
    }
    await this.redisService.set(`captcha_${address}`, code, 5 * 60);
    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是${code}</p>`,
    });
    return '发送成功';
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, data.isAdmin)
      return await this.disposeToken(user)
    } catch (err) {
      throw new UnauthorizedException('token 已失效，请重新登录')
    }
  }
  @Get('initData')
  async initData() {
    await this.userService.initData()
    return 'done'
  }
}
