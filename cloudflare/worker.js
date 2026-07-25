export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let key;

      if (path === "/stories") {
        key = "stories/index.json";
      } else if (path.match(/^\/stories\/[\w-]+$/)) {
        const storyId = path.split("/")[2];
        key = `stories/${storyId}.json`;
      } else if (path.match(/^\/chapters\/[\w-]+\/[\w-]+$/)) {
        const parts = path.split("/");
        key = `chapters/${parts[2]}/${parts[3]}.json`;
      } else {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const object = await env.TRUYEN_BUCKET.get(key);

      if (!object) {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const body = await object.text();
      return new Response(body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
