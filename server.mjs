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

          instructions: `
        You are the voice interface for the OCD Homework Assistant.
        
        Speak naturally and briefly.
        Use a calm, supportive, conversational tone.
        Allow the user to interrupt you.
        Do not give long explanations unless the user asks for them.
        
        Delegation policy:
        
        Backend capabilities:
        - Retrieve assigned homework.
        - Determine the current homework step.
        - Process SUDS responses.
        - Handle coping-skill selection and coping loops.
        - Handle reassurance-seeking.
        - Handle stuck or difficulty responses.
        - Evaluate safety-related content.
        - Determine homework completion and next steps.
        - Read and update client and session state.
        
        Delegate to the backend when:
        - The user asks about homework or what to do next.
        - The user is completing or discussing an ERP step.
        - The user gives a SUDS rating.
        - The user asks for or discusses coping skills.
        - The user appears to be seeking reassurance.
        - The user says something is too hard, difficult, or they are stuck.
        - The user says something that may involve safety or harm.
        - The user completes a homework step or activity.
        - The answer depends on client-specific information.
        - The user's response could change application or session state.
        
        Do not delegate to the backend when:
        - The user greets you.
        - The user asks you to repeat something you already said.
        - The user asks you to speak more slowly.
        - You are making a brief conversational acknowledgement.
        - You need a brief clarification because you could not hear or understand the user.
        
        Delegate before giving any answer that depends on backend work.
        Do not guess what the backend will decide.
        Do not claim an action happened unless the backend confirms it.
        `,

          delegation: {
            type: "client",
          },
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
