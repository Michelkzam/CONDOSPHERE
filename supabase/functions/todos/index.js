import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    // This handler validates user auth and provides an RLS-scoped client (ctx.supabase)
    // and an admin client that bypasses RLS (ctx.supabaseAdmin)
    const { data, error } = await ctx.supabase.from("users").select();
    if (error) {
        return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json(data);
  }),
}
