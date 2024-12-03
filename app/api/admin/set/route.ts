import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth.config";
import { UserRole } from '@/lib/roles';

// This endpoint should only be accessible in development
export async function POST() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'This endpoint is only available in development mode' },
            { status: 403 }
        );
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        
        // Update user role to admin
        const result = await db.collection("users").updateOne(
            { email: session.user.email },
            { $set: { role: UserRole.ADMIN } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true,
            message: 'User role updated to admin'
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
