import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { q } from "framer-motion/client";

export const createSnippet = mutation({
    args: {
        title: v.string(),
        language: v.string(),
        code: v.string(),
    },

    handler: async( ctx, args ) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            throw new ConvexError("Not Authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_user_id")
            .filter((q) => q.eq(q.field("userId"), identity.subject))
            .first();
        
        if(!user){
            throw new ConvexError("User not found");
        }

        const snippetId = await ctx.db.insert("snippets", {
            userId: identity.subject,
            userName: user.name,
            title: args.title,
            language: args.language,
            code: args.code,
        });

        return snippetId;
    }
})

export const deleteSnippet = mutation({
    args: {
        snippetId: v.id("snippets")
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new ConvexError("Not authenticated");
        }

        const snippet = await ctx.db.get(args.snippetId);
        if(!snippet){
            throw new ConvexError("Snippet not found");
        }

        if(snippet.userId !== identity.subject){
            throw new ConvexError("Not authorized to delete this snippet");
        }

        const comments = await ctx.db
            .query("snippetComments")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .collect();
        
        for(const comment of comments){
            await ctx.db.delete(comment._id);
        }

        const stars = await ctx.db
            .query("stars")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .collect();

        for(const star of stars){
            await ctx.db.delete(star._id);
        }

        await ctx.db.delete(args.snippetId);
    }
})

export const starSnippet = mutation({
    args: {
        snippetId: v.id("snippets")
    },
    
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) throw new ConvexError("Not authenticated");

        const existing = await ctx.db
            .query("stars")
            .withIndex("by_user_id_and_snippet_id")
            .filter((q) => q.eq(q.field("userId"), identity.subject) && q.eq(q.field("snippetId"), args.snippetId))
            .first();

        if(existing){
            await ctx.db.delete(existing._id);
        }else {
            await ctx.db.insert("stars", {
                userId: identity.subject,
                snippetId: args.snippetId
            })
        }
    }
})

export const getAllSnippets = query({
    handler: async( ctx ) => {
        const snippets = await ctx.db.query("snippets").order("desc").collect();
        return snippets;
    }
})

export const isSnippetStarred = query({
    args: {
        snippetId: v.id("snippets")
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            throw new ConvexError("Not Authenticated");
        }

        const start = await ctx.db
            .query("stars")
            .withIndex("by_user_id_and_snippet_id")
            .filter((q) => q.eq(q.field("userId"), identity.subject) && q.eq(q.field("snippetId"), args.snippetId))
            .first();

        return !!start;
    }
})

export const getSnippetStarCount = query({
    args: {
        snippetId: v.id("snippets")
    },
    handler: async (ctx, args) => {
        const stars = await ctx.db
            .query("stars")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .collect();

        return stars.length;
    }
})
