import { Inngest } from "inngest";

export const inngest = new Inngest({
  name: "Serenity Ai",
  id: "serenity-ai",
  eventKey: process.env.INNGEST_EVENT_KEY!,
});

export const functions: any[] = [];