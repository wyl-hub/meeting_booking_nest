import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register.dto';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginUserVo } from './vo/login_user.vo';
import { ConfigService } from '@nestjs/config';
import { Permission } from './entities/permission.entity';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UpdatePasswordDto } from './dto/update_password.dto';

export interface TokenInfo {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: Permission[];
  isAdmin: boolean;
}

@Controller('user')
export class UserController {
  @Inject(ConfigService)
  private configService: ConfigService;
  @Inject(JwtService)
  private jwtService: JwtService;
  @Inject(EmailService)
  private emailService: EmailService;
  @Inject(RedisService)
  private redisService: RedisService;

  constructor(private readonly userService: UserService) {}

  private async disposeToken(userInfo: TokenInfo) {
    const signObj: TokenInfo = {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      roles: userInfo.roles,
      permissions: userInfo.permissions,
      isAdmin: userInfo.isAdmin,
    };
    const accessToken = this.jwtService.sign(signObj, {
      expiresIn:
        this.configService.get('jwt_access_token_expires_time') || '30m',
    });

    const refreshToken = this.jwtService.sign(
      {
        userId: userInfo.id,
        isAdmin: userInfo.isAdmin,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    console.log('loginUser', JSON.stringify(loginUser));
    const vo = await this.userService.login(loginUser, false);
    const { accessToken, refreshToken } = await this.disposeToken(vo.userInfo);
    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;
    return vo;
  }

  @Post('admin_login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true);
    const { accessToken, refreshToken } = await this.disposeToken(vo.userInfo);
    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;
    return vo;
  }

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  // 修改密码
  @Post('update_password')
  @RequireLogin()
  async updatePassword(
    @UserInfo() user: TokenInfo,
    @Body() updatePassword: UpdatePasswordDto,
  ) {
    if (user.email !== updatePassword.email) {
      throw new HttpException('请输入该用户绑定邮箱', HttpStatus.BAD_REQUEST);
    }
    return await this.userService.updateUserPassword(user, updatePassword);
  }

  @Get('register_captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);
    function validateEmail(email: string) {
      var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      return emailRegex.test(email);
    }
    if (!validateEmail(address)) {
      throw new HttpException('错误的邮箱格式', HttpStatus.BAD_REQUEST);
    }
    await this.redisService.set(`captcha_${address}`, code, 5 * 60);
    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是${code}</p>`,
    });
    return '发送成功';
  }

  // 获取用户信息
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('id') id: number) {
    return await this.userService.findUserUpdateById(id);
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(
        data.userId,
        data.isAdmin,
      );
      return await this.disposeToken(user);
    } catch (err) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }
  @Get('initData')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  // 冻结账户
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @Get('list')
  async list(
    @Query('pageNo', ParseIntPipe) pageNo: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('username') username: string,
    @Query('email') email: string,
    @Query('nickName') nickName: string,
  ) {
    return await this.userService.findUsersByPage(pageNo, pageSize, username, email, nickName);
  }
}
