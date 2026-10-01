import cors from "cors";
import express from "express";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();
const allowedOrigin = process.env.ALLOWED_ORIGIN?.trim();
const port = Number.parseInt(process.env.PORT || "3000", 10);

if (!apiKey) {
  throw new Error("[GPT-Live Session] OPENAI_API_KEY is required");
}

if (!allowedOrigin) {
  throw new Error("[GPT-Live Session] ALLOWED_ORIGIN is required");
}

const client = new OpenAI({
  apiKey,
});

const app = express();

app.use(
  cors({
    origin: allowedOrigin,
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/api/gpt-live/session",
  express.text({ type: "application/sdp", limit: "64kb" }),
  async (req, res) => {
    console.info("[GPT-Live Session] request", {
      origin: req.get("origin") ?? null,
    });

    const browserSdp =
      typeof req.body === "string"
        ? req.body
        : "";

    if (!browserSdp.trim()) {
      res.status(400).json({
        error: "missing_sdp",
      });
      return;
    }

    try {
      const live = await client.live.create({
        session: {
          model: "gpt-live-1",
        },
        transport: {
          type: "webrtc",
          sdp: browserSdp,
        },
      });

      res.json({
        session: live.session,
        transport: live.transport,
      });
    } catch (error) {
      const err =
        error && typeof error === "object"
          ? error
          : {};

      console.error("[GPT-Live Session] OpenAI request failed", {
        status: "status" in err ? err.status : null,
        message: "message" in err ? err.message : null,
        code: "code" in err ? err.code : null,
        type: "type" in err ? err.type : null,
        param: "param" in err ? err.param : null,
        requestId:
          "request_id" in err
            ? err.request_id
            : "requestID" in err
              ? err.requestID
              : null,
        error: "error" in err ? err.error : null,
      });

      res.status(502).json({
        error: "gpt_live_session_failed",
      });
    }
  }
);

app.listen(port, () => {
  console.info(`[GPT-Live Session] listening on port ${port}`);
});
