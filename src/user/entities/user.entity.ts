import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './role.entity';
@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    comment: '用户名',
  })
  username: string;

  @Column({
    length: 50,
    comment: '密码',
  })
  password: string;

  @Column({
    name: 'nick_name',
    length: 50,
    comment: '昵称',
  })
  nickName: string;

  @Column({
    length: 50,
    comment: '邮箱',
  })
  email: string

  @Column({
    name: 'head_pic',
    nullable: true,
    length: 100,
    comment: '头像'
  })
  headPic: string

  @Column({
    name: 'phone_number',
    nullable: true,
    length: 20,
    comment: '手机号'
  })
  phoneNumber: string

  @Column({
    name: 'is_frozen',
    default: false,
    comment: '是否冻结'
  })
  isFrozen: boolean

  @Column({
    name: 'is_admin',
    default: false,
    comment: '是否是管理员'
  })
  isAdmin: boolean

  @CreateDateColumn()
  createTime: Date

  @UpdateDateColumn()
  updateTime: Date

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles'
  })
  roles: Role[]
}
