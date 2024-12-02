import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { checkAuth } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Check authentication
        const authError = await checkAuth();
        if (authError) return authError;

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        
        let filter = {};
        if (query) {
            filter = {
                $or: [
                    { cn_name: { $regex: query, $options: 'i' } },
                    { en_name: { $regex: query, $options: 'i' } },
                    { author: { $regex: query, $options: 'i' } }
                ]
            };
        }

        const results = await db.collection("books")
            .find(filter)
            .sort({ created_at: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch books' },
            { status: 500 }
        );
    }
}
