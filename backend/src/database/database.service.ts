import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });
    }

    async onModuleInit() {
        await this.pool.query('SELECT 1');
        console.log('Database connected');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    query<T extends QueryResultRow = any>(
        text: string,
        params?: unknown[],
    ) {
        return this.pool.query<T>(text, params);
    }

    async transaction<T>(
        callback: (client: PoolClient) => Promise<T>,
    ): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const result = await callback(client);

            await client.query('COMMIT');

            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}