import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../app/api/auth/auth.config";
import { isAdmin } from "./roles";

export async function checkAdminAuth() {
    console.log('Checking admin authentication...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
        console.log('No session found');
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }

    console.log('Session found:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
    });

    if (!isAdmin(session.user)) {
        console.log('User is not an admin');
        return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 }
        );
    }
    
    console.log('Admin access granted');
    return null;
}
