import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export async function checkAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  
  return null;
}
