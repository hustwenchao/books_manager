import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { checkAuth } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Check authentication
        const authError = await checkAuth();
        if (authError) return authError;

        const body = await request.json();
        const { 
            cn_name, 
            en_name, 
            author, 
            cn_douban_link,
            en_douban_link,
            author_cn_name,
            author_wiki_link,
            forceAdd 
        } = body;

        if (!cn_name?.trim() && !en_name?.trim()) {
            return NextResponse.json(
                { error: 'Either Chinese name or English name is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        
        // Check for duplicates
        const query = {
            $or: [
                ...(cn_name ? [{ cn_name: cn_name.trim() }] : []),
                ...(en_name ? [{ en_name: en_name.trim() }] : [])
            ]
        };
        
        const existingBooks = await db.collection("books").find(query).toArray();
        
        if (existingBooks.length > 0 && !forceAdd) {
            return NextResponse.json({
                status: 'duplicate',
                duplicates: existingBooks,
                message: 'Similar books found in database'
            }, { status: 409 });
        }

        const result = await db.collection("books").insertOne({
            ...(cn_name && { cn_name: cn_name.trim() }),
            ...(en_name && { en_name: en_name.trim() }),
            ...(author && { author: author.trim() }),
            ...(cn_douban_link && { cn_douban_link: cn_douban_link.trim() }),
            ...(en_douban_link && { en_douban_link: en_douban_link.trim() }),
            ...(author_cn_name && { author_cn_name: author_cn_name.trim() }),
            ...(author_wiki_link && { author_wiki_link: author_wiki_link.trim() }),
            created_at: new Date()
        });

        return NextResponse.json({ 
            success: true, 
            id: result.insertedId 
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to add book' },
            { status: 500 }
        );
    }
}
