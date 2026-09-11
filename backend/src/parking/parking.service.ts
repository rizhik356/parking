import {
    BadRequestException,
    ConflictException,
    Injectable,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {UpdateParkingDto} from "./dto/update-parking-dto";

interface ParkingRow {
    id: number;
    total_places: number;
    occupied_places: number;
}

export interface ParkingStatus {
    totalPlaces: number;
    occupiedPlaces: number;
    freePlaces: number;
}

@Injectable()
export class ParkingService {
    private readonly parkingId = 1;

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async getStatus(): Promise<ParkingStatus> {
        const result = await this.database.query<ParkingRow>(
            `
        SELECT
          id,
          total_places,
          occupied_places
        FROM parking
        WHERE id = $1
      `,
            [this.parkingId],
        );

        if (!result.rows.length) {
            throw new BadRequestException('Ошибка поиска паркинга');
        }

        const parking = result.rows[0];

        return {
            totalPlaces: parking.total_places,
            occupiedPlaces: parking.occupied_places,
            freePlaces:
                parking.total_places - parking.occupied_places,
        };
    }

    async entry(): Promise<ParkingStatus> {
        await this.database.transaction(async (client) => {
            const result = await client.query<ParkingRow>(
                `
          UPDATE parking
          SET occupied_places = occupied_places + 1
          WHERE id = $1
            AND occupied_places < total_places
          RETURNING
            id,
            total_places,
            occupied_places
        `,
                [this.parkingId],
            );

            if (!result.rows.length) {
                throw new ConflictException(
                    'Парковка заполнена',
                );
            }

            await client.query(
                `
          INSERT INTO parking_events (type)
          VALUES ('IN')
        `,
            );
        });

        return this.getStatus();
    }

    async exit(): Promise<ParkingStatus> {
        await this.database.transaction(async (client) => {
            const result = await client.query<ParkingRow>(
                `
          UPDATE parking
          SET occupied_places = occupied_places - 1
          WHERE id = $1
            AND occupied_places > 0
          RETURNING
            id,
            total_places,
            occupied_places
        `,
                [this.parkingId],
            );

            if (!result.rows.length) {
                throw new ConflictException(
                    'На парковке нет автомобилей',
                );
            }

            await client.query(
                `
          INSERT INTO parking_events (type)
          VALUES ('OUT')
        `,
            );
        });

        return this.getStatus();
    }

    async updateTotalPlaces({ totalPlaces }: UpdateParkingDto) {
        const result = await this.database.query<ParkingRow>(
            `
      UPDATE parking
      SET total_places = $1
      WHERE id = $2
        AND occupied_places <= $1
      RETURNING
        id,
        total_places,
        occupied_places
    `,
            [totalPlaces, this.parkingId],
        );

        if (!result.rows.length) {
            throw new BadRequestException(
                'Количество мест не может быть меньше количества занятых автомобилей',
            );
        }

        return this.getStatus();
    }

    async reset(): Promise<ParkingStatus> {
        await this.database.transaction(async (client) => {
            await client.query(
                `
        UPDATE parking
        SET occupied_places = 0
        WHERE id = $1
      `,
                [this.parkingId],
            );

            await client.query(
                `
        INSERT INTO parking_events (type)
        VALUES ('RESET')
      `,
            );
        });

        return this.getStatus();
    }
}