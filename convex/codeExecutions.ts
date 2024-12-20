import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const saveExecution = mutation({
    args: {
        language: v.string(),
        output: v.optional(v.string()),
        error: v.optional(v.string()),
    },
    handler: async(ctx, args) => {}
})