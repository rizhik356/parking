import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ParkingSecretGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const apiKey = request.headers['x-api-key'];

        if (!apiKey || apiKey !== process.env.API_SECRET) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }
}