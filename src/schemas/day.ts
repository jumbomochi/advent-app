import { z } from "zod";

export const PinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });
