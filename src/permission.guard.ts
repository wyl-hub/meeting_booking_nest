import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private reflector: Reflector
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('require-permission', [
      context.getClass(),
      context.getHandler()
    ])

    // 没有权限限制 直接放行
    if (!requiredPermissions) return true

    // 用户没登录
    if (!request.user) {
      throw new UnauthorizedException('用户未登录')
    }
    
    // 每个权限都有 才能通过
    const permissions = request.user.permissions
    for (let i = 0; i < requiredPermissions.length; ++i) {
      const cur = requiredPermissions[i]
      const found = permissions.find(item => item.code === cur)
      if (!found) {
        throw new UnauthorizedException('您没有访问该接口的权限')
      }
    }
    return true;
  }
}
