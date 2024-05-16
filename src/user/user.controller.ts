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
import { ApiBearerAuth, ApiBody, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDetailVo } from './vo/user_info.vo';
import { UserListVo } from './vo/user_list_vo';

export interface TokenInfo {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: Permission[];
  isAdmin: boolean;
}

class RefreshTokenVo {
  @ApiProperty()
  accessToke: string;
  @ApiProperty()
  refreshToken: string;
}
@ApiTags('用户管理模块')
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

  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户名不存在/密码错误',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和token',
    type: LoginUserVo,
  })
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);
    const { accessToken, refreshToken } = await this.disposeToken(vo.userInfo);
    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;
    return vo;
  }

  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户名不存在/密码错误',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和token',
    type: LoginUserVo,
  })
  @Post('admin_login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true);
    const { accessToken, refreshToken } = await this.disposeToken(vo.userInfo);
    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;
    return vo;
  }

  @ApiBody({
    type: RegisterUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String,
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  // 修改密码
  @ApiBearerAuth()
  @ApiBody({
    type: UpdatePasswordDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: String,
    description: '请输入该用户绑定邮箱/验证码已失效/验证码不正确'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: '密码修改成功/密码修改失败'
  })
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

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
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
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: UserDetailVo
  })
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('id') id: number) {
    return await this.userService.findUserUpdateById(id);
  }

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxxxxxxxyyyyyyyyzzzzz',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo
  })
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
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: 'user_id',
    type: Number
  })
  @ApiResponse({
    type: String,
    description: 'success'
  })
  @RequireLogin()
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'username',
    // required
  })
  @ApiResponse({
    type: UserListVo
  })
  @RequireLogin()
  @Get('list')
  async list(
    @Query('pageNo', ParseIntPipe) pageNo: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('username') username: string,
    @Query('email') email: string,
    @Query('nickName') nickName: string,
  ) {
    return await this.userService.findUsersByPage(
      pageNo,
      pageSize,
      username,
      email,
      nickName,
    );
  }
}
