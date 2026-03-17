-- Migration 005: remove obsolete grade from enquiries
ALTER TABLE public.enquiries
  DROP COLUMN IF EXISTS grade;
