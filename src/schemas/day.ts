import { z } from "zod";

export const PinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });
export const AdminPinSchema = z.object({ pin: z.string().regex(/^\d{6}$/) });

export const DayPatch = z.object({
  activity_type: z.enum(["riddle", "quiz", "creative", "kindness"]).optional(),
  activity_title: z.string().min(1).max(200).optional(),
  activity_body: z.string().min(1).max(5000).optional(),
  activity_answer: z.string().max(500).nullable().optional(),
  expected_minutes: z.number().int().min(1).max(120).optional(),
  media_type: z.enum(["video", "mystery_photos", "animated_postcard", "montage"]).optional(),
  coupon_text: z.string().min(1).max(300).optional(),
  points: z.number().int().min(0).max(100).optional(),
  media_config: z.record(z.string(), z.unknown()).optional(),
});

export const NewPinSchema = z.object({ new_pin: z.string().regex(/^\d{4}$/) });
export const NewAdminPinSchema = z.object({ new_pin: z.string().regex(/^\d{6}$/) });
