import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('admin/login')
    @HttpCode(HttpStatus.OK)
    async adminLogin(@Body() signInDto: AdminLoginDto) {
        return this.authService.adminLogin(signInDto.email, signInDto.password);
    }
}
