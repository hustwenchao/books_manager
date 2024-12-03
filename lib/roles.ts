export enum UserRole {
    USER = 'user',
    ADMIN = 'admin'
}

export interface UserWithRole {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
}

export const isAdmin = (user: UserWithRole | null): boolean => {
    return user?.role === UserRole.ADMIN;
};

export const isUser = (user: UserWithRole | null): boolean => {
    return user?.role === UserRole.USER;
};
