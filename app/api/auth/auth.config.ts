import { NextAuthOptions, DefaultUser } from "next-auth"
import GithubProvider, { GithubProfile } from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { Adapter } from "next-auth/adapters"
import clientPromise from "../../../lib/mongodb"
import { UserRole } from "@/lib/roles"

// 预定义管理员账号
const ADMIN_ACCOUNTS = {
  GITHUB: {
    id: '5675117',           // 你的GitHub ID
    email: 'hustwenchao@gmail.com'  // 你的GitHub邮箱
  }
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
    }
  }

  interface User extends DefaultUser {
    role?: UserRole;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends DefaultUser {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
    role?: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: 'read:user user:email'
        }
      },
      async profile(profile: GithubProfile) {
        console.log('GitHub profile:', profile);
        // 检查是否是管理员账号
        const isAdmin = 
          profile.id.toString() === ADMIN_ACCOUNTS.GITHUB.id || 
          profile.email === ADMIN_ACCOUNTS.GITHUB.email;

        console.log('Is admin check:', { 
          isAdmin,
          profileId: profile.id.toString(),
          adminId: ADMIN_ACCOUNTS.GITHUB.id,
          profileEmail: profile.email,
          adminEmail: ADMIN_ACCOUNTS.GITHUB.email
        });

        const role = isAdmin ? UserRole.ADMIN : UserRole.USER;

        // 立即更新数据库中的用户角色
        try {
          const client = await clientPromise;
          const db = client.db(process.env.MONGODB_DB_NAME);
          
          await db.collection('users').updateOne(
            { email: profile.email },
            { 
              $set: { 
                role: role
              } 
            },
            { upsert: true }
          );
          
          console.log('User role updated in profile:', { email: profile.email, role });
        } catch (error) {
          console.error('Error updating user role in profile:', error);
        }

        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: role
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign in callback:', { user, account, profile });
      if (!user?.email) {
        return false;
      }

      // 检查是否是管理员账号
      const isAdmin = 
        user.id === ADMIN_ACCOUNTS.GITHUB.id || 
        user.email === ADMIN_ACCOUNTS.GITHUB.email;

      // 设置用户角色
      user.role = isAdmin ? UserRole.ADMIN : UserRole.USER;
      console.log('User role set in signIn:', { email: user.email, role: user.role });

      return true;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token, user, account });
      if (user) {
        token.accessToken = account?.access_token;
        token.userId = user.id;
        token.role = user.role || (
          user.email === ADMIN_ACCOUNTS.GITHUB.email ? UserRole.ADMIN : UserRole.USER
        );
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (session?.user) {
        session.accessToken = token.accessToken as string;
        session.user.id = token.userId as string;
        session.user.role = token.role || (
          session.user.email === ADMIN_ACCOUNTS.GITHUB.email ? UserRole.ADMIN : UserRole.USER
        );
      }
      console.log('Final session:', session);
      return session;
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('Sign in event:', { user, account, profile });
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
};
