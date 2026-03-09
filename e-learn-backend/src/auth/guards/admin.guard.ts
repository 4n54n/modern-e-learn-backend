import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'];
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
