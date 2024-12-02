import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { checkAuth } from '../../../../lib/auth';

export async function PUT(request: Request) {
    try {
        // Check authentication
        const authError = await checkAuth();
        if (authError) return authError;

        const body = await request.json();
        const { 
            _id, 
            cn_name, 
            en_name, 
            author,
            cn_douban_link,
            en_douban_link,
            author_cn_name,
            author_wiki_link
        } = body;

        if (!_id) {
            return NextResponse.json(
                { error: 'Book ID is required' },
                { status: 400 }
            );
        }

        if (!cn_name?.trim() && !en_name?.trim()) {
            return NextResponse.json(
                { error: 'Either Chinese name or English name is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);

        const updateData = {
            ...(cn_name && { cn_name: cn_name.trim() }),
            ...(en_name && { en_name: en_name.trim() }),
            ...(author && { author: author.trim() }),
            ...(cn_douban_link && { cn_douban_link: cn_douban_link.trim() }),
            ...(en_douban_link && { en_douban_link: en_douban_link.trim() }),
            ...(author_cn_name && { author_cn_name: author_cn_name.trim() }),
            ...(author_wiki_link && { author_wiki_link: author_wiki_link.trim() })
        };

        const result = await db.collection("books").updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true,
            message: 'Book updated successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to update book' },
            { status: 500 }
        );
    }
}
