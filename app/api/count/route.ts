import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { checkAuth } from '../../../lib/auth';

export async function GET() {
    try {
        // Check authentication
        const authError = await checkAuth();
        if (authError) return authError;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        
        const count = await db.collection("books").countDocuments();
        
        return NextResponse.json({ count });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to get count' },
            { status: 500 }
        );
    }
}
