import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register.dto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login.dto';
import { LoginUserVo } from './vo/login_user.vo';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  // 登录
  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new HttpException('用户名不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.password !== md5(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const vo = new LoginUserVo();
    // 权限对象去重
    const permissionId: number[] = [];
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      headPic: user.headPic,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      isFrozen: user.isFrozen,
      createTime: user.createTime,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr: Permission[], role) => {
        role.permissions.forEach((permission) => {
          if (permissionId.indexOf(permission.id) === -1) {
            permissionId.push(permission.id);
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
    return vo;
  }
  // 注册
  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (user.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = user.username;
    newUser.nickName = user.nickName;
    newUser.password = md5(user.password);
    newUser.email = user.email;

    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '注册失败';
    }
  }

  // 根据Id查询用户
  async findUserById(id: number, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: { id, isAdmin },
      relations: ['roles', 'roles.permissions'],
    });
    // 权限对象去重
    const permissionId: number[] = [];
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr: Permission[], role) => {
        role.permissions.forEach((permission) => {
          if (permissionId.indexOf(permission.id) === -1) {
            permissionId.push(permission.id);
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }
  // 初始化数据
  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = md5('111111');
    user1.email = 'zhangsan@xx.com';
    user1.isAdmin = true;
    user1.nickName = '张三';
    user1.phoneNumber = '13212341234';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5('123456');
    user2.email = 'lisi@xx.com';
    user2.nickName = '李四';

    const role1 = new Role();
    role1.name = '管理员';
    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问ccc接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问ddd接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }
}
