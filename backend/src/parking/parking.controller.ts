import {
    Controller,
    Get,
    Post,
    Patch,
    UseGuards, Body,
} from '@nestjs/common';

import { ParkingService } from './parking.service';
import { ParkingSecretGuard } from './parking-secret.guard';
import {UpdateParkingDto} from "./dto/update-parking-dto";

@Controller('parking')
export class ParkingController {
    constructor(
        private readonly parkingService: ParkingService,
    ) {}

    @Get()
    getStatus() {
        return this.parkingService.getStatus();
    }

    @UseGuards(ParkingSecretGuard)
    @Post('entry')
    entry() {
        return this.parkingService.entry();
    }

    @UseGuards(ParkingSecretGuard)
    @Post('exit')
    exit() {
        return this.parkingService.exit();
    }

    @UseGuards(ParkingSecretGuard)
    @Post('reset')
    reset() {
        return this.parkingService.reset();
    }

    @UseGuards(ParkingSecretGuard)
    @Patch()
    updateTotalPlaces(@Body() dto: UpdateParkingDto) {
        return this.parkingService.updateTotalPlaces(
            dto
        );
    }
}